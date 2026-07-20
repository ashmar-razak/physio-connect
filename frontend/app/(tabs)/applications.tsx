import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { requestApi } from "@/api/endpoints";
import type { Application } from "@/api/types";
import { colors, radius, spacing } from "@/theme/colors";

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  PENDING: { fg: colors.warning, bg: colors.warningLight },
  ACCEPTED: { fg: colors.success, bg: colors.successLight },
  DECLINED: { fg: colors.danger, bg: colors.dangerLight },
  WITHDRAWN: { fg: colors.textMuted, bg: colors.border },
};

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { applications: results } = await requestApi.myApplications();
      setApplications(results);
    } catch {
      // Ignore — list just stays empty/stale and the user can pull to refresh.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => {
          const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING;
          const req = item.coverRequest;
          return (
            <TouchableOpacity onPress={() => req && router.push(`/requests/${req.id}`)} activeOpacity={0.8}>
              <Card>
                <View style={styles.headerRow}>
                  <Text style={styles.venue}>{req?.venueName ?? "Cover request"}</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.fg }]}>{item.status}</Text>
                  </View>
                </View>
                {req?.club ? <Text style={styles.meta}>{req.club.clubName}</Text> : null}
                {req ? (
                  <Text style={styles.meta}>
                    {new Date(req.dateNeeded).toLocaleDateString()} · {req.startTime}–{req.endTime}
                  </Text>
                ) : null}
                {item.message ? <Text style={styles.message}>"{item.message}"</Text> : null}
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>You haven't applied to any cover requests yet.</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  venue: { fontSize: 17, fontWeight: "700", color: colors.text, flexShrink: 1 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  message: { color: colors.text, fontStyle: "italic", marginTop: spacing.sm },
  statusPill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  statusText: { fontSize: 11, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
