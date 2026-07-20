import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "@/theme/colors";

interface DisplayProps {
  value: number | null;
  count?: number;
  size?: number;
  interactive?: false;
}

interface InteractiveProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  interactive: true;
}

export function StarRating(props: DisplayProps | InteractiveProps) {
  const size = props.size ?? 16;
  const filled = Math.round(props.value ?? 0);

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  if (props.interactive) {
    return (
      <View style={styles.row}>
        {stars.map((star) => (
          <TouchableOpacity key={star} onPress={() => props.onChange(star)} hitSlop={8}>
            <Text style={{ fontSize: size, color: star <= props.value ? colors.warning : colors.border }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (props.value === null) {
    return <Text style={styles.noRating}>No ratings yet</Text>;
  }

  return (
    <View style={styles.row}>
      {stars.map((star) => (
        <Text key={star} style={{ fontSize: size, color: star <= filled ? colors.warning : colors.border }}>
          ★
        </Text>
      ))}
      <Text style={styles.count}>
        {props.value.toFixed(1)}
        {props.count !== undefined ? ` (${props.count})` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  count: { marginLeft: spacing.xs, color: colors.textMuted, fontSize: 13 },
  noRating: { color: colors.textMuted, fontSize: 13, fontStyle: "italic" },
});
