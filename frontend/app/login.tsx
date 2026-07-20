import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { homeHref } from "@/utils/navigation";
import { colors, spacing } from "@/theme/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const nextUser = await login(email.trim(), password);
      router.replace(homeHref(nextUser.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Physio Connect</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        testID="login-email-input"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        testID="login-password-input"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Sign In" onPress={submit} loading={loading} testID="login-submit-btn" />

      <TouchableOpacity onPress={() => router.push("/register")} style={styles.switchLink} testID="login-switch-register">
        <Text style={styles.switchText}>
          Don't have an account? <Text style={styles.switchBold}>Create one</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: spacing.xs, marginTop: spacing.xl },
  subtitle: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.xl },
  error: { color: colors.danger, marginBottom: spacing.md },
  switchLink: { marginTop: spacing.lg, alignItems: "center" },
  switchText: { color: colors.textMuted },
  switchBold: { color: colors.primary, fontWeight: "700" },
});
