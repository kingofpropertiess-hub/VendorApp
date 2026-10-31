/**
 * Home Experts — vendor's style-expert profiles (tab "Manage").
 * GET /vendor/style-experts, vendor-scoped (vendorId OR vendorEmail on backend).
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { StyleExpertApi } from "../../lib/api";
import { listingStatusMeta } from "../../rbac/categories";
import type { StyleExpertCategory } from "../../lib/types";
import { StatusPill, formatMoney } from "../../components/Pill";
import { SmartImage } from "../../components/ui/SmartImage";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import { resolveImageUrl } from "../../lib/config";
import type { StyleExpert } from "../../lib/types";
import type { TabScreenProps } from "../../navigation/types";

const FILTERS: { id: "ALL" | StyleExpertCategory; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "FURNITURE", label: "Furniture" },
  { id: "INTERIOR_DESIGNER", label: "Interior" },
  { id: "RENOVATION", label: "Renovation" },
];

export function ExpertsScreen({ navigation }: TabScreenProps<"Manage">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Stack screens of the parent navigator are reached through nav (keeps tab nav typed).
  const nav = navigation as unknown as any;

  const [items, setItems] = useState<StyleExpert[]>([]);
  const [filter, setFilter] = useState<"ALL" | StyleExpertCategory>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const res = await StyleExpertApi.mine();
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

  const togglePublish = async (item: StyleExpert) => {
    const isLive = ["PUBLISHED", "Published", "Active"].includes(item.status ?? "");
    try {
      await StyleExpertApi.update(String(item.id), { status: isLive ? "Draft" : "Published" }, []);
      if (mounted.current) load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update the status.");
    }
  };

  const visible = filter === "ALL" ? items : items.filter((e) => e.category === filter);

  const renderItem = ({ item }: { item: StyleExpert }) => {
    const meta = listingStatusMeta(item.status);
    const id = String(item.id);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
          onPress={() => nav.navigate("ExpertForm", { expertId: id })}
        >
          <SmartImage uri={resolveImageUrl(item.profileImage)} style={styles.image} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <StatusPill meta={meta} small />
            </View>
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {item.title || (item.category === "FURNITURE" ? "Furniture Expert" : item.category === "INTERIOR_DESIGNER" ? "Interior Designer" : "Renovation Expert")}
              {item.city ? ` · ${item.city}` : ""}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.primary, fontWeight: "800" }}>
              {item.startingPrice?.amount ? `From ${formatMoney(item.startingPrice.amount)}` + (item.startingPrice.label ? ` ${item.startingPrice.label}` : "") : item.experienceYears ? `${item.experienceYears} yrs exp.` : "—"}
            </Text>
          </View>
        </Pressable>
        <View style={styles.cardFooter}>
          <Pressable onPress={() => nav.navigate("ExpertForm", { expertId: id })} style={[styles.cardBtn, { backgroundColor: colors.chipBg }]}>
            <Ionicons name="create-outline" size={13} color={colors.text} />
            <Text style={[styles.cardBtnText, { color: colors.text }]}>Edit</Text>
          </Pressable>
          {item.status === "PENDING_APPROVAL" ? null : (
            <Pressable onPress={() => togglePublish(item)} style={[styles.cardBtn, { backgroundColor: colors.chipBg }]}>
              <Ionicons
                name={["PUBLISHED", "Published", "Active"].includes(item.status ?? "") ? "eye-off-outline" : "eye-outline"}
                size={13}
                color={colors.text}
              />
              <Text style={[styles.cardBtnText, { color: ["PUBLISHED", "Published", "Active"].includes(item.status ?? "") ? colors.danger : "#0E9F6E" }]}>
                {["PUBLISHED", "Published", "Active"].includes(item.status ?? "") ? "Unpublish" : "Publish"}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() =>
              Alert.alert("Delete service", `Remove "${item.name}" permanently?`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await StyleExpertApi.remove(id);
                      if (mounted.current) load(true);
                    } catch (err: any) {
                      Alert.alert("Error", err?.message ?? "Could not delete.");
                    }
                  },
                },
              ])
            }
            style={[styles.cardBtn, { backgroundColor: colors.chipBg }]}
          >
            <Ionicons name="trash-outline" size={13} color={colors.danger} />
            <Text style={[styles.cardBtnText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>HOME EXPERT SERVICES</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Services</Text>
        </View>
        <Pressable onPress={() => nav.navigate("ExpertForm", {})} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[
              styles.filter,
              { borderColor: filter === f.id ? colors.primary : colors.border, backgroundColor: filter === f.id ? `${colors.primary}12` : "transparent" },
            ]}
          >
            <Text style={{ fontSize: 11.5, fontWeight: "700", color: filter === f.id ? colors.primary : colors.textMuted }}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading && !items.length ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} radius={16} />
          ))}
        </View>
      ) : !items.length ? (
        <StateView
          visible
          full={false}
          kind={failed ? "error" : "empty"}
          title={failed ? "Couldn't load services" : "No service profiles yet"}
          message={failed ? "Check your connection and retry." : "Create your expert profile — furniture, interior design or renovation services."}
          onRetry={failed ? () => load() : undefined}
          actionLabel={failed ? undefined : "Add service"}
          onAction={failed ? undefined : () => nav.navigate("ExpertForm", {})}
          style={{ marginTop: 26 }}
        />
      ) : !visible.length ? (
        <StateView visible full={false} title="No profiles in this category" style={{ marginTop: 26 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, i) => String(item.id ?? item._id ?? i)}
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
    paddingBottom: 8,
  },
  eyebrow: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 10,
  },
  image: { width: 92, height: 80, borderRadius: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  sub: { fontSize: 11.5 },
  cardFooter: { flexDirection: "row", gap: 8, marginTop: 4 },
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





