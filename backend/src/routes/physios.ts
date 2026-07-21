import { Router } from "express";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { upload, UPLOADS_DIR } from "../middleware/upload";
import { serializeCertification, serializeDocument, serializePhysio } from "../serializers";
import { certificationTypeSchema, documentTypeSchema, insuranceCoverageSchema, registrationBodySchema } from "../utils/enums";
import { haversineMiles } from "../utils/distance";
import { geocodeLocation } from "../utils/geocode";
import { getRatingStats, getRatingStatsBulk } from "../utils/ratingStats";
import { getInsuranceDocumentSet, hasInsuranceDocument } from "../utils/insuranceDocuments";
import { trustTierForCertCount, trustTierRank, TrustTier } from "../utils/trustTier";

const router = Router();

const searchSchema = z.object({
  sport: z.string().optional(),
  certification: certificationTypeSchema.optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minTrustTier: z.enum(["UNVERIFIED", "STANDARD", "BRONZE", "SILVER", "GOLD"]).optional(),
  insuredForPitchside: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusMiles: z.coerce.number().positive().optional(),
});

// GET /physios — browse & filter. Ranked by trust tier, then rating, then distance.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = searchSchema.parse(req.query);

    const physios = await prisma.physioProfile.findMany({
      where: {
        ...(query.sport ? { sports: { contains: query.sport } } : {}),
        ...(query.certification
          ? { certifications: { some: { type: query.certification } } }
          : {}),
      },
      include: { certifications: true },
    });

    const ratingStats = await getRatingStatsBulk(physios.map((p) => p.userId));
    const insuranceDocSet = await getInsuranceDocumentSet(physios.map((p) => p.id));

    let results = physios.map((profile) => {
      const stats = ratingStats.get(profile.userId) ?? { averageRating: null, ratingCount: 0 };
      const distanceMiles =
        query.lat !== undefined && query.lng !== undefined && profile.latitude !== null && profile.longitude !== null
          ? haversineMiles({ latitude: query.lat, longitude: query.lng }, { latitude: profile.latitude!, longitude: profile.longitude! })
          : undefined;

      return serializePhysio(profile, { ...stats, distanceMiles, hasInsuranceDocument: insuranceDocSet.has(profile.id) });
    });

    if (query.minRating !== undefined) {
      results = results.filter((p) => (p.averageRating ?? 0) >= query.minRating!);
    }
    if (query.minTrustTier) {
      const minRank = trustTierRank(query.minTrustTier as TrustTier);
      results = results.filter((p) => trustTierRank(p.trustTier) >= minRank);
    }
    if (query.insuredForPitchside) {
      results = results.filter((p) => p.insuranceStatus === "VERIFIED");
    }
    if (query.radiusMiles !== undefined && query.lat !== undefined && query.lng !== undefined) {
      results = results.filter((p) => p.distanceMiles !== undefined && p.distanceMiles <= query.radiusMiles!);
    }

    results.sort((a, b) => {
      const tierDiff = trustTierRank(b.trustTier) - trustTierRank(a.trustTier);
      if (tierDiff !== 0) return tierDiff;
      const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      if (a.distanceMiles !== undefined && b.distanceMiles !== undefined) return a.distanceMiles - b.distanceMiles;
      return 0;
    });

    res.json({ physios: results });
  })
);

router.get(
  "/me",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const profile = await prisma.physioProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { certifications: true, documents: true },
    });
    if (!profile) throw new HttpError(404, "Physio profile not found");

    const stats = await getRatingStats(profile.userId);
    res.json({ physio: serializePhysio(profile, stats) });
  })
);

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  locationText: z.string().min(1).optional(),
  travelRadiusMiles: z.number().int().positive().optional(),
  registrationBody: registrationBodySchema.optional(),
  registrationNumber: z.string().min(1).optional(),
  yearsExperience: z.number().int().min(0).optional(),
  dayRate: z.number().positive().nullable().optional(),
  sports: z.array(z.string().min(1)).min(1).optional(),
  hasInsurance: z.boolean().optional(),
  insurer: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiryDate: z.coerce.date().optional(),
  insuranceCoversPitchside: insuranceCoverageSchema.optional(),
});

router.patch(
  "/me",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body);
    const existing = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!existing) throw new HttpError(404, "Physio profile not found");

    let geoUpdate = {};
    if (body.locationText && body.locationText !== existing.locationText) {
      const geo = await geocodeLocation(body.locationText);
      geoUpdate = { latitude: geo?.latitude, longitude: geo?.longitude };
    }

    const updated = await prisma.physioProfile.update({
      where: { userId: req.user!.userId },
      data: {
        ...body,
        ...geoUpdate,
        sports: body.sports ? body.sports.join(",") : undefined,
      },
      include: { certifications: true, documents: true },
    });

    const stats = await getRatingStats(updated.userId);
    res.json({ physio: serializePhysio(updated, stats) });
  })
);

// GET /physios/:id — public profile detail.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await prisma.physioProfile.findUnique({
      where: { id: req.params.id },
      include: { certifications: true },
    });
    if (!profile) throw new HttpError(404, "Physio not found");

    const stats = await getRatingStats(profile.userId);
    const hasInsuranceDoc = await hasInsuranceDocument(profile.id);
    res.json({ physio: serializePhysio(profile, { ...stats, hasInsuranceDocument: hasInsuranceDoc }) });
  })
);

const certSchema = z.object({
  type: certificationTypeSchema,
  otherName: z.string().optional(),
  issuingBody: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

router.post(
  "/me/certifications",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const body = certSchema.parse(req.body);
    const profile = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new HttpError(404, "Physio profile not found");

    const cert = await prisma.certification.create({
      data: { ...body, physioProfileId: profile.id },
    });
    res.status(201).json({ certification: serializeCertification(cert) });
  })
);

router.patch(
  "/me/certifications/:certId",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const body = certSchema.partial().parse(req.body);
    const profile = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new HttpError(404, "Physio profile not found");

    const cert = await prisma.certification.findUnique({ where: { id: req.params.certId } });
    if (!cert || cert.physioProfileId !== profile.id) throw new HttpError(404, "Certification not found");

    const updated = await prisma.certification.update({ where: { id: cert.id }, data: body });
    res.json({ certification: serializeCertification(updated) });
  })
);

router.delete(
  "/me/certifications/:certId",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const profile = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new HttpError(404, "Physio profile not found");

    const cert = await prisma.certification.findUnique({ where: { id: req.params.certId } });
    if (!cert || cert.physioProfileId !== profile.id) throw new HttpError(404, "Certification not found");

    await prisma.certification.delete({ where: { id: cert.id } });
    res.status(204).end();
  })
);

router.post(
  "/me/documents",
  requireAuth,
  requireRole("PHYSIO"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "No file uploaded");

    const type = documentTypeSchema.safeParse(req.body.type);
    if (!type.success) {
      await fs.unlink(path.join(UPLOADS_DIR, req.file.filename)).catch(() => {});
      throw new HttpError(400, "Invalid document type");
    }

    const profile = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new HttpError(404, "Physio profile not found");

    const document = await prisma.document.create({
      data: {
        physioProfileId: profile.id,
        type: type.data,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
      },
    });
    res.status(201).json({ document: serializeDocument(document) });
  })
);

router.delete(
  "/me/documents/:documentId",
  requireAuth,
  requireRole("PHYSIO"),
  asyncHandler(async (req, res) => {
    const profile = await prisma.physioProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new HttpError(404, "Physio profile not found");

    const document = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!document || document.physioProfileId !== profile.id) throw new HttpError(404, "Document not found");

    await prisma.document.delete({ where: { id: document.id } });
    await fs.unlink(path.join(UPLOADS_DIR, path.basename(document.fileUrl))).catch(() => {});
    res.status(204).end();
  })
);

export default router;
