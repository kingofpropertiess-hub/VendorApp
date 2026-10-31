/**
 * Booking detail + vendor actions (confirm / reject / complete / cancel,
 * payment-status update, vendor notes). Backend-authoritative ownership.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { BookingApi } from "../../lib/api";
import { bookingStatusMeta } from "../../rbac/categories";
import { formatMoney, formatDateTime } from "../../components/Pill";
import { InfoCard } from "../../components/InfoCard";
import { Button } from "../../components/ui/Button";
import { SmartImage } from "../../components/ui/SmartImage";
import { resolveImageUrl } from "../../lib/config";
import type { VendorBooking } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

export function BookingDetailScreen({ navigation, route }: StackScreenProps<"BookingDetail">) {
  const { colors } = useTheme();
  const bookingId = route.params.bookingId;

  const [booking, setBooking] = useState<VendorBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const mounted = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setFailed(false);
      try {
        const b = await BookingApi.get(bookingId);
        if (mounted.current) {
          setBooking(b);
          setNotes(b.vendorNotes ?? "");
        }
      } catch {
        if (mounted.current) setFailed(true);
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  if (loading && !booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <Text style={{ textAlign: "center", marginTop: 80, color: colors.textMuted }}>Loading booking…</Text>
      </SafeAreaView>
    );
  }
  if (failed || !booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <Text style={styles.loadFail}>Booking not found.</Text>
        <Button label="Go back" onPress={() => navigation.goBack()} style={{ marginHorizontal: 40 }} />
      </SafeAreaView>
    );
  }

  const meta = bookingStatusMeta(booking.bookingStatus);
  const status = booking.bookingStatus ?? "Confirmed";
  const isHotel = !!(booking.stayId || booking.roomNumber || booking.duration);
  const slots = booking.selectedSlots ?? (booking.slotLabel ? [{ startTime: booking.startTime ?? "", endTime: booking.endTime ?? "", slotLabel: booking.slotLabel }] : []);

  const setStatus = async (bookingStatus?: string, paymentStatus?: string) => {
    setBusy(true);
    try {
      await BookingApi.updateStatus(bookingId, {
        ...(bookingStatus ? { bookingStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      });
      await load(true);
      Alert.alert("Updated", "Booking status changed.");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update the status.");
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      await BookingApi.update(bookingId, { vendorNotes: notes });
      setNotesOpen(false);
      load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save notes.");
    } finally {
      setBusy(false);
    }
  };

  const stayImages = (booking.stay as any)?.images;
  const propertyImages = (booking.property as any)?.images;
  const cover = resolveImageUrl(stayImages?.[0] ?? propertyImages?.[0] ?? (booking as any).image);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {cover ? <SmartImage uri={cover} style={styles.cover} /> : null}

        {/* Status */}
        <View style={[styles.statusRow, { backgroundColor: meta.bg }]}>
          <Ionicons name={isHotel ? "bed-outline" : "time-outline"} size={18} color={meta.color as never} />
          <Text style={{ color: meta.color, fontWeight: "900", fontSize: 13.5 }}>
            {meta.label} · {isHotel ? "Hotel hourly booking" : booking.slotLabel || booking.bookingDate ? "Property time-slot booking" : "Booking"}
          </Text>
        </View>

        {/* Property */}
        <InfoCard
          title="BOOKING"
          rows={[
            { key: "Listing", value: booking.propertyTitle ?? booking.stay?.name ?? booking.property?.title ?? "—" },
            { key: "Service", value: booking.service ?? undefined },
            { key: "Date", value: booking.checkIn ?? booking.bookingDate ?? undefined },
            ...(isHotel
              ? [
                { key: "Room", value: booking.roomNumber ? `Room ${booking.roomNumber}` : undefined },
                { key: "Room type", value: booking.roomType ?? undefined },
            { key: "Duration", value: booking.duration ? `${booking.duration} hr${Number(booking.duration) > 1 ? "s" : ""}` : undefined },
              ]
              : slots.length
                ? [{ key: "Slots", value: slots.map((s) => s.slotLabel).join(", ") }]
                : []),
            ...(booking.checkOut ? [{ key: "Check-out", value: booking.checkOut }] : []),
            { key: "Booked on", value: formatDateTime(booking.createdAt) },
          ]}
        />

        {/* Guest */}
        <InfoCard
          title="GUEST"
          rows={[
            { key: "Name", value: booking.customerName ?? booking.name ?? undefined },
            { key: "Email", value: booking.customerEmail ?? booking.email ?? undefined },
            { key: "Phone", value: booking.customerPhone ?? booking.phone ?? undefined },
            {
              key: "Guests",
              value:
                booking.guests ?? booking.adults ?? booking.children
                  ? `${booking.guests ?? ((Number(booking.adults ?? 0) + Number(booking.children ?? 0)) || "—")}`
                  : undefined,
            },
            { key: "Special requests", value: booking.specialRequests ?? undefined },
          ]}
        />

        {/* Payment */}
        <InfoCard
          title="PAYMENT"
          rows={[
            { key: "Amount", value: booking.amount !== undefined ? formatMoney(booking.amount) : undefined },
            ...(booking.basePrice ? [{ key: "Base price", value: formatMoney(booking.basePrice) }] : []),
            ...(booking.taxes ? [{ key: "Taxes", value: formatMoney(booking.taxes) }] : []),
            ...(booking.serviceFee ? [{ key: "Service fee", value: formatMoney(booking.serviceFee) }] : []),
            ...(booking.discount ? [{ key: "Discount", value: `- ${formatMoney(booking.discount)}` }] : []),
            { key: "Payment status", value: booking.paymentStatus ?? undefined },
            { key: "Txn", value: (booking.payment as any)?.transactionId ?? (booking as any).transactionId ?? undefined },
          ]}
          extras={
            booking.vendorNotes ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: "700" }}>VENDOR NOTES</Text>
                <Text style={{ color: colors.text, fontSize: 13, marginTop: 3 }}>{booking.vendorNotes}</Text>
              </View>
            ) : null
          }
        />

        {/* Actions */}
        <Text style={[styles.section, { color: colors.text }]}>Manage booking</Text>
        <View style={styles.actions}>
          {status === "Pending" ? (
            <Button label="Confirm booking" onPress={() => setStatus("Confirmed")} loading={busy} style={{ flex: 1, height: 48, borderRadius: 13 }} />
          ) : null}
          {status === "Confirmed" ? (
            <Button label="Mark completed" onPress={() => setStatus("Completed")} loading={busy} style={{ flex: 1, height: 48, borderRadius: 13 }} />
          ) : null}
          {["Pending", "Confirmed"].includes(status) ? (
            <>
              <Button label="Reject" variant="outline" onPress={() => setStatus("Rejected")} loading={busy} style={{ flex: 1, height: 48, borderRadius: 13 }} labelStyle={{ color: colors.danger }} />
              <Button label="Cancel" variant="outline" onPress={() => setStatus("Cancelled")} loading={busy} style={{ flex: 1, height: 48, borderRadius: 13 }} labelStyle={{ color: colors.danger }} />
            </>
          ) : null}
        </View>

        {booking.paymentStatus !== "Paid" ? (
          <View style={styles.actions}>
            <Button label="Mark payment received" onPress={() => setStatus(undefined, "Paid")} loading={busy} style={{ flex: 1, height: 48, borderRadius: 13 }} />
          </View>
        ) : null}

        <Button
          label={booking.vendorNotes ? "Edit vendor notes" : "Add vendor notes"}
          variant="ghost"
          onPress={() => setNotesOpen(true)}
          style={{ height: 46 }}
          labelStyle={{ color: colors.primary }}
        />
      </ScrollView>

      {/* Notes modal */}
      <Modal visible={notesOpen} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.backdrop }]} onPress={() => setNotesOpen(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={() => undefined} onPressIn={() => undefined} onPressOut={() => undefined}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Vendor notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Internal notes about this booking…"
              placeholderTextColor={colors.textMuted}
              style={[styles.notesInput, { borderColor: colors.border, color: colors.text }]}
            />
            <Button label={busy ? "" : "Save notes"} onPress={saveNotes} loading={busy} style={{ height: 50, borderRadius: 14 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  cover: { width: "100%", height: 150, borderRadius: 16, marginTop: 14 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  section: { fontSize: 15.5, fontWeight: "800", marginTop: 20, marginBottom: 10 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 30,
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    textAlignVertical: "top",
    marginBottom: 16,
    fontSize: 15,
  },
  loadFail: { textAlign: "center", marginTop: 60, marginBottom: 20, fontSize: 15 },
});

