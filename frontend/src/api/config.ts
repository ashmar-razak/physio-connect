import Constants from "expo-constants";
import { Platform } from "react-native";

// Resolves the backend base URL. Order of preference:
// 1. EXPO_PUBLIC_API_URL env var (set this to point at a deployed API)
// 2. Android emulator special-case (10.0.2.2 maps to the host's localhost)
// 3. The Metro dev server's LAN host, so physical devices on the same
//    network can reach a backend running on your machine
// 4. localhost, for web and iOS simulator
function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const port = 4000;

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${port}`;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:${port}`;
  }

  return `http://localhost:${port}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
