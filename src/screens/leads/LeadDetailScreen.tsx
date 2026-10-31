/**
 * Lead detail — customer enquiry with follow-up status actions and
 * phone/WhatsApp contact via the platform-supported channels.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { LeadApi } from "../../lib/api";
import { leadStatusMeta } from "../../rbac/categories";
import type { Lead, LeadStatus } from "../../lib/types";
import { formatDateTime } from "../../components/Pill";
import { InfoCard } from "../../components/InfoCard";
import { Button } from "../../components/ui/Button";
import type { StackScreenProps } from "../../navigation/types";

const NEXT_ACTIONS: Record<LeadStatus, { label: string; next: LeadStatus }[]> = {
  Pending: [
    { label: "Mark contacted", next: "Contacted" },
    { label: "Accept", next: "Accepted" },
  ],
  Contacted: [
    { label: "Accept", next: "Accepted" },
    { label: "Close", next: "Closed" },
  ],
  Accepted: [{ label: "Close", next: "Closed" }],
  Closed: [],
};

export function LeadDetailScreen({ navigation, route }: StackScreenProps<"LeadDetail">) {
  const { colors } = useTheme();
  const leadId = route.params.leadId;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setFailed(false);
      try {
        const l = await LeadApi.get(leadId);
        if (mounted.current) setLead(l);
      } catch {
        if (mounted.current) setFailed(true);
      } finally {
        if (mounted.current && !silent) setLoading(false);
      }
    },
    [leadId],
  );

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  if (loading && !lead) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <Text style={{ textAlign: "center", marginTop: 80, color: colors.textMuted }}>Loading enquiry…</Text>
      </SafeAreaView>
    );
  }
  if (failed || !lead) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <Text style={{ textAlign: "center", marginTop: 60, fontSize: 15, color: colors.danger }}>Enquiry not found.</Text>
        <Button label="Go back" onPress={() => navigation.goBack()} style={{ marginHorizontal: 40 }} />
      </SafeAreaView>
    );
  }

  const meta = leadStatusMeta(lead.status);
  const phone = lead.buyerPhone ?? lead.phone;
  const email = lead.buyerEmail ?? lead.email;
  const actions = NEXT_ACTIONS[lead.status] ?? [];

  const updateStatus = async (status: LeadStatus) => {
    setBusy(true);
    try {
      await LeadApi.updateStatus(leadId, status);
      await load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update the status.");
    } finally {
      setBusy(false);
    }
  };

  const deleteLead = () => {
    Alert.alert("Delete enquiry", "Remove this enquiry permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await LeadApi.remove(leadId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Could not delete.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Enquiry Details</Text>
          <Pressable onPress={deleteLead} style={styles.back}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>

        <View style={[styles.statusRow, { backgroundColor: meta.bg }]}>
          <Ionicons name="chatbubbles-outline" size={18} color={meta.color as never} />
          <Text style={{ color: meta.color, fontWeight: "900", fontSize: 13.5 }}>{meta.label} enquiry</Text>
        </View>

        <InfoCard
          title="CUSTOMER"
          rows={[
            { key: "Name", value: lead.buyerName ?? lead.name ?? undefined },
            { key: "Phone", value: phone ?? undefined },
            { key: "Email", value: email ?? undefined },
            { key: "Enquired", value: formatDateTime(lead.createdAt) },
          ]}
        />

        <InfoCard
          title="ENQUIRY"
          rows={[
            { key: "Listing", value: lead.propertyTitle ?? undefined },
          ]}
          extras={
            lead.message ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: "700" }}>MESSAGE</Text>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 3 }}>{lead.message}</Text>
              </View>
            ) : null
          }
        />

        {/* Contact actions */}
        <View style={styles.contactRow}>
          {phone ? (
            <Pressable style={[styles.contactBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>Call customer</Text>
            </Pressable>
          ) : null}
          {phone ? (
            <Pressable
              style={[styles.contactBtn, { backgroundColor: "#25D36618", borderColor: "rgba(37,211,102,0.4)" }]}
              onPress={() => Linking.openURL(`https://wa.me/91${String(phone).replace(/\D/g, "")}`)}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={[styles.contactText, { color: "#25D366" }]}>WhatsApp</Text>
            </Pressable>
          ) : null}
          {email ? (
            <Pressable style={[styles.contactBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => Linking.openURL(`mailto:${email}`)}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>Email</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Follow-up actions */}
        {actions.length > 0 ? (
          <View style={{ marginTop: 18, gap: 10 }}>
            {actions.map((a) => (
              <Button key={a.next} label={a.label} onPress={() => updateStatus(a.next)} loading={busy} style={{ height: 50, borderRadius: 14 }} />
            ))}
          </View>
        ) : (
          <View style={[styles.closedNote, { backgroundColor: colors.chipBg }]}>
            <Text style={{ color: colors.textMuted, fontSize: 12.5, textAlign: "center" }}>
              This enquiry is closed. No further follow-ups available.
            </Text>
          </View>
        )}
      </ScrollView>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  contactText: { fontSize: 13, fontWeight: "700" },
  closedNote: { borderRadius: 12, padding: 14, marginTop: 20 },
});
