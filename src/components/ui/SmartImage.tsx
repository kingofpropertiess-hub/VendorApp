import React from "react";
import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  uri?: string | null;
  style?: ViewStyle;
  resizeMode?: "cover" | "contain";
  label?: string;
  seed?: string;
}

/** Image with graceful fallback (brand icon + label) when the URL is missing or fails to load. */
export function SmartImage({ uri, style, resizeMode = "cover", label }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = React.useState(false);
  const src = (uri || "").trim();

  if (!src || failed) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surfaceAlt }, style]}>
        <Ionicons name="image-outline" size={30} color={colors.border} />
        {label ? <Text style={[styles.fallbackText, { color: colors.textMuted }]}>{label}</Text> : null}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      resizeMode={resizeMode}
      style={style as never}
      onError={() => setFailed(true)}
      accessible
      accessibilityLabel={label || "Listing photo"}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center", gap: 4 },
  fallbackText: { fontSize: 12, fontWeight: "600" },
});
