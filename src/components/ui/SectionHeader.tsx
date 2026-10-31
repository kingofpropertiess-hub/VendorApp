import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sub, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 2 },
  title: { fontSize: 15.5, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 1 },
  link: { flexDirection: "row", alignItems: "center" },
  linkText: { fontSize: 12.5, fontWeight: "700" },
});
