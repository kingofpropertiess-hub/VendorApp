import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: { width?: number | string; height?: number; radius?: number; style?: object }) {
  const { colors } = useTheme();
  return <View style={[{ width: width as never, height, borderRadius: radius, backgroundColor: colors.skeleton }, style]} />;
}

export function PropertyCardSkeleton({ horizontal = false }: { horizontal?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        g.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        horizontal && { width: 280, marginRight: 12 },
      ]}
    >
      <Skeleton height={150} radius={12} />
      <View style={{ padding: 12, gap: 8 }}>
        <Skeleton height={15} width="80%" />
        <Skeleton height={13} width="60%" />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
          <Skeleton height={12} width={54} />
          <Skeleton height={12} width={54} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3, horizontal = false }: { count?: number; horizontal?: boolean }) {
  return (
    <View style={[horizontal && { flexDirection: "row" }]}>
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} horizontal={horizontal} />
      ))}
    </View>
  );
}

const g = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
});
