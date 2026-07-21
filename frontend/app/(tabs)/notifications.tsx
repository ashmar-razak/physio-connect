import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { notificationsApi } from "@/api/endpoints";
import { useNotifications } from "@/context/NotificationsContext";
import { NOTIFICATION_ICON } from "@/api/types";
import type { AppNotification } from "@/api/types";
import { colors, spacing } from "@/theme/colors";

function targetHref(notification: AppNotification): string | null {
  const data = notification.data;
  switch (notification.type) {
    case "NEW_APPLICATION":
    case "APPLICATION_DECLINED":
      return data?.coverRequestId ? `/requests/${data.coverRequestId}` : null;
    case "APPLICATION_ACCEPTED":
    case "NEW_RATING":
      return data?.bookingId ? `/bookings/${data.bookingId}` : null;
    case "DOCUMENT_REVIEWED":
      return "/documents/manage";
    case "REGISTRATION_VERIFIED":
      return "/(tabs)/profile";
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const { refresh: refreshBadge } = useNotifications();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: results } = await notificationsApi.list();
      setNotifications(results);
    } catch {
      // Ignore — list just stays empty/stale and the user can pull to refresh.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshBadge();
    }, [load, refreshBadge])
  );

  async function handlePress(notification: AppNotification) {
    if (!notification.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      try {
        await notificationsApi.markRead(notification.id);
      } catch {
        // Ignore — a stale "unread" state just means the user can tap it again.
      }
      refreshBadge();
    }

    const href = targetHref(notification);
    if (href) router.push(href as never);
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Ignore — individual taps still work as a fallback.
    }
    refreshBadge();
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Screen scroll={false}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          hasUnread ? <Button title="Mark All Read" variant="secondary" onPress={markAllRead} style={styles.markAllBtn} /> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.8} testID={`notification-${item.id}`}>
            <Card style={[styles.card, !item.read && styles.unreadCard]}>
              <View style={styles.row}>
                <Text style={styles.icon}>{NOTIFICATION_ICON[item.type]}</Text>
                <View style={styles.textCol}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    {!item.read ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Nothing here yet.</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  markAllBtn: { marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  unreadCard: { borderColor: colors.primary },
  row: { flexDirection: "row", gap: spacing.sm },
  icon: { fontSize: 22 },
  textCol: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  title: { fontWeight: "700", color: colors.text, fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  body: { color: colors.text, marginTop: spacing.xs },
  time: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
});
