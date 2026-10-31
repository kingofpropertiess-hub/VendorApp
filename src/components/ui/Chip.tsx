import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dotted?: boolean;
  icon?: React.ReactNode;
}

export function Chip({ label, selected, onPress, icon }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.chipBg,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: selected ? colors.onPrimary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: { fontSize: 13.5, fontWeight: "600" },
});
