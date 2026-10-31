/** Dashboard stat card — premium style matching the Client App's card language. */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider";

interface Props {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "info";
  style?: object;
}

const ACCENTS: Record<NonNullable<Props["accent"]>, string> = {
  primary: "#E11D48",
  success: "#0E9F6E",
  warning: "#D97706",
  info: "#2563EB",
};

export function StatCard({ icon, label, value, hint, accent = "primary", style }: Props) {
  const { colors, isDark } = useTheme();
  const tint = isDark ? lighten(ACCENTS[accent]) : ACCENTS[accent];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: "#0F172A",
        },
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon as never} size={18} color={tint} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 70);
  const g = Math.min(255, ((n >> 8) & 255) + 70);
  const b = Math.min(255, (n & 255) + 80);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value: { fontSize: 19, fontWeight: "900" },
  label: { fontSize: 11.5, fontWeight: "600", marginTop: 2 },
  hint: { fontSize: 10.5, marginTop: 2 },
});
