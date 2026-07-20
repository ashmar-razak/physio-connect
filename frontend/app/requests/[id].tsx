import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { TrustBadge } from "@/components/TrustBadge";
import { RegistrationBadge } from "@/components/RegistrationBadge";
import { StarRating } from "@/components/StarRating";
import { requestApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { COVER_TYPE_LABEL, URGENCY_LABEL } from "@/api/types";
import type { Application, CoverRequest } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function CoverRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<CoverRequest | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyMessage, setApplyMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwnerClub = !!user?.clubProfile && request?.clubProfileId === user.clubProfile.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { request: result } = await requestApi.detail(id);
      setRequest(result);

      if (user?.role === "CLUB" && user.clubProfile?.id === result.clubProfileId) {
        const { applications: apps } = await requestApi.applications(id);
        setApplications(apps);
      } else if (user?.role === "PHYSIO") {
        const { applications: mine } = await requestApi.myApplications();
        setMyApplication(mine.find((a) => a.coverRequestId === id) ?? null);
      }
    } catch {
      // Ignore — screen renders its current (possibly stale) state.
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function apply() {
    setError(null);
    setBusy("apply");
    try {
      const { application } = await requestApi.apply(id, applyMessage || undefined);
      setMyApplication(application);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't apply");
    } finally {
      setBusy(null);
    }
  }

  async function withdraw() {
    if (!myApplication) return;
    setBusy("withdraw");
    try {
      const { application } = await requestApi.withdrawApplication(myApplication.id);
      setMyApplication(application);
    } catch {
      // Ignore — application stays in its current state and the user can retry.
    } finally {
      setBusy(null);
    }
  }

  async function accept(applicationId: string) {
    setBusy(applicationId);
    try {
      await requestApi.acceptApplication(applicationId);
      router.replace("/(tabs)/bookings");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't accept this application");
      setBusy(null);
    }
  }

  async function decline(applicationId: string) {
    setBusy(applicationId);
    try {
      await requestApi.declineApplication(applicationId);
      await load();
    } catch {
      // Ignore — application stays in its current state and the user can retry.
    } finally {
      setBusy(null);
    }
  }

  async function cancelRequest() {
    setBusy("cancel");
    try {
      await requestApi.cancel(id);
      await load();
    } catch {
      // Ignore — request stays in its current state and the user can retry.
    } finally {
      setBusy(null);
    }
  }

  if (loading || !request) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.venue}>{request.venueName}</Text>
      {request.club ? <Text style={styles.club}>{request.club.clubName}</Text> : null}

      <Card style={styles.section}>
        <InfoRow label="Date" value={new Date(request.dateNeeded).toLocaleDateString()} />
        <InfoRow label="Time" value={`${request.startTime}–${request.endTime}`} />
        <InfoRow label="Venue" value={`${request.venueName}, ${request.venuePostcode}`} />
        <InfoRow label="Sport" value={request.sport} />
        <InfoRow label="Age Group" value={request.ageGroup} />
        <InfoRow label="Cover Needed" value={COVER_TYPE_LABEL[request.coverType]} />
        <InfoRow label="Urgency" value={URGENCY_LABEL[request.urgency]} />
        {request.requiresDbs ? <InfoRow label="DBS" value="Required (under-18s involved)" /> : null}
        {request.minCertification ? <InfoRow label="Min. Certification" value={request.minCertification} /> : null}
        {request.budget ? <InfoRow label="Budget" value={`£${request.budget}`} /> : null}
        {request.notes ? <InfoRow label="Notes" value={request.notes} /> : null}
        <InfoRow label="Status" value={request.status} />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {user?.role === "PHYSIO" ? (
        <Card style={styles.section}>
          {myApplication ? (
            <>
              <Text style={styles.appliedLabel}>Application status: {myApplication.status}</Text>
              {myApplication.status === "PENDING" ? (
                <Button title="Withdraw Application" variant="danger" onPress={withdraw} loading={busy === "withdraw"} />
              ) : null}
            </>
          ) : request.status === "OPEN" ? (
            <>
              <TextField label="Message to the club (optional)" value={applyMessage} onChangeText={setApplyMessage} multiline numberOfLines={3} />
              <Button title="Apply for this Cover" onPress={apply} loading={busy === "apply"} testID="apply-btn" />
            </>
          ) : (
            <Text style={styles.meta}>This request is no longer open.</Text>
          )}
        </Card>
      ) : null}

      {isOwnerClub ? (
        <>
          {request.status === "OPEN" ? (
            <Button title="Cancel Request" variant="danger" onPress={cancelRequest} loading={busy === "cancel"} style={styles.cancelBtn} />
          ) : null}

          <Text style={styles.sectionTitle}>Applications ({applications.length})</Text>
          {applications.length === 0 ? (
            <Text style={styles.meta}>No applications yet.</Text>
          ) : (
            applications.map((application) => (
              <Card key={application.id} style={styles.applicationCard}>
                <View style={styles.applicantHeader}>
                  <Text style={styles.applicantName}>{application.physio?.fullName}</Text>
                  {application.physio ? <TrustBadge tier={application.physio.trustTier} certCount={application.physio.certificationCount} /> : null}
                </View>
                {application.physio ? (
                  <RegistrationBadge
                    body={application.physio.registrationBody}
                    number={application.physio.registrationNumber}
                    verified={application.physio.registrationVerified}
                  />
                ) : null}
                {application.physio ? <StarRating value={application.physio.averageRating} count={application.physio.ratingCount} size={14} /> : null}
                {application.message ? <Text style={styles.applicantMessage}>"{application.message}"</Text> : null}
                <View style={styles.applicantStatusRow}>
                  <Text style={styles.applicantStatus}>{application.status}</Text>
                </View>
                {application.status === "PENDING" && request.status === "OPEN" ? (
                  <View style={styles.actionRow}>
                    <Button title="Decline" variant="secondary" onPress={() => decline(application.id)} loading={busy === application.id} style={styles.flexBtn} />
                    <Button title="Accept" onPress={() => accept(application.id)} loading={busy === application.id} style={styles.flexBtn} />
                  </View>
                ) : null}
              </Card>
            ))
          )}
        </>
      ) : null}
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
  venue: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  club: { color: colors.primaryDark, fontWeight: "600", marginTop: spacing.xs },
  section: { marginTop: spacing.lg },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs, gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "600" },
  infoValue: { color: colors.text, flexShrink: 1, textAlign: "right" },
  error: { color: colors.danger, marginTop: spacing.md },
  appliedLabel: { fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  meta: { color: colors.textMuted, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  cancelBtn: { marginTop: spacing.lg },
  applicationCard: { marginBottom: spacing.sm },
  applicantHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.xs },
  applicantName: { fontSize: 16, fontWeight: "700", color: colors.text, flexShrink: 1 },
  applicantMessage: { color: colors.text, fontStyle: "italic", marginTop: spacing.sm },
  applicantStatusRow: { marginTop: spacing.sm },
  applicantStatus: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  flexBtn: { flex: 1 },
});
