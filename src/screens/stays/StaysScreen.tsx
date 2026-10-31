/**
 * Hotels & Villas — vendor's stays list (tab "Manage").
 * GET /stays?vendorOnly=true. Cards open StayDetail for room/slot management.
 */

import React, { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { StayApi } from "../../lib/api";
import { listingStatusMeta } from "../../rbac/categories";
import { StatusPill, formatMoney } from "../../components/Pill";
import { SmartImage } from "../../components/ui/SmartImage";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import { resolveImageUrl } from "../../lib/config";
import type { Stay } from "../../lib/types";
import type { TabScreenProps } from "../../navigation/types";

export function StaysScreen({ navigation }: TabScreenProps<"Manage">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Stack screens of the parent navigator are reached through nav (keeps tab nav typed).
  const nav = navigation as unknown as any;

  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const items = await StayApi.mine();
      if (mounted.current) setStays(items);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  React.useEffect(() => {
    const sub = navigation.addListener("focus", () => load(true));
    return sub;
  }, [navigation, load]);

  const renderItem = ({ item }: { item: Stay }) => {
    const meta = listingStatusMeta(item.status);
    const totalRooms = item.type === "hotel" ? item.totalRooms ?? "—" : item.bedrooms ?? "—";
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => nav.navigate("StayDetail", { stayId: String(item._id ?? item.id) })}
      >
        <SmartImage uri={resolveImageUrl(item.image ?? item.images?.[0])} style={styles.image} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.name ?? "Unnamed stay"}
            </Text>
            <StatusPill meta={meta} small />
          </View>
          <View style={[styles.metaRow, { backgroundColor: colors.chipBg }]}>
            <Ionicons
              name={(item.type === "villa" ? "home" : "business") as never}
              size={12}
              color={colors.textMuted}
            />
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {item.type === "villa" ? "Villa" : "Hotel"}
              {item.city ? ` · ${item.city}` : ""}
            </Text>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.type === "villa"
              ? `${formatMoney(item.price)} · ${totalRooms} BR · ${item.maximumGuests ?? "—"} guests`
              : `${formatMoney(item.price)} · ${totalRooms} rooms`}
          </Text>
          {item.rejectionReason ? (
            <Text style={{ color: colors.danger, fontSize: 11.5 }} numberOfLines={1}>
              {item.rejectionReason}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>HOTELS & VILLAS</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Stays</Text>
        </View>
        <Pressable
          onPress={() => nav.navigate("StayForm")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {loading && stays.length === 0 ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={16} />
          ))}
        </View>
      ) : stays.length === 0 && !loading ? (
        <StateView
          visible
          full={false}
          title={failed ? "Couldn't load stays" : "No stays yet"}
          message={failed ? "Check your connection and retry." : "Add your first hotel or villa to start receiving hourly bookings."}
          onRetry={failed ? () => load() : undefined}
          actionLabel={failed ? undefined : "Add stay"}
          onAction={failed ? undefined : () => nav.navigate("StayForm")}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={stays}
          keyExtractor={(item, i) => String(item._id ?? item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  eyebrow: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    alignItems: "center",
  },
  image: { width: 92, height: 88, borderRadius: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  meta: { fontSize: 11, fontWeight: "600" },
  price: { fontSize: 13, fontWeight: "800", marginTop: 1 },
});





