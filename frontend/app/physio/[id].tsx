import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { TrustBadge } from "@/components/TrustBadge";
import { RegistrationBadge } from "@/components/RegistrationBadge";
import { InsuranceBadge } from "@/components/InsuranceBadge";
import { StarRating } from "@/components/StarRating";
import { physioApi, ratingsApi } from "@/api/endpoints";
import { CERTIFICATION_LABEL } from "@/api/types";
import type { PhysioProfile, Rating } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function PhysioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [physio, setPhysio] = useState<PhysioProfile | null>(null);
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { physio: result } = await physioApi.detail(id);
        setPhysio(result);
        const { ratings } = await ratingsApi.forUser(result.userId);
        setReviews(ratings);
      } catch {
        // Ignore — screen renders its "not found" state below.
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
      <View style={styles.badgeRow}>
        <TrustBadge tier={physio.trustTier} certCount={physio.certificationCount} />
        <RegistrationBadge body={physio.registrationBody} number={physio.registrationNumber} verified={physio.registrationVerified} />
        <InsuranceBadge status={physio.insuranceStatus} />
      </View>
      <StarRating value={physio.averageRating} count={physio.ratingCount} size={18} />

      {physio.bio ? <Text style={styles.bio}>{physio.bio}</Text> : null}

      <Card style={styles.section}>
        <InfoRow label="Location" value={`${physio.locationText} (travels up to ${physio.travelRadiusMiles} mi)`} />
        <InfoRow label="Sports" value={physio.sports.join(", ")} />
        <InfoRow label="Experience" value={`${physio.yearsExperience} years`} />
        {physio.dayRate ? <InfoRow label="Day Rate" value={`£${physio.dayRate}`} /> : null}
        {physio.phone ? <InfoRow label="Phone" value={physio.phone} /> : null}
      </Card>

      <Text style={styles.sectionTitle}>Certifications</Text>
      {physio.certifications && physio.certifications.length > 0 ? (
        physio.certifications.map((cert) => (
          <Card key={cert.id} style={styles.certCard}>
            <Text style={styles.certName}>{cert.type === "OTHER" ? cert.otherName || "Other" : CERTIFICATION_LABEL[cert.type]}</Text>
            {cert.issuingBody ? <Text style={styles.meta}>{cert.issuingBody}</Text> : null}
            {cert.expiryDate ? <Text style={styles.meta}>Expires {new Date(cert.expiryDate).toLocaleDateString()}</Text> : null}
          </Card>
        ))
      ) : (
        <Text style={styles.meta}>No certifications listed yet.</Text>
      )}

      <Text style={styles.sectionTitle}>Reviews</Text>
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <Card key={review.id} style={styles.certCard}>
            <StarRating value={review.score} size={14} />
            {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
          </Card>
        ))
      ) : (
        <Text style={styles.meta}>No reviews yet.</Text>
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
  name: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm, flexWrap: "wrap" },
  bio: { color: colors.text, marginTop: spacing.md, lineHeight: 20 },
  section: { marginTop: spacing.lg },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs, gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "600" },
  infoValue: { color: colors.text, flexShrink: 1, textAlign: "right" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  certCard: { marginBottom: spacing.sm },
  certName: { fontWeight: "700", color: colors.text },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  reviewComment: { color: colors.text, marginTop: spacing.xs, fontStyle: "italic" },
});
