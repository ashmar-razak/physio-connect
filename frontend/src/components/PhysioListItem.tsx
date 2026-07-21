import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/Card";
import { TrustBadge } from "@/components/TrustBadge";
import { RegistrationBadge } from "@/components/RegistrationBadge";
import { InsuranceBadge } from "@/components/InsuranceBadge";
import { StarRating } from "@/components/StarRating";
import { colors, spacing } from "@/theme/colors";
import type { PhysioProfile } from "@/api/types";

export function PhysioListItem({ physio }: { physio: PhysioProfile }) {
  return (
    <TouchableOpacity onPress={() => router.push(`/physio/${physio.id}`)} activeOpacity={0.8} testID={`physio-item-${physio.id}`}>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{physio.fullName}</Text>
          <TrustBadge tier={physio.trustTier} certCount={physio.certificationCount} />
        </View>
        <View style={styles.badgeRow}>
          <RegistrationBadge body={physio.registrationBody} number={physio.registrationNumber} verified={physio.registrationVerified} />
          <InsuranceBadge status={physio.insuranceStatus} />
        </View>
        <Text style={styles.meta}>
          {physio.locationText}
          {physio.distanceMiles !== undefined ? ` · ${physio.distanceMiles.toFixed(1)} mi away` : ""}
        </Text>
        <Text style={styles.meta}>{physio.sports.join(", ")}</Text>
        <View style={styles.footerRow}>
          <StarRating value={physio.averageRating} count={physio.ratingCount} />
          {physio.dayRate ? <Text style={styles.rate}>£{physio.dayRate}/day</Text> : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs, gap: spacing.sm },
  name: { fontSize: 18, fontWeight: "700", color: colors.text, flexShrink: 1 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  rate: { color: colors.text, fontWeight: "600" },
});
