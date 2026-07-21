import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { RegistrationBadge } from "@/components/RegistrationBadge";
import { InsuranceBadge } from "@/components/InsuranceBadge";
import { adminApi } from "@/api/endpoints";
import type { AdminPhysio } from "@/api/types";
import { colors, radius, spacing } from "@/theme/colors";

export default function VerificationQueueScreen() {
  const [physios, setPhysios] = useState<AdminPhysio[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { physios: results } = await adminApi.verificationQueue();
      setPhysios(results);
    } catch {
      // Ignore — list just stays empty/stale and the user can pull to refresh.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={physios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            Physios with an unverified registration or documents awaiting review.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/admin/${item.id}`)} activeOpacity={0.8} testID={`admin-queue-item-${item.id}`}>
            <Card style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.name}>{item.fullName}</Text>
                {item.pendingDocumentCount ? (
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingText}>{item.pendingDocumentCount} to review</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.badgeRow}>
                <RegistrationBadge body={item.registrationBody} number={item.registrationNumber} verified={item.registrationVerified} />
                <InsuranceBadge status={item.insuranceStatus} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Nothing needs review right now.</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  subtitle: { color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 18 },
  card: { marginBottom: spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  name: { fontSize: 17, fontWeight: "700", color: colors.text, flexShrink: 1 },
  email: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.sm },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  pendingPill: { backgroundColor: colors.warningLight, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  pendingText: { color: colors.warning, fontSize: 11, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
