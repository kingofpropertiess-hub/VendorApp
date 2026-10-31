import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "./Button";

interface Props {
  visible: boolean;
  kind?: "loading" | "empty" | "error" | "offline";
  message?: string;
  title?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  full?: boolean;
  style?: ViewStyle;
}

export function StateView({
  visible,
  kind = "empty",
  title,
  message,
  onRetry,
  actionLabel,
  onAction,
  full = true,
  style,
}: Props) {
  const { colors } = useTheme();
  if (!visible) return null;

  const icon =
    kind === "error" ? "cloud-offline-outline" :
    kind === "offline" ? "wifi-outline" :
    kind === "loading" ? undefined :
    "file-tray-outline";

  return (
    <View
      style={[
        full ? styles.fill : styles.inline,
        styles.center,
        { backgroundColor: colors.background, padding: 24 },
        style,
      ]}
    >
      {kind === "loading" ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.chipBg }]}>
          <Ionicons name={icon as never} size={30} color={colors.textMuted} />
        </View>
      )}
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {message ? <Text style={[styles.msg, { color: colors.textMuted }]}>{message}</Text> : null}
      {kind !== "loading" && onRetry ? (
        <Button label="Try again" onPress={onRetry} variant="outline" style={{ minWidth: 140, marginTop: 16 }} />
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ minWidth: 150, marginTop: 12 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  inline: { paddingVertical: 32, borderRadius: 16 },
  center: { alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  msg: { fontSize: 13.5, marginTop: 6, textAlign: "center", maxWidth: 320, lineHeight: 20 },
});
