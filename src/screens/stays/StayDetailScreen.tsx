/**
 * Stay detail — hospitality management hub for one hotel/villa.
 * Includes room types (hourly pricing), physical rooms and the room calendar.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { SmartImage } from "../../components/ui/SmartImage";
import { StatusPill } from "../../components/Pill";
import { InfoCard } from "../../components/InfoCard";
import { ModalSheet } from "../../components/ui/ModalSheet";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { useTheme } from "../../theme/ThemeProvider";
import { RoomApi, StayApi } from "../../lib/api";
import { listingStatusMeta } from "../../rbac/categories";
import { formatMoney } from "../../components/Pill";
import { resolveImageUrl } from "../../lib/config";
import type { RoomType, Stay } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

export function StayDetailScreen({ navigation, route }: StackScreenProps<"StayDetail">) {
  const stayId = route.params.stayId;
  const { colors } = useTheme();

  const [stay, setStay] = useState<Stay | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  /* physical rooms modal state */
  const [inventoryRoomType, setInventoryRoomType] = useState<RoomType | null>(null);
  const [roomNumbers, setRoomNumbers] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [savingRooms, setSavingRooms] = useState(false);

  const load = useCallback(
    async (asRefresh = false) => {
      asRefresh ? setRefreshing(true) : setLoading(true);
      setFailed(false);
      try {
        const [s, rt] = await Promise.all([StayApi.get(stayId), RoomApi.roomTypes(stayId)]);
        if (mounted.current) {
          setStay(s);
          setRoomTypes(rt);
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
    [stayId],
  );

  React.useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const toggleStatus = async () => {
    if (!stay) return;
    const active = ["PUBLISHED", "Published", "Active"].includes(stay.status ?? "");
    const next = active ? "Inactive" : "Active";
    try {
      const res = await StayApi.updateStatus(stayId, next);
      Alert.alert("Listing status", res.stay?.status ? `Status changed to ${res.stay.status}.` : "Status updated.");
      load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not change status.");
    }
  };

  const deleteStay = () => {
    Alert.alert("Delete stay", "This permanently removes the stay. Your rooms and room types remain but become unreachable from listings. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await StayApi.remove(stayId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Could not delete.");
          }
        },
      },
    ]);
  };

  const addPhysicalRooms = async () => {
    if (!inventoryRoomType) return;
    const csv = roomNumbers.trim();
    const hasRange = Number(rangeStart) > 0 && Number(rangeEnd) >= Number(rangeStart);
    if (!csv && !hasRange) {
      Alert.alert("Add rooms", "Enter room numbers (e.g. 101,102,103) or a range.");
      return;
    }
    setSavingRooms(true);
    try {
      await RoomApi.addPhysicalRooms(stayId, String(inventoryRoomType._id ?? inventoryRoomType.id), {
        ...(csv ? { roomNumbers: csv } : {}),
        ...(hasRange ? { startNumber: Number(rangeStart), endNumber: Number(rangeEnd) } : {}),
      });
      Alert.alert("Rooms added", "Physical rooms were added to this room type.");
      setInventoryRoomType(null);
      setRoomNumbers("");
      setRangeStart("");
      setRangeEnd("");
      load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not add rooms.");
    } finally {
      setSavingRooms(false);
    }
  };

  if (loading && !stay) {
    return (
      <View style={styles.loadingWrap}>
        <ScreenHeader title="Loading…" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton height={160} radius={16} />
          <Skeleton height={80} radius={16} />
        </View>
      </View>
    );
  }

  if (!stay) {
    return (
      <View style={styles.loadingWrap}>
        <ScreenHeader title="Stay" onBack={() => navigation.goBack()} />
        <StateCenter onRetry={() => load()} failed={failed} colors={colors as any} />
      </View>
    );
  }

  const meta = listingStatusMeta(stay.status);
  const actionButtons: { label: string; icon: string; onPress: () => void }[] = [
    { label: "Edit", icon: "create-outline", onPress: () => navigation.navigate("StayForm", { stayId }) },
    { label: "Calendar", icon: "calendar-outline", onPress: () => navigation.navigate("RoomCalendar", { stayId }) },
    {
      label: ["PUBLISHED", "Published", "Active"].includes(stay.status ?? "") ? "Unlist" : "Publish",
      icon: "swap-horizontal-outline",
      onPress: toggleStatus,
    },
    { label: "Delete", icon: "trash-outline", onPress: deleteStay },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        {/* Hero */}
        <View>
          <SmartImage uri={resolveImageUrl(stay.images?.[0] ?? stay.image)} style={styles.hero} />
          <View style={{ position: "absolute", top: 46, left: 10 }}>
            <ScreenHeader title="" onBack={() => navigation.goBack()} />
          </View>
        </View>

        <View style={styles.padding}>
          {/* Title */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stayName, { color: colors.text }]}>{stay.name}</Text>
              <Text style={[styles.staySub, { color: colors.textMuted }]}>
                {stay.type === "villa" ? "Villa" : "Hotel"}
                {stay.city ? ` · ${stay.city}` : ""}
              </Text>
            </View>
            <StatusPill meta={meta} />
          </View>

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            {actionButtons.map((a) => (
              <View key={a.label} style={{ flex: 1 }}>
                <Button
                  label={a.label}
                  variant={a.label === "Delete" ? "outline" : "ghost"}
                  onPress={a.onPress}
                  style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
                  labelStyle={{ fontSize: 12.5, color: a.label === "Delete" ? colors.danger : colors.text }}
                  icon={<Text />}
                />
              </View>
            ))}
          </View>

          {/* Overview */}
          <InfoCard
            title="OVERVIEW"
            rows={[
              { key: "Hourly price", value: stay.price ? `${formatMoney(stay.price)} ${stay.priceLabel ?? ""}` : null },
              ...(stay.type === "hotel"
                ? [{ key: "Total rooms", value: stay.totalRooms }]
                : [
                  { key: "Bedrooms", value: stay.bedrooms },
                  { key: "Bathrooms", value: stay.bathrooms },
                  { key: "Max guests", value: stay.maximumGuests },
                  { key: "Area", value: stay.area },
                ]),
              { key: "Open days", value: stay.availableDays?.length ? stay.availableDays.map((d) => d.slice(0, 3)).join(", ") : "—" },
              { key: "Hours", value: stay.openingTime && stay.closingTime ? `${stay.openingTime}–${stay.closingTime}` : "—" },
              { key: "Slot duration", value: stay.slotDuration ? `${stay.slotDuration}m` : "—" },
              ...(stay.rejectionReason ? [{ key: "Rejection note", value: stay.rejectionReason }] : []),
            ]}
          />

          {stay.description ? (
            <Text style={[styles.desc, { color: colors.textMuted }]}>{stay.description}</Text>
          ) : null}

          {/* Room types */}
          <View style={styles.sectionHead}>
            <Text style={[styles.section, { color: colors.text }]}>Room types & hourly pricing</Text>
            <Button
              label="+ Add room type"
              variant="ghost"
              onPress={() => navigation.navigate("RoomTypeForm", { stayId })}
              style={{ height: 34 }}
              labelStyle={{ fontSize: 12.5, color: colors.primary }}
            />
          </View>
          <View style={{ gap: 10 }}>
            {roomTypes.length === 0 ? (
              <Text style={[styles.emptyMini, { color: colors.textMuted }]}>
                No room types yet. Add one with hourly pricing & duration limits.
              </Text>
            ) : (
              roomTypes.map((rt) => (
                <View key={String(rt._id) || rt.roomTypeId} style={[styles.rtCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.rtHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rtName, { color: colors.text }]}>{rt.name}</Text>
                      <Text style={[styles.rtMeta, { color: colors.textMuted }]}>
                        {formatMoney(rt.pricePerHour)}/hr · {rt.minDuration ?? 1}–{rt.maxDuration ?? 24} hrs · {rt.capacity ?? rt.adults ?? "—"} guests
                      </Text>
                    </View>
                    <View style={{ gap: 6, alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 11.5, fontWeight: "700", color: colors.textMuted }}>
                        {rt.activePhysicalRooms ?? rt.totalPhysicalRooms ?? 0} rooms
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rtActions}>
                    <Pressable style={styles.rtLink} onPress={() => setInventoryRoomType(rt)}>
                      <Ionicons name="duplicate-outline" size={15} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 12.5, fontWeight: "700" }}>Inventory</Text>
                    </Pressable>
                    <Pressable
                      style={styles.rtLink}
                      onPress={() =>
                        navigation.navigate("RoomTypeForm", { stayId, roomTypeId: String(rt._id ?? rt.roomTypeId) })
                      }
                    >
                      <Ionicons name="create-outline" size={15} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 12.5, fontWeight: "700" }}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Physical rooms sheet */}
      <ModalSheet visible={!!inventoryRoomType} onClose={() => setInventoryRoomType(null)} title={`Add rooms — ${inventoryRoomType?.name ?? ""}`}>
        <Input label="Room numbers (comma separated)" value={roomNumbers} onChangeText={setRoomNumbers} placeholder="101, 102, 103" />
        <View style={{ height: 12 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Range start" value={rangeStart} onChangeText={setRangeStart} keyboardType="number-pad" placeholder="201" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Range end" value={rangeEnd} onChangeText={setRangeEnd} keyboardType="number-pad" placeholder="205" />
          </View>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10 }}>
          Rooms are auto-assigned to hourly bookings and must not conflict with existing reservations.
        </Text>
        <Button
          label={savingRooms ? "" : "Add rooms"}
          onPress={addPhysicalRooms}
          loading={savingRooms}
          style={{ height: 50, borderRadius: 14, marginTop: 18 }}
        />
      </ModalSheet>
    </View>
  );
}

function StateCenter({ failed, onRetry, colors }: { failed: boolean; onRetry: () => void; colors: any }) {
  if (!failed) return <Text style={{ textAlign: "center", color: colors.textMuted }}>This stay no longer exists.</Text>;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.danger, marginBottom: 12 }}>Couldn't load the stay.</Text>
      <Button label="Retry" variant="outline" onPress={onRetry} style={{ paddingHorizontal: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, backgroundColor: "#F7F8FA" },
  hero: { width: "100%", height: 210, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  padding: { padding: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 12 },
  stayName: { fontSize: 20, fontWeight: "900" },
  staySub: { fontSize: 12.5, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: 16 },
  desc: { fontSize: 13.5, lineHeight: 20, marginTop: 12 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
  },
  section: { fontSize: 15.5, fontWeight: "800" },
  emptyMini: { fontSize: 12.5, textAlign: "center", paddingVertical: 12 },
  rtCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
  },
  rtHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  rtName: { fontSize: 14.5, fontWeight: "800" },
  rtMeta: { fontSize: 12, marginTop: 3 },
  rtActions: { flexDirection: "row", gap: 20, marginTop: 10 },
  rtLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  row2: { flexDirection: "row", gap: 12 },
});
