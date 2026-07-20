import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/Card";
import { colors, radius, spacing } from "@/theme/colors";
import { COVER_TYPE_LABEL, URGENCY_LABEL } from "@/api/types";
import type { CoverRequest } from "@/api/types";

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  OPEN: { fg: colors.success, bg: colors.successLight },
  MATCHED: { fg: colors.warning, bg: colors.warningLight },
  COMPLETED: { fg: colors.textMuted, bg: colors.border },
  CANCELLED: { fg: colors.danger, bg: colors.dangerLight },
};

export function CoverRequestListItem({ request }: { request: CoverRequest }) {
  const statusStyle = STATUS_COLORS[request.status] ?? STATUS_COLORS.OPEN;
  const date = new Date(request.dateNeeded);

  return (
    <TouchableOpacity onPress={() => router.push(`/requests/${request.id}`)} activeOpacity={0.8} testID={`request-item-${request.id}`}>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.venue}>{request.venueName}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.fg }]}>{request.status}</Text>
          </View>
        </View>
        {request.club ? <Text style={styles.club}>{request.club.clubName}</Text> : null}
        <Text style={styles.meta}>
          {date.toLocaleDateString()} · {request.startTime}–{request.endTime}
        </Text>
        <Text style={styles.meta}>
          {request.sport} · {request.ageGroup} · {COVER_TYPE_LABEL[request.coverType]}
        </Text>
        <Text style={styles.meta}>{URGENCY_LABEL[request.urgency]}</Text>
        <View style={styles.footerRow}>
          {request.budget ? <Text style={styles.budget}>£{request.budget}</Text> : <Text style={styles.budget}>Budget TBC</Text>}
          {request.distanceMiles !== undefined ? <Text style={styles.meta}>{request.distanceMiles.toFixed(1)} mi away</Text> : null}
          {request.applicationCount !== undefined ? <Text style={styles.meta}>{request.applicationCount} applicant(s)</Text> : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  venue: { fontSize: 17, fontWeight: "700", color: colors.text, flexShrink: 1 },
  club: { color: colors.primaryDark, fontWeight: "600", marginTop: spacing.xs },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  statusPill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  statusText: { fontSize: 11, fontWeight: "700" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  budget: { color: colors.text, fontWeight: "700" },
});
