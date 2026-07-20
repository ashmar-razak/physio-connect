import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "@/theme/colors";
import { TRUST_TIER_COLORS, TRUST_TIER_LABEL } from "@/theme/trustTier";
import type { TrustTier } from "@/api/types";

export function TrustBadge({ tier, certCount }: { tier: TrustTier; certCount?: number }) {
  const { fg, bg } = TRUST_TIER_COLORS[tier];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>
        {TRUST_TIER_LABEL[tier]}
        {certCount !== undefined ? ` · ${certCount} cert${certCount === 1 ? "" : "s"}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  text: { fontSize: 12, fontWeight: "700" },
});
