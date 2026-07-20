import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { serializeBooking, serializeRating } from "../serializers";

const router = Router();

async function loadOwnedBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { physioProfile: true, clubProfile: true, coverRequest: true, ratings: true },
  });
  if (!booking) throw new HttpError(404, "Booking not found");
  if (booking.physioProfile.userId !== userId && booking.clubProfile.userId !== userId) {
    throw new HttpError(403, "You are not part of this booking");
  }
  return booking;
}

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, role } = req.user!;

    const bookings = await prisma.booking.findMany({
      where:
        role === "PHYSIO"
          ? { physioProfile: { userId } }
          : { clubProfile: { userId } },
      include: { physioProfile: true, clubProfile: true, coverRequest: true, ratings: true },
      orderBy: { confirmedAt: "desc" },
    });
    res.json({ bookings: bookings.map(serializeBooking) });
  })
);

router.post(
  "/:id/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await loadOwnedBooking(req.params.id, req.user!.userId);
    if (booking.completedAt) {
      res.json({ booking: serializeBooking(booking) });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { completedAt: new Date() },
        include: { physioProfile: true, clubProfile: true, coverRequest: true, ratings: true },
      }),
      prisma.coverRequest.update({ where: { id: booking.coverRequestId }, data: { status: "COMPLETED" } }),
    ]);

    res.json({ booking: serializeBooking(updated) });
  })
);

const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

router.post(
  "/:id/ratings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = ratingSchema.parse(req.body);
    const booking = await loadOwnedBooking(req.params.id, req.user!.userId);
    if (!booking.completedAt) throw new HttpError(400, "The booking must be completed before it can be rated");

    const isPhysio = booking.physioProfile.userId === req.user!.userId;
    const ratedId = isPhysio ? booking.clubProfile.userId : booking.physioProfile.userId;

    const existing = await prisma.rating.findUnique({
      where: { bookingId_raterId: { bookingId: booking.id, raterId: req.user!.userId } },
    });
    if (existing) throw new HttpError(409, "You already rated this booking");

    const rating = await prisma.rating.create({
      data: { bookingId: booking.id, raterId: req.user!.userId, ratedId, score: body.score, comment: body.comment },
    });
    res.status(201).json({ rating: serializeRating(rating) });
  })
);

router.get(
  "/:id/ratings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await loadOwnedBooking(req.params.id, req.user!.userId);
    res.json({ ratings: booking.ratings.map(serializeRating) });
  })
);

export default router;
