import React, { useCallback, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { RegistrationBadge } from "@/components/RegistrationBadge";
import { InsuranceBadge } from "@/components/InsuranceBadge";
import { adminApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { API_BASE_URL } from "@/api/config";
import { DOCUMENT_TYPE_LABEL, INSURANCE_COVERAGE } from "@/api/types";
import type { AdminPhysio, Document, InsuranceCoverage } from "@/api/types";
import { colors, radius, spacing } from "@/theme/colors";

const INSURANCE_COVERAGE_LABEL: Record<InsuranceCoverage, string> = {
  YES: "Yes, covers pitchside",
  NO: "No",
  NOT_SURE: "Not sure",
};

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  PENDING: { fg: colors.warning, bg: colors.warningLight },
  APPROVED: { fg: colors.success, bg: colors.successLight },
  REJECTED: { fg: colors.danger, bg: colors.dangerLight },
};

export default function AdminReviewPhysioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [physio, setPhysio] = useState<AdminPhysio | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { physio: result } = await adminApi.physioDetail(id);
      setPhysio(result);
    } catch {
      // Ignore — screen renders its "not found" state below.
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function toggleRegistrationVerified() {
    if (!physio) return;
    setBusy("registration");
    setError(null);
    try {
      const { physio: updated } = await adminApi.setRegistrationVerified(physio.id, !physio.registrationVerified);
      setPhysio(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update registration status");
    } finally {
      setBusy(null);
    }
  }

  async function approve(document: Document) {
    setBusy(document.id);
    setError(null);
    try {
      await adminApi.reviewDocument(document.id, "APPROVED");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't approve this document");
    } finally {
      setBusy(null);
    }
  }

  async function confirmReject(document: Document) {
    setBusy(document.id);
    setError(null);
    try {
      await adminApi.reviewDocument(document.id, "REJECTED", rejectNote || undefined);
      setRejectingId(null);
      setRejectNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reject this document");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </Screen>
    );
  }

  if (!physio) {
    return (
      <Screen>
        <Text>Physio not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.name}>{physio.fullName}</Text>
      <Text style={styles.email}>{physio.email}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>Registration</Text>
        <RegistrationBadge body={physio.registrationBody} number={physio.registrationNumber} verified={physio.registrationVerified} />
        <Button
          title={physio.registrationVerified ? "Mark Unverified" : "Mark Verified"}
          variant={physio.registrationVerified ? "secondary" : "primary"}
          onPress={toggleRegistrationVerified}
          loading={busy === "registration"}
          style={styles.spaced}
          testID="toggle-registration-verified-btn"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>Insurance</Text>
        <InsuranceBadge status={physio.insuranceStatus} />
        {physio.hasInsurance ? (
          <>
            <InfoRow label="Insurer" value={physio.insurer || "—"} />
            <InfoRow label="Policy Number" value={physio.insurancePolicyNumber || "—"} />
            <InfoRow
              label="Covers Pitchside"
              value={physio.insuranceCoversPitchside ? INSURANCE_COVERAGE_LABEL[physio.insuranceCoversPitchside] : "—"}
            />
          </>
        ) : (
          <Text style={styles.meta}>No insurance on file.</Text>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Documents ({physio.documents?.length ?? 0})</Text>
      {!physio.documents || physio.documents.length === 0 ? (
        <Text style={styles.meta}>No documents uploaded yet.</Text>
      ) : (
        physio.documents.map((document) => {
          const statusStyle = STATUS_COLORS[document.status];
          return (
            <Card key={document.id} style={styles.docCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docType}>{DOCUMENT_TYPE_LABEL[document.type]}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.fg }]}>{document.status}</Text>
                </View>
              </View>
              <Text style={styles.docLink} onPress={() => Linking.openURL(`${API_BASE_URL}${document.fileUrl}`)} numberOfLines={1}>
                {document.fileName}
              </Text>
              {document.reviewNote ? <Text style={styles.reviewNote}>"{document.reviewNote}"</Text> : null}

              {document.status === "PENDING" ? (
                rejectingId === document.id ? (
                  <>
                    <TextField label="Reason for rejection" value={rejectNote} onChangeText={setRejectNote} placeholder="e.g. Photo is blurry" multiline />
                    <View style={styles.actionRow}>
                      <Button title="Cancel" variant="secondary" onPress={() => setRejectingId(null)} style={styles.flexBtn} />
                      <Button title="Confirm Reject" variant="danger" onPress={() => confirmReject(document)} loading={busy === document.id} style={styles.flexBtn} />
                    </View>
                  </>
                ) : (
                  <View style={styles.actionRow}>
                    <Button title="Reject" variant="secondary" onPress={() => setRejectingId(document.id)} style={styles.flexBtn} />
                    <Button title="Approve" onPress={() => approve(document)} loading={busy === document.id} style={styles.flexBtn} testID={`approve-doc-${document.id}`} />
                  </View>
                )
              ) : null}
            </Card>
          );
        })
      )}
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
  spinner: { marginTop: spacing.xl },
  name: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  email: { color: colors.textMuted, marginTop: spacing.xs },
  error: { color: colors.danger, marginTop: spacing.md },
  section: { marginTop: spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  spaced: { marginTop: spacing.md },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs, gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "600" },
  infoValue: { color: colors.text, flexShrink: 1, textAlign: "right" },
  meta: { color: colors.textMuted, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  docCard: { marginBottom: spacing.sm },
  docHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  docType: { fontWeight: "700", color: colors.text, flexShrink: 1 },
  docLink: { color: colors.primary, marginTop: spacing.xs, textDecorationLine: "underline" },
  reviewNote: { color: colors.text, fontStyle: "italic", marginTop: spacing.sm },
  statusPill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  statusText: { fontSize: 11, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  flexBtn: { flex: 1 },
});
