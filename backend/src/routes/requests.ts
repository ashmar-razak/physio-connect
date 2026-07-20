import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { serializeApplication, serializeBooking, serializeCoverRequest } from "../serializers";
import { certificationTypeSchema, coverTypeSchema, urgencySchema } from "../utils/enums";
import { haversineMiles } from "../utils/distance";
import { geocodeLocation } from "../utils/geocode";

const router = Router();

const createSchema = z.object({
  dateNeeded: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  venueName: z.string().min(1),
  venuePostcode: z.string().min(1),
  sport: z.string().min(1),
  ageGroup: z.string().min(1),
  coverType: coverTypeSchema,
  requiresDbs: z.boolean().optional(),
  minCertification: certificationTypeSchema.optional(),
  budget: z.number().positive().optional(),
  urgency: urgencySchema.optional(),
  notes: z.string().optional(),
});

router.post(
  "/",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const club = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!club) throw new HttpError(404, "Club profile not found");

    const request = await prisma.coverRequest.create({
      data: { ...body, clubProfileId: club.id },
    });
    res.status(201).json({ request: serializeCoverRequest(request) });
  })
);

const searchSchema = z.object({
  status: z.string().optional(),
  sport: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusMiles: z.coerce.number().positive().optional(),
});

// GET /requests — browse open cover requests (physios shopping for jobs).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = searchSchema.parse(req.query);

    const requests = await prisma.coverRequest.findMany({
      where: {
        status: query.status ?? "OPEN",
        ...(query.sport ? { sport: { contains: query.sport } } : {}),
      },
      include: { clubProfile: true, applications: true },
      orderBy: { createdAt: "desc" },
    });

    let results = requests.map((r) => serializeCoverRequest(r));

    if (query.lat !== undefined && query.lng !== undefined) {
      results = requests
        .map((r) => {
          const distanceMiles =
            r.clubProfile.latitude !== null && r.clubProfile.longitude !== null
              ? haversineMiles({ latitude: query.lat!, longitude: query.lng! }, { latitude: r.clubProfile.latitude!, longitude: r.clubProfile.longitude! })
              : undefined;
          return { ...serializeCoverRequest(r), distanceMiles };
        })
        .filter((r) => query.radiusMiles === undefined || r.distanceMiles === undefined || r.distanceMiles <= query.radiusMiles!)
        .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
    }

    res.json({ requests: results });
  })
);

router.get(
  "/mine",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const club = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!club) throw new HttpError(404, "Club profile not found");

    const requests = await prisma.coverRequest.findMany({
      where: { clubProfileId: club.id },
      include: { clubProfile: true, applications: { include: { physioProfile: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ requests: requests.map((r) => ({ ...serializeCoverRequest(r), applications: r.applications.map(serializeApplication) })) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const request = await prisma.coverRequest.findUnique({
      where: { id: req.params.id },
      include: { clubProfile: true, applications: true },
    });
    if (!request) throw new HttpError(404, "Cover request not found");
    res.json({ request: serializeCoverRequest(request) });
  })
);

router.patch(
  "/:id/cancel",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const club = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!club) throw new HttpError(404, "Club profile not found");

    const request = await prisma.coverRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.clubProfileId !== club.id) throw new HttpError(404, "Cover request not found");

    const updated = await prisma.coverRequest.update({ where: { id: request.id }, data: { status: "CANCELLED" } });
    res.json({ request: serializeCoverRequest(updated) });
  })
);

const applySchema = z.object({ message: z.string().optional() });

router.post(
  "/:id/apply",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const body = applySchema.parse(req.body);
    const physio = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!physio) throw new HttpError(404, "Physio profile not found");

    const request = await prisma.coverRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new HttpError(404, "Cover request not found");
    if (request.status !== "OPEN") throw new HttpError(400, "This request is no longer open");

    const existing = await prisma.application.findUnique({
      where: { coverRequestId_physioProfileId: { coverRequestId: request.id, physioProfileId: physio.id } },
    });
    if (existing) throw new HttpError(409, "You already applied to this request");

    const application = await prisma.application.create({
      data: { coverRequestId: request.id, physioProfileId: physio.id, message: body.message },
      include: { physioProfile: true, coverRequest: true },
    });
    res.status(201).json({ application: serializeApplication(application) });
  })
);

router.get(
  "/:id/applications",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const club = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!club) throw new HttpError(404, "Club profile not found");

    const request = await prisma.coverRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.clubProfileId !== club.id) throw new HttpError(404, "Cover request not found");

    const applications = await prisma.application.findMany({
      where: { coverRequestId: request.id },
      include: { physioProfile: { include: { certifications: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ applications: applications.map(serializeApplication) });
  })
);

router.get(
  "/applications/mine",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const physio = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!physio) throw new HttpError(404, "Physio profile not found");

    const applications = await prisma.application.findMany({
      where: { physioProfileId: physio.id },
      include: { coverRequest: { include: { clubProfile: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ applications: applications.map(serializeApplication) });
  })
);

router.post(
  "/applications/:applicationId/withdraw",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const physio = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!physio) throw new HttpError(404, "Physio profile not found");

    const application = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!application || application.physioProfileId !== physio.id) throw new HttpError(404, "Application not found");
    if (application.status !== "PENDING") throw new HttpError(400, "Only pending applications can be withdrawn");

    const updated = await prisma.application.update({ where: { id: application.id }, data: { status: "WITHDRAWN" } });
    res.json({ application: serializeApplication(updated) });
  })
);

// Accept an application: confirms the booking, marks the request MATCHED,
// and auto-declines every other pending application for that request.
router.post(
  "/applications/:applicationId/accept",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const club = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!club) throw new HttpError(404, "Club profile not found");

    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { coverRequest: true },
    });
    if (!application || application.coverRequest.clubProfileId !== club.id) {
      throw new HttpError(404, "Application not found");
    }
    if (application.coverRequest.status !== "OPEN") throw new HttpError(400, "This request is no longer open");

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          coverRequestId: application.coverRequestId,
          applicationId: application.id,
          physioProfileId: application.physioProfileId,
          clubProfileId: club.id,
        },
        include: { physioProfile: true, clubProfile: true, coverRequest: true },
      });

      await tx.application.update({ where: { id: application.id }, data: { status: "ACCEPTED" } });
      await tx.application.updateMany({
        where: { coverRequestId: application.coverRequestId, id: { not: application.id }, status: "PENDING" },
        data: { status: "DECLINED" },
      });
      await tx.coverRequest.update({ where: { id: application.coverRequestId }, data: { status: "MATCHED" } });

      return created;
    });

    res.status(201).json({ booking: serializeBooking(booking) });
  })
);

router.post(
  "/applications/:applicationId/decline",
  requireAuth,
  requireRole("CLUB"),
  asyncHandler(async (req, res) => {
    const club = await prisma.clubProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!club) throw new HttpError(404, "Club profile not found");

    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { coverRequest: true },
    });
    if (!application || application.coverRequest.clubProfileId !== club.id) {
      throw new HttpError(404, "Application not found");
    }

    const updated = await prisma.application.update({ where: { id: application.id }, data: { status: "DECLINED" } });
    res.json({ application: serializeApplication(updated) });
  })
);

export default router;
