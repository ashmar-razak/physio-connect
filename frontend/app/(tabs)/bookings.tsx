import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { bookingApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import type { Booking } from "@/api/types";
import { colors, radius, spacing } from "@/theme/colors";

export default function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { bookings: results } = await bookingApi.mine();
      setBookings(results);
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

  async function markComplete(id: string) {
    setBusyId(id);
    try {
      await bookingApi.complete(id);
      await load();
    } catch {
      // Ignore — booking stays in its current state and the user can retry.
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => {
          const req = item.coverRequest;
          const counterpart = user?.role === "PHYSIO" ? item.club?.clubName : item.physio?.fullName;
          const iHaveRated = item.ratings?.some((r) => r.raterId === user?.id);
          const isComplete = !!item.completedAt;

          return (
            <Card>
              <View style={styles.headerRow}>
                <Text style={styles.venue}>{req?.venueName ?? "Booking"}</Text>
                <View style={[styles.statusPill, isComplete ? styles.statusComplete : styles.statusConfirmed]}>
                  <Text style={[styles.statusText, { color: isComplete ? colors.textMuted : colors.success }]}>
                    {isComplete ? "Completed" : "Confirmed"}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>{counterpart}</Text>
              {req ? (
                <Text style={styles.meta}>
                  {new Date(req.dateNeeded).toLocaleDateString()} · {req.startTime}–{req.endTime} · {req.venuePostcode}
                </Text>
              ) : null}

              <View style={styles.actions}>
                {!isComplete ? (
                  <Button title="Mark Complete" variant="secondary" onPress={() => markComplete(item.id)} loading={busyId === item.id} />
                ) : iHaveRated ? (
                  <Text style={styles.rated}>You've rated this booking</Text>
                ) : (
                  <Button title="Rate" onPress={() => router.push(`/bookings/${item.id}`)} />
                )}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No bookings yet.</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  venue: { fontSize: 17, fontWeight: "700", color: colors.text, flexShrink: 1 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  statusPill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  statusConfirmed: { backgroundColor: colors.successLight },
  statusComplete: { backgroundColor: colors.border },
  statusText: { fontSize: 11, fontWeight: "700" },
  actions: { marginTop: spacing.md },
  rated: { color: colors.textMuted, fontStyle: "italic" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
