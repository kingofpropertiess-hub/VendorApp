/**
 * Hospitality bookings inbox (tab "Inbox" for HOTEL_VILLA).
 * GET /bookings/bookings — backend scopes results to the vendor token.
 */

import React, { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { BookingApi } from "../../lib/api";
import { bookingStatusMeta } from "../../rbac/categories";
import { StatusPill, formatMoney } from "../../components/Pill";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import type { VendorBooking } from "../../lib/types";
import type { TabScreenProps } from "../../navigation/types";

const FILTERS = ["All", "Upcoming", "Confirmed", "Pending", "Completed", "Cancelled"] as const;

function isFalsyBooking(b: VendorBooking): boolean {
  const s = (b.bookingStatus ?? "Confirmed").toLowerCase();
  return s === "cancelled" || s === "rejected";
}

export function BookingsScreen({ navigation }: TabScreenProps<"Inbox">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Stack screens of the parent navigator are reached through nav (keeps tab nav typed).
  const nav = navigation as unknown as any;

  const [items, setItems] = useState<VendorBooking[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const res = await BookingApi.list();
      if (mounted.current) setItems(res);
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

  const today = new Date();
  const visible = items.filter((b) => {
    const status = (b.bookingStatus ?? "Confirmed") as string;
    switch (filter) {
      case "All":
        return true;
      case "Upcoming": {
        const d = b.checkIn ?? b.bookingDate;
        const dt = d ? new Date(String(d)) : null;
        return dt ? dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && !isFalsyBooking(b) : false;
      }
      case "Confirmed":
        return status === "Confirmed";
      case "Pending":
        return status === "Pending";
      case "Completed":
        return status === "Completed";
      case "Cancelled":
        return status === "Cancelled" || status === "Rejected";
      default:
        return true;
    }
  });

  const renderItem = ({ item }: { item: VendorBooking }) => {
    const meta = bookingStatusMeta(item.bookingStatus);
    const isHotel = !!(item.stayId || item.roomNumber || item.duration);
    const when = item.checkIn ?? item.bookingDate ?? "";
    const time = item.slotLabel ?? (item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : item.roomNumber ? `Room ${item.roomNumber}` : "");
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => nav.navigate("BookingDetail", { bookingId: String(item._id ?? item.id) })}
      >
        <View style={[styles.iconWrap, { backgroundColor: isHotel ? `${colors.primary}12` : colors.chipBg }]}>
          <Ionicons name={(isHotel ? "bed-outline" : "time-outline") as never} size={19} color={isHotel ? colors.primary : colors.textMuted} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
              {item.customerName || item.name || "Guest enquiry"}
            </Text>
            <StatusPill meta={meta} small />
          </View>
          <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
            {item.propertyTitle || "Booking"} {item.guests ? `· ${item.guests} guests` : ""}
          </Text>
          <View style={styles.metaRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{when}{time ? ` · ${time}` : ""}</Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: colors.primary }]}>
          {formatMoney(item.amount ?? 0)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>RESERVATIONS & BOOKINGS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Bookings</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item: f }) => (
            <Pressable
              onPress={() => setFilter(f)}
              style={[
                styles.filter,
                { borderColor: filter === f ? colors.primary : colors.border, backgroundColor: filter === f ? `${colors.primary}12` : "transparent" },
              ]}
            >
              <Text style={{ fontSize: 11.5, fontWeight: "700", color: filter === f ? colors.primary : colors.textMuted }}>{f}</Text>
            </Pressable>
          )}
        />
      </View>

      {loading && !items.length ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={78} radius={14} />
          ))}
        </View>
      ) : !visible.length ? (
        <StateView
          visible
          full={false}
          kind={failed ? "error" : "empty"}
          title={failed ? "Couldn't load bookings" : "No bookings here"}
          message={failed ? "Check your connection and retry." : "Hourly reservations and site-visit bookings will appear here."}
          onRetry={failed ? () => load() : undefined}
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, i) => String(item._id ?? item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 90 }}
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
    paddingBottom: 10,
  },
  eyebrow: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  filterRow: { paddingBottom: 6 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  card: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: "center",
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 13.5, fontWeight: "800", flex: 1 },
  sub: { fontSize: 12 },
  metaRow: { marginTop: 2 },
  amount: { fontSize: 13.5, fontWeight: "900" },
});



