import type { TrustTier } from "./types";

// Mirrors backend/src/utils/trustTier.ts so the "Add certification" form can
// preview the tier change before the server round-trip confirms it.
export function trustTierForCertCount(count: number): TrustTier {
  if (count <= 0) return "UNVERIFIED";
  if (count === 1) return "STANDARD";
  if (count <= 3) return "BRONZE";
  if (count <= 5) return "SILVER";
  return "GOLD";
}
