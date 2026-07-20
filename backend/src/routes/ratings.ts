import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../middleware/errorHandler";
import { serializeRating } from "../serializers";
import { getRatingStats } from "../utils/ratingStats";

const router = Router();

// GET /ratings/users/:userId — public reviews received by a user (physio or club).
router.get(
  "/users/:userId",
  asyncHandler(async (req, res) => {
    const ratings = await prisma.rating.findMany({
      where: { ratedId: req.params.userId },
      orderBy: { createdAt: "desc" },
    });
    const stats = await getRatingStats(req.params.userId);
    res.json({ ratings: ratings.map(serializeRating), ...stats });
  })
);

export default router;
