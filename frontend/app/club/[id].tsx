import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { StarRating } from "@/components/StarRating";
import { clubApi, ratingsApi } from "@/api/endpoints";
import type { ClubProfile, Rating } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { club: result } = await clubApi.detail(id);
        setClub(result);
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

  if (!club) {
    return (
      <Screen>
        <Text>Club not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.name}>{club.clubName}</Text>
      <Text style={styles.subtitle}>{club.sport}</Text>
      <StarRating value={club.averageRating} count={club.ratingCount} size={18} />

      <Card style={styles.section}>
        <InfoRow label="Contact" value={club.contactName} />
        {club.contactRole ? <InfoRow label="Role" value={club.contactRole} /> : null}
        <InfoRow label="Location" value={club.locationText} />
      </Card>

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
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm },
  section: { marginTop: spacing.lg },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs, gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "600" },
  infoValue: { color: colors.text, flexShrink: 1, textAlign: "right" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  certCard: { marginBottom: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  reviewComment: { color: colors.text, marginTop: spacing.xs, fontStyle: "italic" },
});
