import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";
import type { RegistrationBody } from "@/api/types";

export function RegistrationBadge({ body, number, verified }: { body: RegistrationBody; number: string; verified: boolean }) {
  return (
    <View style={[styles.badge, verified ? styles.verified : styles.pending]}>
      <Text style={[styles.text, verified ? styles.verifiedText : styles.pendingText]}>
        {verified ? "✓ " : ""}
        {body}-registered · {number}
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
    borderWidth: 1,
  },
  verified: { backgroundColor: colors.successLight, borderColor: colors.success },
  pending: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  text: { fontSize: 12, fontWeight: "700" },
  verifiedText: { color: colors.success },
  pendingText: { color: colors.warning },
});
