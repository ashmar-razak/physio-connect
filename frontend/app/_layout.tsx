import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationsProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: "Sign In" }} />
              <Stack.Screen name="register" options={{ title: "Create Account" }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="physio/[id]" options={{ title: "Physio Profile" }} />
              <Stack.Screen name="club/[id]" options={{ title: "Club Profile" }} />
              <Stack.Screen name="requests/new" options={{ title: "Post Cover Request" }} />
              <Stack.Screen name="requests/[id]" options={{ title: "Cover Request" }} />
              <Stack.Screen name="certifications/manage" options={{ title: "My Certifications" }} />
              <Stack.Screen name="documents/manage" options={{ title: "My Documents" }} />
              <Stack.Screen name="admin/[id]" options={{ title: "Review Physio" }} />
              <Stack.Screen name="bookings/[id]" options={{ title: "Booking" }} />
            </Stack>
          </NotificationsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
