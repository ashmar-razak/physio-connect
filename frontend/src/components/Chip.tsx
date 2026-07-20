import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  required?: boolean;
}

interface SingleSelectProps<T extends string> extends ChipGroupProps<T> {
  multi?: false;
  value: T | undefined;
  onChange: (value: T) => void;
}

interface MultiSelectProps<T extends string> extends ChipGroupProps<T> {
  multi: true;
  value: T[];
  onChange: (value: T[]) => void;
}

export function ChipGroup<T extends string>(props: SingleSelectProps<T> | MultiSelectProps<T>) {
  const { label, options, required } = props;

  const isSelected = (value: T) => (props.multi ? props.value.includes(value) : props.value === value);

  const handlePress = (value: T) => {
    if (props.multi) {
      const next = props.value.includes(value) ? props.value.filter((v) => v !== value) : [...props.value, value];
      props.onChange(next);
    } else {
      props.onChange(value);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => handlePress(option.value)}
              style={[styles.chip, selected && styles.chipSelected]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  required: { color: colors.danger },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 14 },
  chipTextSelected: { color: colors.primaryDark, fontWeight: "600" },
});
