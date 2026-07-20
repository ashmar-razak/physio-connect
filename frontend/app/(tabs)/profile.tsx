import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { TrustBadge } from "@/components/TrustBadge";
import { RegistrationBadge } from "@/components/RegistrationBadge";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/context/AuthContext";
import { physioApi, clubApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, spacing } from "@/theme/colors";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const physio = user?.physioProfile;
  const club = user?.clubProfile;

  const [bio, setBio] = useState(physio?.bio ?? "");
  const [phone, setPhone] = useState(physio?.phone ?? club?.phone ?? "");
  const [locationText, setLocationText] = useState(physio?.locationText ?? club?.locationText ?? "");
  const [dayRate, setDayRate] = useState(physio?.dayRate ? String(physio.dayRate) : "");
  const [travelRadiusMiles, setTravelRadiusMiles] = useState(physio ? String(physio.travelRadiusMiles) : "");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (physio) {
        await physioApi.updateMe({
          bio: bio || undefined,
          phone: phone || undefined,
          locationText: locationText || undefined,
          dayRate: dayRate ? Number(dayRate) : undefined,
          travelRadiusMiles: travelRadiusMiles ? Number(travelRadiusMiles) : undefined,
        });
      } else if (club) {
        await clubApi.updateMe({ phone: phone || undefined, locationText: locationText || undefined });
      }
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <Screen>
      {physio ? (
        <>
          <Text style={styles.name}>{physio.fullName}</Text>
          <View style={styles.badgeRow}>
            <TrustBadge tier={physio.trustTier} certCount={physio.certificationCount} />
            <RegistrationBadge body={physio.registrationBody} number={physio.registrationNumber} verified={physio.registrationVerified} />
          </View>
          <StarRating value={physio.averageRating} count={physio.ratingCount} size={18} />

          <Card style={styles.section}>
            {editing ? (
              <>
                <TextField label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />
                <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Location" value={locationText} onChangeText={setLocationText} />
                <TextField label="Travel Radius (miles)" value={travelRadiusMiles} onChangeText={setTravelRadiusMiles} keyboardType="number-pad" />
                <TextField label="Day Rate (£)" value={dayRate} onChangeText={setDayRate} keyboardType="decimal-pad" />
              </>
            ) : (
              <>
                <InfoRow label="Bio" value={physio.bio || "—"} />
                <InfoRow label="Phone" value={physio.phone || "—"} />
                <InfoRow label="Location" value={physio.locationText} />
                <InfoRow label="Travel Radius" value={`${physio.travelRadiusMiles} miles`} />
                <InfoRow label="Day Rate" value={physio.dayRate ? `£${physio.dayRate}` : "—"} />
                <InfoRow label="Experience" value={`${physio.yearsExperience} years`} />
                <InfoRow label="Sports" value={physio.sports.join(", ")} />
              </>
            )}
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {editing ? (
            <View style={styles.buttonRow}>
              <Button title="Cancel" variant="secondary" onPress={() => setEditing(false)} style={styles.flexBtn} />
              <Button title="Save" onPress={save} loading={saving} style={styles.flexBtn} />
            </View>
          ) : (
            <Button title="Edit Profile" variant="secondary" onPress={() => setEditing(true)} />
          )}

          <Button
            title="Manage Certifications"
            onPress={() => router.push("/certifications/manage")}
            style={styles.spaced}
            testID="manage-certifications-btn"
          />
        </>
      ) : club ? (
        <>
          <Text style={styles.name}>{club.clubName}</Text>
          <Text style={styles.subtitle}>{club.sport}</Text>
          <StarRating value={club.averageRating} count={club.ratingCount} size={18} />

          <Card style={styles.section}>
            {editing ? (
              <>
                <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Location" value={locationText} onChangeText={setLocationText} />
              </>
            ) : (
              <>
                <InfoRow label="Contact" value={club.contactName} />
                <InfoRow label="Role" value={club.contactRole || "—"} />
                <InfoRow label="Phone" value={club.phone || "—"} />
                <InfoRow label="Location" value={club.locationText} />
              </>
            )}
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {editing ? (
            <View style={styles.buttonRow}>
              <Button title="Cancel" variant="secondary" onPress={() => setEditing(false)} style={styles.flexBtn} />
              <Button title="Save" onPress={save} loading={saving} style={styles.flexBtn} />
            </View>
          ) : (
            <Button title="Edit Profile" variant="secondary" onPress={() => setEditing(true)} />
          )}
        </>
      ) : null}

      <Text style={styles.email}>{user.email}</Text>
      <Button title="Log Out" variant="ghost" onPress={logout} style={styles.spaced} testID="logout-btn" />
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm, flexWrap: "wrap" },
  section: { marginTop: spacing.md },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs, gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "600" },
  infoValue: { color: colors.text, flexShrink: 1, textAlign: "right" },
  error: { color: colors.danger, marginTop: spacing.sm },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  flexBtn: { flex: 1 },
  spaced: { marginTop: spacing.md },
  email: { color: colors.textMuted, marginTop: spacing.xl, textAlign: "center" },
});
