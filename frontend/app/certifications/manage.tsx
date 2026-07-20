import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { ChipGroup } from "@/components/Chip";
import { TrustBadge } from "@/components/TrustBadge";
import { physioApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { CERTIFICATION_LABEL, CERTIFICATION_TYPES } from "@/api/types";
import type { Certification, CertificationType, PhysioProfile } from "@/api/types";
import { trustTierForCertCount } from "@/api/trustTier";
import { colors, spacing } from "@/theme/colors";

export default function ManageCertificationsScreen() {
  const [physio, setPhysio] = useState<PhysioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<CertificationType | undefined>();
  const [otherName, setOtherName] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { physio: result } = await physioApi.me();
      setPhysio(result);
    } catch {
      // Ignore — screen just stays empty and the user can navigate back and retry.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function addCertification() {
    setError(null);
    if (!type) {
      setError("Select a certification type");
      return;
    }
    setAdding(true);
    try {
      await physioApi.addCertification({
        type,
        otherName: type === "OTHER" ? otherName || undefined : undefined,
        issuingBody: issuingBody || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
      });
      setType(undefined);
      setOtherName("");
      setIssuingBody("");
      setIssueDate("");
      setExpiryDate("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add certification");
    } finally {
      setAdding(false);
    }
  }

  async function remove(cert: Certification) {
    setDeletingId(cert.id);
    try {
      await physioApi.deleteCertification(cert.id);
      await load();
    } catch {
      // Ignore — certification stays listed and the user can retry.
    } finally {
      setDeletingId(null);
    }
  }

  const certCount = physio?.certifications?.length ?? 0;

  return (
    <Screen>
      <Text style={styles.title}>My Certifications</Text>
      <Text style={styles.subtitle}>
        The more certifications you hold, the higher your trust tier — clubs can filter and sort by this.
      </Text>
      <TrustBadge tier={trustTierForCertCount(certCount)} certCount={certCount} />

      <View style={styles.list}>
        {physio?.certifications?.map((cert) => (
          <Card key={cert.id} style={styles.certCard}>
            <View style={styles.certRow}>
              <View style={styles.certInfo}>
                <Text style={styles.certName}>{cert.type === "OTHER" ? cert.otherName || "Other" : CERTIFICATION_LABEL[cert.type]}</Text>
                {cert.issuingBody ? <Text style={styles.meta}>{cert.issuingBody}</Text> : null}
                {cert.expiryDate ? <Text style={styles.meta}>Expires {new Date(cert.expiryDate).toLocaleDateString()}</Text> : null}
              </View>
              <Button title="Remove" variant="ghost" onPress={() => remove(cert)} loading={deletingId === cert.id} />
            </View>
          </Card>
        ))}
        {!loading && certCount === 0 ? <Text style={styles.empty}>No certifications added yet.</Text> : null}
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Add a Certification</Text>
        <ChipGroup
          label="Type"
          options={CERTIFICATION_TYPES.map((c) => ({ value: c, label: CERTIFICATION_LABEL[c] }))}
          value={type}
          onChange={setType}
          required
        />
        {type === "OTHER" ? <TextField label="Certification Name" value={otherName} onChangeText={setOtherName} /> : null}
        <TextField label="Issuing Body" value={issuingBody} onChangeText={setIssuingBody} placeholder="e.g. FA, RFU, Red Cross" />
        <TextField label="Issue Date" value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" />
        <TextField label="Expiry Date" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Add Certification" onPress={addCertification} loading={adding} testID="add-certification-btn" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 18 },
  list: { marginTop: spacing.md },
  certCard: { marginBottom: spacing.sm },
  certRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  certInfo: { flexShrink: 1 },
  certName: { fontWeight: "700", color: colors.text },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  empty: { color: colors.textMuted, marginTop: spacing.sm },
  formCard: { marginTop: spacing.lg },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md },
});
