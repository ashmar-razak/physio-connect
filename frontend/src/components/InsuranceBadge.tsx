import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";
import type { InsuranceStatus } from "@/api/types";

const CONFIG: Record<InsuranceStatus, { label: string; fg: string; bg: string; icon: string }> = {
  VERIFIED: { label: "Insured for pitchside", fg: colors.success, bg: colors.successLight, icon: "✓" },
  UNCONFIRMED: { label: "Insurance unconfirmed", fg: colors.warning, bg: colors.warningLight, icon: "!" },
  MISSING: { label: "No insurance on file", fg: colors.danger, bg: colors.dangerLight, icon: "✕" },
};

export function InsuranceBadge({ status }: { status: InsuranceStatus }) {
  const { label, fg, bg, icon } = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>
        {icon} {label}
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
