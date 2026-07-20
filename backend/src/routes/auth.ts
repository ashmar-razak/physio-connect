import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signToken } from "../utils/jwt";
import { registrationBodySchema } from "../utils/enums";
import { geocodeLocation } from "../utils/geocode";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { serializeUser } from "../serializers";
import { getRatingStats } from "../utils/ratingStats";

const router = Router();

const basePhysioSchema = z.object({
  role: z.literal("PHYSIO"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  bio: z.string().optional(),
  locationText: z.string().min(1, "Location is required"),
  travelRadiusMiles: z.number().int().positive().optional(),
  // HCPC or CSP registration is mandatory for every physio account.
  registrationBody: registrationBodySchema,
  registrationNumber: z.string().min(1, "Registration number is required"),
  yearsExperience: z.number().int().min(0).optional(),
  dayRate: z.number().positive().optional(),
  sports: z.array(z.string().min(1)).min(1, "List at least one sport"),
});

const clubSchema = z.object({
  role: z.literal("CLUB"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  clubName: z.string().min(1),
  sport: z.string().min(1),
  contactName: z.string().min(1),
  contactRole: z.string().optional(),
  phone: z.string().optional(),
  locationText: z.string().min(1, "Location is required"),
});

const registerSchema = z.discriminatedUnion("role", [basePhysioSchema, clubSchema]);

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const geo = await geocodeLocation(body.locationText);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role,
        ...(body.role === "PHYSIO"
          ? {
              physioProfile: {
                create: {
                  fullName: body.fullName,
                  phone: body.phone,
                  bio: body.bio,
                  locationText: body.locationText,
                  latitude: geo?.latitude,
                  longitude: geo?.longitude,
                  travelRadiusMiles: body.travelRadiusMiles ?? 20,
                  registrationBody: body.registrationBody,
                  registrationNumber: body.registrationNumber,
                  yearsExperience: body.yearsExperience ?? 0,
                  dayRate: body.dayRate,
                  sports: body.sports.join(","),
                },
              },
            }
          : {
              clubProfile: {
                create: {
                  clubName: body.clubName,
                  sport: body.sport,
                  contactName: body.contactName,
                  contactRole: body.contactRole,
                  phone: body.phone,
                  locationText: body.locationText,
                  latitude: geo?.latitude,
                  longitude: geo?.longitude,
                },
              },
            }),
      },
      include: { physioProfile: { include: { certifications: true } }, clubProfile: true },
    });

    const token = signToken({ userId: user.id, role: user.role as "PHYSIO" | "CLUB" });
    res.status(201).json({ token, user: serializeUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { physioProfile: { include: { certifications: true } }, clubProfile: true },
    });
    if (!user) throw new HttpError(401, "Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid email or password");

    const token = signToken({ userId: user.id, role: user.role as "PHYSIO" | "CLUB" });
    res.json({ token, user: serializeUser(user) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { physioProfile: { include: { certifications: true } }, clubProfile: true },
    });
    if (!user) throw new HttpError(404, "User not found");

    const stats = await getRatingStats(user.id);
    res.json({ user: serializeUser(user, stats) });
  })
);

export default router;
