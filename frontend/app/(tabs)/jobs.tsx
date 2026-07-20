import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { Card } from "@/components/Card";
import { CoverRequestListItem } from "@/components/CoverRequestListItem";
import { requestApi } from "@/api/endpoints";
import type { CoverRequest } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing } from "@/theme/colors";

export default function JobsScreen() {
  const { user } = useAuth();
  const physio = user?.physioProfile;

  const [sport, setSport] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(String(physio?.travelRadiusMiles ?? 25));

  const [requests, setRequests] = useState<CoverRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { requests: results } = await requestApi.search({
        status: "OPEN",
        sport: sport || undefined,
        lat: nearMe && physio?.latitude != null ? physio.latitude : undefined,
        lng: nearMe && physio?.longitude != null ? physio.longitude : undefined,
        radiusMiles: nearMe ? Number(radiusMiles) || undefined : undefined,
      });
      setRequests(results);
    } catch {
      setError("Couldn't load cover requests. Pull to refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, [sport, nearMe, radiusMiles, physio?.latitude, physio?.longitude]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen scroll={false}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CoverRequestListItem request={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <Card style={styles.filterCard}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TextField label="Sport" value={sport} onChangeText={setSport} placeholder="e.g. rugby" />
            {physio ? (
              <View style={styles.nearRow}>
                <Text style={styles.nearLabel}>Within my travel radius ({physio.locationText})</Text>
                <Switch value={nearMe} onValueChange={setNearMe} trackColor={{ true: colors.primary }} />
              </View>
            ) : null}
            {nearMe ? (
              <TextField label="Radius (miles)" value={radiusMiles} onChangeText={setRadiusMiles} keyboardType="number-pad" />
            ) : null}
          </Card>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{error ?? "No open cover requests right now."}</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  filterCard: { marginBottom: spacing.lg },
  filterTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  nearRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  nearLabel: { color: colors.text, fontWeight: "600", flexShrink: 1, marginRight: spacing.sm },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
