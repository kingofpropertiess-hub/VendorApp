/**
 * Enquiries / Leads inbox (tab "Inbox" for TO_LET and STYLE vendors).
 * GET /inquiries/leads — vendor-scoped. Statuses: Pending | Contacted | Accepted | Closed.
 */

import React, { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { LeadApi } from "../../lib/api";
import { leadStatusMeta } from "../../rbac/categories";
import { StatusPill } from "../../components/Pill";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import type { Lead } from "../../lib/types";
import type { TabScreenProps } from "../../navigation/types";

type Filter = "All" | "Pending" | "Contacted" | "Accepted" | "Closed";
const FILTERS: Filter[] = ["All", "Pending", "Contacted", "Accepted", "Closed"];

export function LeadsScreen({ navigation }: TabScreenProps<"Inbox">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Stack screens of the parent navigator are reached through nav (keeps tab nav typed).
  const nav = navigation as unknown as any;

  const [items, setItems] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const res = await LeadApi.list();
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

  const visible = (filter === "All" ? items : items.filter((l) => l.status === filter)).slice().sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );

  const renderItem = ({ item }: { item: Lead }) => {
    const meta = leadStatusMeta(item.status);
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => nav.navigate("LeadDetail", { leadId: String(item._id ?? item.id) })}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.buyerName || item.name || "Customer"}
            </Text>
            <StatusPill meta={meta} small />
          </View>
          <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
            {item.propertyTitle || "Enquiry"} · {item.buyerPhone || item.phone || item.buyerEmail || item.email || ""}
          </Text>
          {item.message ? (
            <Text style={[styles.msg, { color: colors.textMuted }]} numberOfLines={2}>
              "{item.message}"
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>CUSTOMER ENQUIRIES</Text>
          <Text style={[styles.title, { color: colors.text }]}>Enquiries</Text>
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
          title={failed ? "Couldn't load enquiries" : "No enquiries here"}
          message={failed ? "Check your connection and retry." : "Rental and service enquiries from customers will appear here."}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  eyebrow: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  filterRow: { paddingBottom: 6 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 13.5, fontWeight: "800", flex: 1 },
  sub: { fontSize: 12 },
  msg: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
});




