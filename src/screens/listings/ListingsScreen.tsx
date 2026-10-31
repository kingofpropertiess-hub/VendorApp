/**
 * Homes & Apartments — vendor's rental listings (tab "Manage").
 * GET /properties?vendorOnly=true&format=json — rental workflows only.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { PropertyApi } from "../../lib/api";
import { listingStatusMeta } from "../../rbac/categories";
import { StatusPill, formatMoney } from "../../components/Pill";
import { SmartImage } from "../../components/ui/SmartImage";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import { resolveImageUrl } from "../../lib/config";
import type { Property } from "../../lib/types";
import type { TabScreenProps } from "../../navigation/types";

export function ListingsScreen({ navigation }: TabScreenProps<"Manage">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Stack screens of the parent navigator are reached through nav (keeps tab nav typed).
  const nav = navigation as unknown as any;

  const [items, setItems] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(
    async (asRefresh = false) => {
      asRefresh ? setRefreshing(true) : setLoading(true);
      setFailed(false);
      try {
        const res = await PropertyApi.mine({ search: search.trim() || undefined });
        if (mounted.current) setItems(res.items);
      } catch {
        if (mounted.current) setFailed(true);
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search],
  );

  React.useEffect(() => {
    mounted.current = true;
    const delay = search ? setTimeout(() => load(), 450) : 0; // debounced search
    return () => {
      mounted.current = false;
      if (delay) clearTimeout(delay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  React.useEffect(() => {
    const sub = navigation.addListener("focus", () => load(true));
    return sub;
  }, [navigation, load]);

  const visible = items.filter((p) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Live") return ["PUBLISHED", "Published", "Active"].includes(p.status ?? "");
    if (statusFilter === "Pending") return p.status === "PENDING_APPROVAL";
    if (statusFilter === "Draft") return ["DRAFT", "Draft"].includes(p.status ?? "");
    if (statusFilter === "Inactive") return p.status === "Inactive" || p.status === "REJECTED";
    return true;
  });

  const togglePublish = async (item: Property) => {
    const isLive = ["PUBLISHED", "Published", "Active"].includes(item.status ?? "");
    try {
      await PropertyApi.updateStatus(String(item._id ?? item.id), isLive ? "Inactive" : "Active");
      if (mounted.current) load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not change the listing status.");
    }
  };

  const renderItem = ({ item }: { item: Property }) => {
    const meta = listingStatusMeta(item.status);
    const isLive = ["PUBLISHED", "Published", "Active"].includes(item.status ?? "");
    const id = String(item._id ?? item.id);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          onPress={() => nav.navigate("PropertyForm", { propertyId: id })}
          style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
        >
          <SmartImage uri={resolveImageUrl(item.images?.[0] ?? item.image)} style={styles.image} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {item.title ?? "Unnamed listing"}
              </Text>
              <StatusPill meta={meta} small />
            </View>
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {item.type ?? ""}{item.locality ? ` · ${item.locality}` : item.city ? ` · ${item.city}` : ""}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { backgroundColor: colors.chipBg, color: colors.textMuted }]}>
                {item.bhk ?? item.bedrooms ?? "—"} BHK
              </Text>
              <Text style={[styles.meta, { backgroundColor: colors.chipBg, color: colors.textMuted }]}>
                {item.furnishing ?? "—"}
              </Text>
              {item.isZeroBrokerage ? (
                <Text style={[styles.meta, { backgroundColor: "rgba(14,159,110,0.12)", color: "#0E9F6E" }]}>Zero brokerage</Text>
              ) : null}
            </View>
            <Text style={[styles.rent, { color: colors.primary }]}>
              {formatMoney(item.monthlyRent ?? item.price ?? 0)} / month
              {item.securityDeposit ? ` · Deposit ${formatMoney(item.securityDeposit)}` : ""}
            </Text>
          </View>
        </Pressable>
        <View style={styles.cardFooter}>
          <Pressable
            onPress={() => nav.navigate("PropertyForm", { propertyId: id })}
            style={[styles.cardBtn, { backgroundColor: colors.chipBg }]}
          >
            <Ionicons name="create-outline" size={13} color={colors.text} />
            <Text style={[styles.cardBtnText, { color: colors.text }]}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("PropertySlots", { propertyId: id, title: item.title })}
            style={[styles.cardBtn, { backgroundColor: colors.chipBg }]}
          >
            <Ionicons name="calendar-outline" size={13} color={colors.text} />
            <Text style={[styles.cardBtnText, { color: colors.text }]}>Slots</Text>
          </Pressable>
          {item.status === "PENDING_APPROVAL" || ["DRAFT", "Draft"].includes(item.status ?? "") ? null : (
            <Pressable
              onPress={() => togglePublish(item)}
              style={[styles.cardBtn, { backgroundColor: colors.chipBg }]}
            >
              <Ionicons name={isLive ? "eye-off-outline" : "eye-outline"} size={13} color={colors.text} />
              <Text style={[styles.cardBtnText, { color: isLive ? colors.danger : "#0E9F6E" }]}>
                {isLive ? "Unlist" : "Publish"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>HOMES & APARTMENTS</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Listings</Text>
        </View>
        <Pressable
          onPress={() => nav.navigate("PropertyForm", {})}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search listings…"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Status chips */}
      <View style={styles.filterRow}>
        {["All", "Live", "Pending", "Draft", "Inactive"].map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filter,
              { borderColor: statusFilter === s ? colors.primary : colors.border, backgroundColor: statusFilter === s ? `${colors.primary}12` : "transparent" },
            ]}
          >
            <Text style={{ fontSize: 11.5, fontWeight: "700", color: statusFilter === s ? colors.primary : colors.textMuted }}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {loading && items.length === 0 ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} radius={16} />
          ))}
        </View>
      ) : !items.length && !loading ? (
        <StateView
          visible
          full={false}
          kind={failed ? "error" : "empty"}
          title={failed ? "Couldn't load listings" : "No rental listings yet"}
          message={failed ? "Check your connection and retry." : "Add your first home or apartment for rent."}
          onRetry={failed ? () => load() : undefined}
          actionLabel={failed ? undefined : "Add listing"}
          onAction={failed ? undefined : () => nav.navigate("PropertyForm", {})}
          style={{ marginTop: 30 }}
        />
      ) : visible.length === 0 ? (
        <StateView visible full={false} title="No listings in this filter" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={visible}
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
    paddingBottom: 10,
  },
  eyebrow: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 10,
  },
  cardBody: { flexDirection: "row", gap: 12, alignItems: "center" },
  image: { width: 92, height: 80, borderRadius: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  sub: { fontSize: 11.5 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  meta: { fontSize: 10.5, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  rent: { fontSize: 13, fontWeight: "800" },
  cardFooter: { flexDirection: "row", gap: 8, marginTop: 8 },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  cardBtnText: { fontSize: 11.5, fontWeight: "700" },
});




