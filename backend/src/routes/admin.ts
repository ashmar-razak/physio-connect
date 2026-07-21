import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { serializeDocument, serializePhysio } from "../serializers";
import { documentStatusSchema } from "../utils/enums";
import { getRatingStats, getRatingStatsBulk } from "../utils/ratingStats";

const router = Router();

// Every route here is staff-only — ADMIN accounts are never self-registered,
// only seeded/provisioned directly (see prisma/seed.ts).
router.use(requireAuth, requireRole("ADMIN"));

const PHYSIO_INCLUDE = { user: true, certifications: true, documents: true } as const;

// GET /admin/verification-queue — physios with an unverified registration
// or at least one document still awaiting review.
router.get(
  "/verification-queue",
  asyncHandler(async (_req, res) => {
    const physios = await prisma.physioProfile.findMany({
      where: {
        OR: [{ registrationVerified: false }, { documents: { some: { status: "PENDING" } } }],
      },
      include: PHYSIO_INCLUDE,
      orderBy: { createdAt: "asc" },
    });

    const ratingStats = await getRatingStatsBulk(physios.map((p) => p.userId));

    res.json({
      physios: physios.map((profile) => ({
        ...serializePhysio(profile, ratingStats.get(profile.userId) ?? { averageRating: null, ratingCount: 0 }),
        email: profile.user.email,
        pendingDocumentCount: profile.documents.filter((d) => d.status === "PENDING").length,
      })),
    });
  })
);

router.get(
  "/physios/:id",
  asyncHandler(async (req, res) => {
    const profile = await prisma.physioProfile.findUnique({
      where: { id: req.params.id },
      include: PHYSIO_INCLUDE,
    });
    if (!profile) throw new HttpError(404, "Physio not found");

    const stats = await getRatingStats(profile.userId);
    res.json({ physio: { ...serializePhysio(profile, stats), email: profile.user.email } });
  })
);

const verifyRegistrationSchema = z.object({ verified: z.boolean() });

router.post(
  "/physios/:id/registration-verification",
  asyncHandler(async (req, res) => {
    const { verified } = verifyRegistrationSchema.parse(req.body);

    const profile = await prisma.physioProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) throw new HttpError(404, "Physio not found");

    const updated = await prisma.physioProfile.update({
      where: { id: profile.id },
      data: { registrationVerified: verified },
      include: PHYSIO_INCLUDE,
    });

    const stats = await getRatingStats(updated.userId);
    res.json({ physio: { ...serializePhysio(updated, stats), email: updated.user.email } });
  })
);

const reviewDocumentSchema = z.object({
  status: documentStatusSchema.refine((s) => s !== "PENDING", "Review must set APPROVED or REJECTED"),
  note: z.string().optional(),
});

router.post(
  "/documents/:id/review",
  asyncHandler(async (req, res) => {
    const body = reviewDocumentSchema.parse(req.body);

    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) throw new HttpError(404, "Document not found");

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: { status: body.status, reviewNote: body.note, reviewedAt: new Date() },
    });
    res.json({ document: serializeDocument(updated) });
  })
);

export default router;
