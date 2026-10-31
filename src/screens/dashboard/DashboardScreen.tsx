/**
 * Category-aware dashboard — data from GET /vendor/dashboard.
 *
 * Guards: suspended/rejected accounts never reach here (RootNavigator gate).
 * Everything shown is derived from real backend stats — no fabricated data.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { useActiveCategory } from "../../rbac/ActiveCategory";
import { authorizedCategories, leadStatusMeta, bookingStatusMeta, vendorName, CATEGORY_META } from "../../rbac/categories";
import { StatCard } from "../../components/StatCard";
import { StatusPill } from "../../components/Pill";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import { VendorApi } from "../../lib/api";
import type { DashboardStats } from "../../lib/types";
import type { TabScreenProps } from "../../navigation/types";

const QUICK: Record<string, { icon: string; label: string; action: "add" | "inbox" | "listings" | "analytics" }[]> = {
  HOTEL_VILLA: [
    { icon: "add-circle", label: "Add Stay", action: "listings" },
    { icon: "notifications-outline", label: "New bookings", action: "inbox" },
    { icon: "stats-chart-outline", label: "Performance", action: "analytics" },
    { icon: "settings-outline", label: "Settings", action: "inbox" },
  ],
  TO_LET: [
    { icon: "add-circle", label: "Add Listing", action: "add" },
    { icon: "chatbubbles-outline", label: "Enquiries", action: "inbox" },
    { icon: "stats-chart-outline", label: "Performance", action: "analytics" },
    { icon: "home-outline", label: "My Listings", action: "listings" },
  ],
  STYLE: [
    { icon: "add-circle", label: "Add Service", action: "listings" },
    { icon: "chatbubbles-outline", label: "Requests", action: "inbox" },
    { icon: "stats-chart-outline", label: "Performance", action: "analytics" },
    { icon: "person-outline", label: "Portfolio", action: "listings" },
  ],
};

export function DashboardScreen({ navigation }: TabScreenProps<"Dashboard">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useVendorAuth();
  const { category, setCategory } = useActiveCategory();
  // Stack screens of the parent navigator are reached through nav (keeps tab nav typed).
  const nav = navigation as unknown as any;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const data = await VendorApi.getDashboard();
      if (mountedRef.current) setStats(data as DashboardStats);
    } catch {
      if (mountedRef.current) setFailed(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [category, load]);

  React.useEffect(() => {
    const unsub = navigation.addListener("focus", () => load(true));
    return unsub;
  }, [navigation, load]);

  const cards = authorizedCategories(user);
  const catMeta = CATEGORY_META[category];

  const statConfig = () => {
    switch (category) {
      case "HOTEL_VILLA":
        return [
          { icon: "bed-outline", label: "Hotels & villas", value: stats?.totalStays ?? 0, accent: "primary" as const },
          { icon: "calendar-outline", label: "Total bookings", value: stats?.totalBookings ?? 0, accent: "info" as const },
          { icon: "trending-up-outline", label: "Active listings", value: stats?.activeListings ?? 0, accent: "success" as const },
          { icon: "cash-outline", label: "Earnings", value: stats?.totalEarnings ?? "₹0", accent: "warning" as const },
        ];
      case "TO_LET":
        return [
          { icon: "home-outline", label: "Rental listings", value: stats?.totalToLet ?? 0, accent: "primary" as const },
          { icon: "chatbubbles-outline", label: "Total enquiries", value: stats?.totalLeads ?? 0, accent: "info" as const },
          { icon: "sparkle-outline", label: "New enquiries", value: stats?.newInquiries ?? 0, accent: "warning" as const },
          { icon: "trending-up-outline", label: "Active listings", value: stats?.activeListings ?? 0, accent: "success" as const },
        ];
      case "STYLE":
        return [
          { icon: "sparkles-outline", label: "Expert services", value: stats?.totalStyle ?? 0, accent: "primary" as const },
          { icon: "chatbubbles-outline", label: "Enquiries", value: stats?.totalLeads ?? 0, accent: "info" as const },
          { icon: "sparkle-outline", label: "New enquiries", value: stats?.newInquiries ?? 0, accent: "warning" as const },
          { icon: "trending-up-outline", label: "Active listings", value: stats?.activeListings ?? 0, accent: "success" as const },
        ];
      default:
        return [];
    }
  };

  const goto = (action: string) => {
    if (action === "add") nav.navigate("PropertyForm", {});
    else if (action === "inbox") nav.navigate("Main", { screen: "Inbox" });
    else if (action === "listings") nav.navigate("Main", { screen: "Manage" });
    else nav.navigate("Analytics");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>VENDOR DASHBOARD</Text>
          <Text style={[styles.hello, { color: colors.text }]} numberOfLines={1}>
            Hello, {vendorName(user)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
            <StatusPill meta={{ label: catMeta.label, color: colors.primary, bg: `${colors.primary}14` }} />
            {cards.length > 1 ? (
              <Pressable onPress={() => setCategory(cards[(cards.indexOf(category) + 1) % cards.length])}>
                <Text style={{ color: colors.primary, fontSize: 11.5, fontWeight: "800" }}>Switch ▾</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <Pressable onPress={() => nav.navigate("Notifications")} style={styles.bell}>
          <Ionicons name="notifications-outline" size={21} color={colors.text} />
          {stats?.unreadNotifications ? (
            <View style={[styles.dot, { backgroundColor: colors.danger }]}>
              <Text style={styles.dotText}>{stats.unreadNotifications > 9 ? "9+" : stats.unreadNotifications}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
      >
        <StateView
          visible={!loading && failed && !stats}
          kind="error"
          full={false}
          title="Couldn't load dashboard"
          message="A network issue interrupted the dashboard. Please retry."
          onRetry={() => load()}
          style={{ marginVertical: 30 }}
        />

        {/* Stat cards */}
        {loading ? (
          <View style={styles.statGrid}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height={104} radius={16} style={{ flex: 1 }} />
            ))}
          </View>
        ) : stats ? (
          <View style={styles.statGrid}>
            {statConfig().map((s) => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
            ))}
          </View>
        ) : null}

        {/* Quick actions */}
        <Text style={[styles.section, { color: colors.text }]}>Quick actions</Text>
        <View style={styles.quickRow}>
          {QUICK[category]?.map((q) => (
            <Pressable
              key={q.label}
              onPress={() => goto(q.action)}
              style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name={q.icon as never} size={20} color={colors.primary} />
              <Text style={[styles.quickText, { color: colors.text }]}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent leads / bookings */}
        {category !== "HOTEL_VILLA" ? (
          <Section
            title="Recent enquiries"
            icon="chatbubbles-outline"
            colors={colors}
            onSeeAll={() => nav.navigate("Main", { screen: "Inbox" })}
            count={stats?.recentLeads?.length}
          >
            {(stats?.recentLeads ?? []).map((lead) => (
              <Pressable
                key={String(lead.id ?? lead._id)}
                style={[styles.recent, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => nav.navigate("LeadDetail", { leadId: String(lead.id ?? lead._id) })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                    {lead.buyerName || lead.name || "Customer"}
                  </Text>
                  <Text style={[styles.recentSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {lead.propertyTitle || "Enquiry"}
                  </Text>
                </View>
                <StatusPill meta={leadStatusMeta(lead.status)} small />
              </Pressable>
            ))}
            {!stats?.recentLeads?.length ? (
              <Text style={[styles.emptyMini, { color: colors.textMuted }]}>No enquiries yet.</Text>
            ) : null}
          </Section>
        ) : (
          <Section
            title="Recent bookings"
            icon="calendar-outline"
            colors={colors}
            onSeeAll={() => nav.navigate("Main", { screen: "Inbox" })}
            count={stats?.recentBookings?.length}
          >
            {(stats?.recentBookings ?? []).map((b) => (
              <Pressable
                key={String(b.id ?? b._id)}
                style={[styles.recent, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => nav.navigate("BookingDetail", { bookingId: String(b.id ?? b._id) })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                    {b.customerName || b.name || "Customer"}
                  </Text>
                  <Text style={[styles.recentSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {b.propertyTitle || `Booking ${(b as any).slotLabel ? `· ${(b as any).slotLabel}` : ""}`}
                  </Text>
                </View>
                <StatusPill meta={bookingStatusMeta(b.bookingStatus)} small />
              </Pressable>
            ))}
            {!stats?.recentBookings?.length ? (
              <Text style={[styles.emptyMini, { color: colors.textMuted }]}>No bookings yet.</Text>
            ) : null}
          </Section>
        )}

        {/* Performance teaser */}
        <Pressable
          onPress={() => nav.navigate("Analytics")}
          style={[styles.perf, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.perfIcon, { backgroundColor: `${colors.primary}12` }]}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>Performance & earnings</Text>
            <Text style={[styles.recentSub, { color: colors.textMuted }]}>Monthly leads, bookings and revenue</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  colors,
  onSeeAll,
  count,
  children,
}: {
  title: string;
  icon: string;
  colors: any;
  onSeeAll: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 22 }}>
      <View style={styles.sectionHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Ionicons name={icon as never} size={15} color={colors.primary} />
          <Text style={[styles.section, { color: colors.text, marginTop: 0 }]}>{title}</Text>
        </View>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </Pressable>
      </View>
      {count === undefined ? (
        <View style={{ gap: 8 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={56} radius={14} />
          ))}
        </View>
      ) : (
        <View style={{ gap: 8 }}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  eyebrow: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  hello: { fontSize: 22, fontWeight: "900", marginTop: 2 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.08)",
  },
  dot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  dotText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  section: { fontSize: 15.5, fontWeight: "800", marginTop: 16 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAll: { fontSize: 12.5, fontWeight: "700" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  quick: {
    flexGrow: 0,
    flexBasis: "48%",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  quickText: { fontSize: 12.5, fontWeight: "700", flex: 1 },
  recent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  recentTitle: { fontSize: 13.5, fontWeight: "700" },
  recentSub: { fontSize: 12, marginTop: 1 },
  emptyMini: { fontSize: 12.5, textAlign: "center", paddingVertical: 14 },
  perf: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 22,
  },
  perfIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});


