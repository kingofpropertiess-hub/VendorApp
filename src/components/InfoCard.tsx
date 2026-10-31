/** Sectioned key-value card used across detail screens. */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export interface KVRow {
  key: string;
  value?: string | number | null;
}

export function InfoCard({
  title,
  rows,
  extras,
  style,
}: {
  title: string;
  rows: KVRow[];
  extras?: React.ReactNode;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {rows
        .filter((r) => r.value !== undefined && r.value !== null && String(r.value).trim() !== "")
        .map((row, i) => (
          <View key={`${row.key}_${i}`} style={styles.row}>
            <Text style={[styles.k, { color: colors.textMuted }]}>{row.key}</Text>
            <Text style={[styles.v, { color: colors.text }]}>{String(row.value)}</Text>
          </View>
        ))}
      {extras}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  title: { fontSize: 11.5, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 5,
  },
  k: { fontSize: 13, flexShrink: 0 },
  v: { fontSize: 13, fontWeight: "600", textAlign: "right", flexShrink: 1 },
});
