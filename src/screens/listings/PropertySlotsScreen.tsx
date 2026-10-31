/**
 * Slot management for To-Let listings (site visits / rentals).
 * Data: GET /bookings/properties/:id/slots?date= (public slot endpoint —
 * statuses: Available | Booked | Blocked | Past | Unavailable).
 * Actions: POST /bookings/vendor/properties/:id/block-slot (+ batch-block).
 */

import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StateView } from "../../components/ui/StateView";
import { useTheme } from "../../theme/ThemeProvider";
import { SlotApi } from "../../lib/api";
import { todayISO } from "../../components/Pill";
import type { PropertySlot } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

function dateStrip(centerISO: string, count = 14): string[] {
  const out: string[] = [];
  const start = new Date(`${centerISO}T00:00:00`);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return out;
}

export function PropertySlotsScreen({ navigation, route }: StackScreenProps<"PropertySlots">) {
  const { colors } = useTheme();
  const propertyId = route.params.propertyId;
  const listingTitle = route.params?.title ?? "";

  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<PropertySlot[] | null>(null);
  const [slotMeta, setSlotMeta] = useState<{
    isTimeSlotEnabled?: boolean;
    openingTime?: string;
    closingTime?: string;
    slotDuration?: number;
    isDayAvailable?: boolean;
  }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<string[]>([]); // optimistic toggles
  const mounted = useRef(true);

  const load = useCallback(
    async (asRefresh = false) => {
      asRefresh ? setRefreshing(true) : setLoading(true);
      setFailed(false);
      try {
        const res = await SlotApi.getSlots(propertyId, date);
        if (mounted.current) {
          setSlots(res?.slots ?? []);
          setSlotMeta(res ?? {});
        }
      } catch {
        if (mounted.current) setFailed(true);
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [propertyId, date],
  );

  React.useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const days = useMemo(() => dateStrip(todayISO()), []);

  const display = (slot: PropertySlot): PropertySlot => {
    if (pending.includes(slot.slotLabel)) {
      return slot.status === "Blocked"
        ? { ...slot, status: "Available" }
        : slot.status === "Available"
        ? { ...slot, status: "Blocked" }
        : slot;
    }
    return slot;
  };

  const toggleSlot = async (slot: PropertySlot) => {
    if (slot.status === "Booked" || slot.status === "Past" || slot.status === "Unavailable") {
      return; // bookings and past slots are not toggleable
    }
    const action = slot.status === "Blocked" ? "unblock" : "block";
    setPending((p) =>
      p.includes(slot.slotLabel) ? p.filter((s) => s !== slot.slotLabel) : [...p, slot.slotLabel],
    );
    try {
      await SlotApi.blockSlot(propertyId, date, slot.slotLabel, action);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update the slot.");
    } finally {
      setPending((p) => p.filter((s) => s !== slot.slotLabel));
      if (mounted.current) load(true);
    }
  };

  const colorFor = (status: string) => {
    switch (status) {
      case "Available":
        return { color: "#0E9F6E", bg: "rgba(14,159,110,0.12)" };
      case "Booked":
        return { color: colors.primary, bg: `${colors.primary}16` };
      case "Blocked":
        return { color: "#6C757D", bg: "rgba(108,117,125,0.14)" };
      case "Past":
        return { color: colors.textMuted, bg: colors.chipBg };
      default:
        return { color: colors.textMuted, bg: colors.chipBg };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader
          title="Visit slots"
          subtitle={listingTitle || "Time-slot availability"}
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* 14-day strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.dateStrip}>
        {days.map((d) => {
          const dt = new Date(`${d}T00:00:00`);
          const active = d === date;
          return (
            <Pressable
              key={d}
              onPress={() => setDate(d)}
              style={[
                styles.dateChip,
                { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
              ]}
            >
              <Text style={{ fontSize: 10.5, fontWeight: "700", color: active ? colors.onPrimary : colors.textMuted }}>
                {dt.toLocaleDateString("en-IN", { weekday: "short" })}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "900", color: active ? colors.onPrimary : colors.text }}>
                {dt.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && !slots ? (
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton height={44} radius={12} />
          <Skeleton height={44} radius={12} />
          <Skeleton height={44} radius={12} />
        </View>
      ) : failed ? (
        <StateView
          visible
          full={false}
          kind="error"
          title="Couldn't load slots"
          message="Please check your connection."
          onRetry={() => load()}
          style={{ marginTop: 30 }}
        />
      ) : !slotMeta.isTimeSlotEnabled ? (
        <StateView
          visible
          full={false}
          title="Time slots disabled"
          message="This listing doesn't accept time-slot bookings. Enable hourly/time-slot mode from the web portal or edit its availability."
          style={{ marginTop: 30 }}
        />
      ) : !slotMeta.isDayAvailable ? (
        <StateView visible full={false} title="Closed on this day" message={`No slots on ${date}. Check open days in the listing availability.`} style={{ marginTop: 30 }} />
      ) : !slots?.length ? (
        <StateView visible full={false} title="No slots configured" message="Add enabled time slots via the listing settings." style={{ marginTop: 30 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          <View style={styles.legendRow}>
            <Legend color="#0E9F6E" label="Available" />
            <Legend color={colors.primary} label="Booked" />
            <Legend color="#6C757D" label="Blocked" />
          </View>
          {slots.map((slot) => {
            const shown = display(slot);
            const c = colorFor(shown.status);
            const disabled = shown.status === "Booked" || shown.status === "Past" || shown.status === "Unavailable";
            return (
              <Pressable
                key={slot.slotLabel}
                onPress={() => toggleSlot(slot)}
                disabled={disabled}
                style={[styles.slot, { backgroundColor: colors.surface, borderColor: colors.border, opacity: disabled ? 0.72 : 1 }]}
              >
                <View>
                  <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: "800" }}>{shown.slotLabel}</Text>
                  {shown.customerInfo ? (
                    <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>
                      {shown.customerInfo.customerName} · {shown.customerInfo.bookingStatus}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.slotBadge, { backgroundColor: c.bg }]}>
                  <Text style={{ color: c.color, fontSize: 11, fontWeight: "800" }}>
                    {shown.status}
                    {!disabled ? " — tap" : ""}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 6, textAlign: "center" }}>
            Tap an Available slot to block it, or a Blocked slot to unblock. New blocks apply to {date}.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={{ fontSize: 11, color: "#6C757D", fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dateStrip: { gap: 8, paddingHorizontal: 16, paddingBottom: 10, alignItems: "center" },
  dateChip: {
    width: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
    gap: 1,
  },
  legendRow: { flexDirection: "row", gap: 14, marginBottom: 2 },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
  },
  slotBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
});
