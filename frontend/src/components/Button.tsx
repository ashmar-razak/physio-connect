import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { colors, radius, shadow, spacing } from "@/theme/colors";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ title, variant = "primary", loading, disabled, style, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, variantStyles[variant], (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.primary : colors.surface} />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  text: { fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary, ...shadow.button },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger, ...shadow.button },
  ghost: { backgroundColor: "transparent" },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: colors.surface },
  secondary: { color: colors.primary },
  danger: { color: colors.surface },
  ghost: { color: colors.primary },
});
