import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { ChipGroup } from "@/components/Chip";
import { Button } from "@/components/Button";
import { requestApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { CERTIFICATION_LABEL, CERTIFICATION_TYPES, COVER_TYPE_LABEL, COVER_TYPES, URGENCY_LABEL, URGENCY_LEVELS } from "@/api/types";
import type { CertificationType, CoverType, Urgency } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function NewCoverRequestScreen() {
  const [dateNeeded, setDateNeeded] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venuePostcode, setVenuePostcode] = useState("");
  const [sport, setSport] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [coverType, setCoverType] = useState<CoverType | undefined>();
  const [requiresDbs, setRequiresDbs] = useState(false);
  const [minCertification, setMinCertification] = useState<CertificationType | undefined>();
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("WITHIN_2_WEEKS");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!dateNeeded || !startTime || !endTime || !venueName || !venuePostcode || !sport || !ageGroup || !coverType) {
      setError("Fill in date, time, venue, sport, age group, and cover type");
      return;
    }

    const parsedDate = new Date(dateNeeded);
    if (Number.isNaN(parsedDate.getTime())) {
      setError("Date needed must look like YYYY-MM-DD");
      return;
    }

    setLoading(true);
    try {
      const { request } = await requestApi.create({
        dateNeeded: parsedDate.toISOString(),
        startTime,
        endTime,
        venueName,
        venuePostcode,
        sport,
        ageGroup,
        coverType,
        requiresDbs,
        minCertification,
        budget: budget ? Number(budget) : undefined,
        urgency,
        notes: notes || undefined,
      });
      router.replace(`/requests/${request.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post this request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Post a Cover Request</Text>

      <TextField label="Date Needed" value={dateNeeded} onChangeText={setDateNeeded} placeholder="YYYY-MM-DD" required />
      <View style={styles.timeRow}>
        <View style={styles.flexField}>
          <TextField label="Start Time" value={startTime} onChangeText={setStartTime} placeholder="09:00" required />
        </View>
        <View style={styles.flexField}>
          <TextField label="End Time" value={endTime} onChangeText={setEndTime} placeholder="13:00" required />
        </View>
      </View>

      <TextField label="Venue Name" value={venueName} onChangeText={setVenueName} required />
      <TextField label="Venue Postcode" value={venuePostcode} onChangeText={setVenuePostcode} required />
      <TextField label="Sport" value={sport} onChangeText={setSport} placeholder="e.g. football" required />
      <TextField label="Age Group" value={ageGroup} onChangeText={setAgeGroup} placeholder="e.g. U18, Senior" required />

      <ChipGroup label="What do you need?" options={COVER_TYPES.map((c) => ({ value: c, label: COVER_TYPE_LABEL[c] }))} value={coverType} onChange={setCoverType} required />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Under-18s involved (requires DBS-checked cover)</Text>
        <Switch value={requiresDbs} onValueChange={setRequiresDbs} trackColor={{ true: colors.primary }} />
      </View>

      <ChipGroup
        label="Minimum certification (optional)"
        options={CERTIFICATION_TYPES.map((c) => ({ value: c, label: CERTIFICATION_LABEL[c] }))}
        value={minCertification}
        onChange={(v) => setMinCertification((prev) => (prev === v ? undefined : v))}
      />

      <TextField label="Budget (£, optional)" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" />

      <ChipGroup label="Urgency" options={URGENCY_LEVELS.map((u) => ({ value: u, label: URGENCY_LABEL[u] }))} value={urgency} onChange={setUrgency} required />

      <TextField label="Anything else?" value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Parking, facilities, kit provided..." />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Post Cover Request" onPress={submit} loading={loading} testID="submit-cover-request-btn" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.sm, marginBottom: spacing.lg },
  timeRow: { flexDirection: "row", gap: spacing.sm },
  flexField: { flex: 1 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  switchLabel: { color: colors.text, fontWeight: "600", flexShrink: 1, marginRight: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.md },
});
