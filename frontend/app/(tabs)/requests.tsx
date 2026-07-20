import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { CoverRequestListItem } from "@/components/CoverRequestListItem";
import { requestApi } from "@/api/endpoints";
import type { CoverRequest } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

export default function MyRequestsScreen() {
  const [requests, setRequests] = useState<CoverRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { requests: results } = await requestApi.mine();
      setRequests(results);
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
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CoverRequestListItem request={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <Button title="+ Post a Cover Request" onPress={() => router.push("/requests/new")} style={styles.newBtn} testID="new-request-btn" />
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>You haven't posted any cover requests yet.</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  newBtn: { marginBottom: spacing.lg },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
