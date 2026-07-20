import { prisma } from "../db";

export async function getRatingStats(userId: string): Promise<{ averageRating: number | null; ratingCount: number }> {
  const agg = await prisma.rating.aggregate({
    where: { ratedId: userId },
    _avg: { score: true },
    _count: { score: true },
  });

  return {
    averageRating: agg._avg.score !== null ? Math.round(agg._avg.score * 10) / 10 : null,
    ratingCount: agg._count.score,
  };
}

export async function getRatingStatsBulk(userIds: string[]): Promise<Map<string, { averageRating: number | null; ratingCount: number }>> {
  if (userIds.length === 0) return new Map();

  const rows = await prisma.rating.groupBy({
    by: ["ratedId"],
    where: { ratedId: { in: userIds } },
    _avg: { score: true },
    _count: { score: true },
  });

  const map = new Map<string, { averageRating: number | null; ratingCount: number }>();
  for (const row of rows) {
    map.set(row.ratedId, {
      averageRating: row._avg.score !== null ? Math.round(row._avg.score * 10) / 10 : null,
      ratingCount: row._count.score,
    });
  }
  return map;
}
