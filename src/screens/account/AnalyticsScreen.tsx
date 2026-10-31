/**
 * Performance & earnings — GET /analytics/overview (+ /earnings).
 * Real data only: monthlyPerformance bars (leads/bookings/earnings).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StateView } from "../../components/ui/StateView";
import { StatCard } from "../../components/StatCard";
import { formatMoney } from "../../components/Pill";
import { useTheme } from "../../theme/ThemeProvider";
import { AnalyticsApi } from "../../lib/api";
import type { AnalyticsOverview } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const BAR_COLORS: Record<string, string> = { leads: "#2563EB", bookings: "#0E9F6E", earnings: "#E11D48" };

export function AnalyticsScreen({ navigation }: StackScreenProps<"Analytics">) {
  const { colors } = useTheme();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [earnings, setEarnings] = useState<{ totalEarnings: number; paidTransactionsCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const [ov, earn] = await Promise.all([
        AnalyticsApi.overview(),
        AnalyticsApi.earnings().catch(() => null),
      ]);
      if (mounted.current) {
        setOverview(ov);
        setEarnings(earn);
      }
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const months = overview?.monthlyPerformance ?? [];
  const maxEarnings = Math.max(1, ...months.map((m) => Number(m.earnings) || 0));
  const totalPeriodEarnings = months.reduce((sum, m) => sum + (Number(m.earnings) || 0), 0);

  const conversion =
    overview && overview.totalLeads > 0
      ? `${Math.round(((overview.convertedLeads ?? 0) / overview.totalLeads) * 100)}%`
      : "—";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader title="Performance" subtitle="Leads · bookings · earnings" onBack={() => navigation.goBack()} />
      </View>

      {loading && !overview ? (
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton height={110} radius={16} />
          <Skeleton height={180} radius={16} />
        </View>
      ) : failed || !overview ? (
        <StateView
          visible
          full={false}
          kind="error"
          title="Couldn't load analytics"
          message="Please check your connection."
          onRetry={() => load()}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {/* KPI cards */}
          <View style={styles.grid}>
            <StatCard icon="trending-up-outline" label="Active listings" value={overview.activeListings ?? 0} accent="success" />
            <StatCard icon="chatbubbles-outline" label="Total leads" value={overview.totalLeads ?? 0} accent="info" />
          </View>
          <View style={styles.grid}>
            <StatCard icon="calendar-outline" label="Total bookings" value={overview.totalBookings ?? 0} accent="primary" />
            <StatCard icon="checkmark-circle-outline" label="Lead conversion" value={conversion} accent="warning" />
          </View>

          {/* Earnings summary (actual backend calculations) */}
          <View style={[styles.earningsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.earnIcon, { backgroundColor: `${colors.primary}14` }]}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: "700" }}>TOTAL EARNINGS</Text>
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "900", marginTop: 2 }}>
                {formatMoney(earnings?.totalEarnings ?? overview.totalEarnings ?? 0)}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
                {monthlyTeaser(months)} · {earnings?.paidTransactionsCount ?? "—"} paid transactions
              </Text>
            </View>
          </View>

          {/* Monthly chart */}
          <Text style={[styles.section, { color: colors.text }]}>Last 6 months</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {months.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 12.5, textAlign: "center", paddingVertical: 24 }}>
                No performance data yet — months appear once bookings and leads arrive.
              </Text>
            ) : (
              months.map((m) => (
                <View key={m.month} style={styles.monthRow}>
                  <Text style={{ width: 34, color: colors.textMuted, fontSize: 11.5, fontWeight: "700" }}>{m.month}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Bar value={Number(m.leads) || 0} max={Math.max(1, ...months.map((x) => Number(x.leads) || 0))} color={BAR_COLORS.leads} />
                    <Bar value={Number(m.bookings) || 0} max={Math.max(1, ...months.map((x) => Number(x.bookings) || 0))} color={BAR_COLORS.bookings} />
                    <Bar value={Number(m.earnings) || 0} max={maxEarnings} color={BAR_COLORS.earnings} />
                  </View>
                  <Text style={{ width: 62, textAlign: "right", color: colors.text, fontSize: 11.5, fontWeight: "800" }}>
                    {formatMoney(Number(m.earnings) || 0)}
                  </Text>
                </View>
              ))
            )}
            <View style={styles.legend}>
              <Legend color={BAR_COLORS.leads} label="Leads" />
              <Legend color={BAR_COLORS.bookings} label="Bookings" />
              <Legend color={BAR_COLORS.earnings} label="Earnings" />
            </View>
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: "center", marginTop: 10 }}>
            Period earnings from displayed months: {formatMoney(totalPeriodEarnings)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function monthlyTeaser(months: { month: string; earnings: number }[]): string {
  const best = months.reduce(
    (best, m) => ((Number(m.earnings) || 0) > (Number((best as any)?.earnings) || -1) ? m : best),
    null as null | { month: string; earnings: number },
  );
  return best && Number(best.earnings) > 0 ? `best month ${best.month}` : "no settlement data yet";
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          width: `${Math.max(3, Math.round((value / max) * 100))}%`,
          opacity: value > 0 ? 1 : 0.25,
        }}
      />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 10.5, color: "#6C757D", fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10, marginTop: 10 },
  earningsCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 16,
  },
  earnIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  section: { fontSize: 15.5, fontWeight: "800", marginTop: 20, marginBottom: 8 },
  chartCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  monthRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barTrack: { flex: 1, backgroundColor: "rgba(128,128,128,0.10)", borderRadius: 3, overflow: "hidden", height: 6 },
  legend: { flexDirection: "row", gap: 16, marginTop: 2 },
});