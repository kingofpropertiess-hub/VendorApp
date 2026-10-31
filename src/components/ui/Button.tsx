import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Variant = "primary" | "outline" | "ghost" | "danger";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  labelStyle,
  icon,
}: Props) {
  const { colors } = useTheme();
  const off = disabled || loading;

  const bg =
    variant === "primary" ? colors.primary
    : variant === "danger" ? colors.danger
    : "transparent";

  const fg =
    variant === "outline" || variant === "ghost"
      ? variant === "outline" ? colors.primary : colors.text
      : colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color: fg }, labelStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 16, fontWeight: "700" },
});
