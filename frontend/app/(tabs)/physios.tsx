import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { ChipGroup } from "@/components/Chip";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PhysioListItem } from "@/components/PhysioListItem";
import { physioApi } from "@/api/endpoints";
import { CERTIFICATION_LABEL, CERTIFICATION_TYPES, type CertificationType, type PhysioProfile, type TrustTier } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { colors, spacing } from "@/theme/colors";

const TIER_OPTIONS: { value: TrustTier; label: string }[] = [
  { value: "STANDARD", label: "Standard+" },
  { value: "BRONZE", label: "Bronze+" },
  { value: "SILVER", label: "Silver+" },
  { value: "GOLD", label: "Gold only" },
];

export default function PhysiosScreen() {
  const { user } = useAuth();
  const [sport, setSport] = useState("");
  const [certification, setCertification] = useState<CertificationType | undefined>();
  const [minTrustTier, setMinTrustTier] = useState<TrustTier | undefined>();
  const [insuredForPitchside, setInsuredForPitchside] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState("25");
  const { coords: currentCoords, loading: locating, error: locationError, request: requestLocation, clear: clearLocation } = useCurrentLocation();

  const [physios, setPhysios] = useState<PhysioProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const club = user?.clubProfile;
  const usingRadius = !!currentCoords || nearMe;
  const lat = currentCoords?.latitude ?? (nearMe ? club?.latitude ?? undefined : undefined);
  const lng = currentCoords?.longitude ?? (nearMe ? club?.longitude ?? undefined : undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { physios: results } = await physioApi.search({
        sport: sport || undefined,
        certification,
        minTrustTier,
        insuredForPitchside: insuredForPitchside || undefined,
        lat: usingRadius ? lat : undefined,
        lng: usingRadius ? lng : undefined,
        radiusMiles: usingRadius ? Number(radiusMiles) || undefined : undefined,
      });
      setPhysios(results);
    } catch (err) {
      setError("Couldn't load physios. Pull to refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, [sport, certification, minTrustTier, insuredForPitchside, usingRadius, lat, lng, radiusMiles]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen scroll={false}>
      <FlatList
        data={physios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PhysioListItem physio={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <Card style={styles.filterCard}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TextField label="Sport" value={sport} onChangeText={setSport} placeholder="e.g. football" />
            <ChipGroup
              label="Certification"
              options={CERTIFICATION_TYPES.map((c) => ({ value: c, label: CERTIFICATION_LABEL[c] }))}
              value={certification}
              onChange={(v) => setCertification((prev) => (prev === v ? undefined : v))}
            />
            <ChipGroup
              label="Minimum Trust Tier"
              options={TIER_OPTIONS}
              value={minTrustTier}
              onChange={(v) => setMinTrustTier((prev) => (prev === v ? undefined : v))}
            />
            <View style={styles.nearRow}>
              <Text style={styles.nearLabel}>Insured for pitchside work</Text>
              <Switch value={insuredForPitchside} onValueChange={setInsuredForPitchside} trackColor={{ true: colors.primary }} />
            </View>
            {club ? (
              <View style={styles.nearRow}>
                <Text style={styles.nearLabel}>Near my club ({club.locationText})</Text>
                <Switch value={nearMe} onValueChange={setNearMe} disabled={!!currentCoords} trackColor={{ true: colors.primary }} />
              </View>
            ) : null}

            {currentCoords ? (
              <View style={styles.nearRow}>
                <Text style={styles.nearLabel}>📍 Using your current location</Text>
                <Button title="Clear" variant="ghost" onPress={clearLocation} />
              </View>
            ) : (
              <Button
                title="📍 Use My Current Location"
                variant="secondary"
                onPress={requestLocation}
                loading={locating}
                style={styles.locationBtn}
                testID="use-current-location-btn"
              />
            )}
            {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}

            {usingRadius ? (
              <TextField label="Radius (miles)" value={radiusMiles} onChangeText={setRadiusMiles} keyboardType="number-pad" />
            ) : null}
          </Card>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>{error ?? "No physios match these filters yet."}</Text>
          ) : null
        }
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
  locationBtn: { marginBottom: spacing.sm },
  locationError: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
