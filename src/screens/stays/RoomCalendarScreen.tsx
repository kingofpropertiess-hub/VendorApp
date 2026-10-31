/**
 * Room calendar — physical-room schedule with current bookings.
 * GET /bookings/vendor/stays/:stayId/room-calendar
 */

import React, { useCallback, useRef, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { StatusPill } from "../../components/Pill";
import { bookingStatusMeta } from "../../rbac/categories";
import { Skeleton } from "../../components/ui/Skeleton";
import { StateView } from "../../components/ui/StateView";
import { useTheme } from "../../theme/ThemeProvider";
import { RoomApi } from "../../lib/api";
import type { Room } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const ROOM_STATUSES = ["Active", "Maintenance", "Inactive"] as const;

export function RoomCalendarScreen({ navigation, route }: StackScreenProps<"RoomCalendar">) {
  const stayId = route.params.stayId;
  const { colors } = useTheme();

  const [schedule, setSchedule] = useState<Room[] | null>(null);
  const [stayName, setStayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const [busyRoom, setBusyRoom] = useState<string | null>(null);

  const load = useCallback(
    async (asRefresh = false) => {
      asRefresh ? setRefreshing(true) : setLoading(true);
      setFailed(false);
      try {
        const res = await RoomApi.roomCalendar(stayId);
        if (mounted.current) {
          setSchedule(res?.schedule ?? []);
          setStayName(res?.stayName ?? "");
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

  const changeRoomStatus = async (roomId: string, status: string) => {
    setBusyRoom(roomId);
    try {
      await RoomApi.updateRoomStatus(stayId, roomId, status);
      load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update the room status.");
    } finally {
      setBusyRoom(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader
          title="Room calendar"
          subtitle={stayName ? `${stayName} · ${schedule?.length ?? 0} rooms` : "Physical rooms & reservations"}
          onBack={() => navigation.goBack()}
        />
      </View>

      {loading && !schedule ? (
        <View style={{ padding: 16, gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} radius={14} />
          ))}
        </View>
      ) : !schedule?.length ? (
        <StateView
          visible
          full={false}
          kind={failed ? "error" : "empty"}
          title={failed ? "Couldn't load the calendar" : "No rooms yet"}
          message={failed ? "Check your connection and retry." : "Add room types and rooms in the stay to see reservations here."}
          onRetry={failed ? () => load() : undefined}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {schedule.map((room) => {
            const bookings = (room.bookings ?? []).filter(
              (b) => (b.bookingStatus ?? "Confirmed") !== "Cancelled",
            );
            return (
              <View key={String(room._id ?? room.roomNumber)} style={[styles.roomCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.roomHead}>
                  <View style={[styles.roomNum, { backgroundColor: `${colors.primary}14` }]}>
                    <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 13 }}>{room.roomNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roomType, { color: colors.text }]} numberOfLines={1}>
                      {room.roomType || "Room"}
                    </Text>
                    <Text style={[styles.bookingsCount, { color: colors.textMuted }]}>
                      {bookings.length} {bookings.length === 1 ? "reservation" : "reservations"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          room.status === "Active" ? "#0E9F6E" : room.status === "Maintenance" ? "#D97706" : "#6C757D",
                      },
                    ]}
                  />
                </View>

                {/* status switch */}
                <View style={styles.statusRow}>
                  {ROOM_STATUSES.map((s) => (
                    <Pressable
                      key={s}
                      disabled={busyRoom === room._id}
                      onPress={() => changeRoomStatus(String(room._id), s)}
                      style={[
                        styles.statusChip,
                        {
                          borderColor: room.status === s ? colors.primary : colors.border,
                          backgroundColor: room.status === s ? `${colors.primary}12` : "transparent",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: "700", color: room.status === s ? colors.primary : colors.textMuted }}>
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* bookings for this room */}
                {bookings.length === 0 ? (
                  <Text style={[styles.noBooking, { color: colors.textMuted }]}>No upcoming reservations.</Text>
                ) : (
                  <View style={{ gap: 6, marginTop: 8 }}>
                    {bookings.slice(0, 4).map((b, i) => (
                      <Pressable
                        key={String(b._id ?? i)}
                        style={[styles.bookingRow, { backgroundColor: colors.chipBg }]}
                        onPress={() => navigation.navigate("BookingDetail", { bookingId: String(b._id ?? b.id) })}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: "700" }} numberOfLines={1}>
                            {b.customerName || b.name || "Guest"}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 1 }}>
                            {b.checkIn ?? b.bookingDate ?? "—"}
                            {(b as any).slotLabel ? ` · ${(b as any).slotLabel}` : ""}
                          </Text>
                        </View>
                        <StatusPill meta={bookingStatusMeta(b.bookingStatus)} small />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  roomCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
  },
  roomHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  roomNum: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roomType: { fontSize: 14, fontWeight: "800" },
  bookingsCount: { fontSize: 11.5, marginTop: 1 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
  },
  noBooking: { fontSize: 12.5, marginTop: 8 },
});
