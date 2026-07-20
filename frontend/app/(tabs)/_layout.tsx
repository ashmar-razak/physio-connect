import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, ColorValue, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const isClub = user?.role === "CLUB";
  const isPhysio = user?.role === "PHYSIO";

  // Guards direct/deep-link navigation into a tab route: without this, a tab
  // screen can mount (and fire its data fetch) before AuthContext finishes
  // restoring the token from storage, racing an API call to a 401.
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="physios"
        options={{
          title: "Find Physios",
          href: isClub ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon symbol="🔍" color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Find Work",
          href: isPhysio ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon symbol="🩺" color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "My Requests",
          href: isClub ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon symbol="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "My Applications",
          href: isPhysio ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon symbol="✉️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => <TabIcon symbol="📅" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon symbol="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
