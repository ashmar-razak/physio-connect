import { colors } from "./colors";
import type { TrustTier } from "@/api/types";

export const TRUST_TIER_LABEL: Record<TrustTier, string> = {
  UNVERIFIED: "Unverified",
  STANDARD: "Standard",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
};

export const TRUST_TIER_COLORS: Record<TrustTier, { fg: string; bg: string }> = {
  UNVERIFIED: { fg: colors.textMuted, bg: colors.border },
  STANDARD: { fg: colors.primaryDark, bg: colors.primaryLight },
  BRONZE: { fg: colors.bronze, bg: colors.bronzeLight },
  SILVER: { fg: colors.silver, bg: colors.silverLight },
  GOLD: { fg: colors.gold, bg: colors.goldLight },
};
