import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { StarRating } from "@/components/StarRating";
import { bookingApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Booking } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { bookings } = await bookingApi.mine();
        setBooking(bookings.find((b) => b.id === id) ?? null);
      } catch {
        // Ignore — screen renders its "not found" state below.
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function submitRating() {
    setError(null);
    setSubmitting(true);
    try {
      await bookingApi.rate(id, score, comment || undefined);
      router.replace("/(tabs)/bookings");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit rating");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </Screen>
    );
  }

  if (!booking) {
    return (
      <Screen>
        <Text>Booking not found.</Text>
      </Screen>
    );
  }

  const counterpart = user?.role === "PHYSIO" ? booking.club?.clubName : booking.physio?.fullName;
  const alreadyRated = booking.ratings?.some((r) => r.raterId === user?.id);

  return (
    <Screen>
      <Text style={styles.title}>{booking.coverRequest?.venueName}</Text>
      <Text style={styles.subtitle}>{counterpart}</Text>

      <Card style={styles.section}>
        {alreadyRated ? (
          <Text style={styles.meta}>You've already rated this booking.</Text>
        ) : (
          <>
            <Text style={styles.label}>How would you rate {counterpart}?</Text>
            <StarRating value={score} onChange={setScore} interactive size={32} />
            <TextField
              label="Comment (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              style={styles.commentField}
              testID="rating-comment-input"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Submit Rating" onPress={submitRating} loading={submitting} testID="submit-rating-btn" />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: spacing.xl },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs },
  section: { marginTop: spacing.lg },
  label: { fontWeight: "600", color: colors.text, marginBottom: spacing.md },
  meta: { color: colors.textMuted },
  commentField: { marginTop: spacing.lg },
  error: { color: colors.danger, marginTop: spacing.sm, marginBottom: spacing.sm },
});
