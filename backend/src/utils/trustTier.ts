// A physio's trust tier is a visible signal derived from how many
// certifications they hold, separate from the star rating (which comes
// from clubs/physios rating each other after a booking). More certs
// (pitchside quals, DBS, etc.) => a higher tier and better search ranking.
export type TrustTier = "UNVERIFIED" | "STANDARD" | "BRONZE" | "SILVER" | "GOLD";

export function trustTierForCertCount(count: number): TrustTier {
  if (count <= 0) return "UNVERIFIED";
  if (count === 1) return "STANDARD";
  if (count <= 3) return "BRONZE";
  if (count <= 5) return "SILVER";
  return "GOLD";
}

export function trustTierRank(tier: TrustTier): number {
  return { UNVERIFIED: 0, STANDARD: 1, BRONZE: 2, SILVER: 3, GOLD: 4 }[tier];
}
