import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { serializeClub } from "../serializers";
import { geocodeLocation } from "../utils/geocode";
import { getRatingStats } from "../utils/ratingStats";

const router = Router();

router.get(
  "/me",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const profile = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new HttpError(404, "Club profile not found");

    const stats = await getRatingStats(profile.userId);
    res.json({ club: serializeClub(profile, stats) });
  })
);

const updateSchema = z.object({
  clubName: z.string().min(1).optional(),
  sport: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  contactRole: z.string().optional(),
  phone: z.string().optional(),
  locationText: z.string().min(1).optional(),
});

router.patch(
  "/me",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body);
    const existing = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!existing) throw new HttpError(404, "Club profile not found");

    let geoUpdate = {};
    if (body.locationText && body.locationText !== existing.locationText) {
      const geo = await geocodeLocation(body.locationText);
      geoUpdate = { latitude: geo?.latitude, longitude: geo?.longitude };
    }

    const updated = await prisma.clubProfile.update({
      where: { userId: req.user!.userId },
      data: { ...body, ...geoUpdate },
    });

    const stats = await getRatingStats(updated.userId);
    res.json({ club: serializeClub(updated, stats) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await prisma.clubProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) throw new HttpError(404, "Club not found");

    const stats = await getRatingStats(profile.userId);
    res.json({ club: serializeClub(profile, stats) });
  })
);

export default router;
