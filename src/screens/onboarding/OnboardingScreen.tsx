/**
 * Business-category onboarding — the RBAC entry point.
 *
 * New vendors start with `categories: []` on the backend, which blocks all
 * listing creation ("not authorized for the <cat> category"). Until a
 * category is chosen, every other screen is gated behind this one.
 * Selection is persisted with POST /vendor/categories — the server-side
 * enum is PROPERTY | TO_LET | HOTEL_VILLA | STYLE; sale listings
 * (PROPERTY) are intentionally NOT offered in the app (out of scope).
 */

import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "../../components/ui/Button";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { VendorApi } from "../../lib/api";
import type { VendorCategory } from "../../lib/types";

const OPTIONS: Array<{ id: VendorCategory; title: string; icon: string; badge: string; text: string }> = [
  {
    id: "HOTEL_VILLA",
    title: "Hotels & Villas",
    icon: "bed-outline",
    badge: "Stays & Hospitality",
    text: "Hourly bookings with rooms, slot pricing & availability.",
  },
  {
    id: "TO_LET",
    title: "Homes & Apartments",
    icon: "home-outline",
    badge: "Rental / To-Let",
    text: "List residential rentals and receive tenant enquiries.",
  },
  {
    id: "STYLE",
    title: "Home Experts",
    icon: "sparkles-outline",
    badge: "Services",
    text: "Interior design, furniture & renovation services.",
  },
];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { user, setUser } = useVendorAuth();
  const [selected, setSelected] = useState<VendorCategory[]>(
    (user?.categories ?? []) as VendorCategory[],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const multi = useMemo(
    () => (user?.categories ?? []).length > 0, // already set up (re-visit path)
    [user],
  );

  const toggle = (id: VendorCategory) => {
    setError("");
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const save = async () => {
    if (selected.length === 0) {
      setError("Select at least one business category.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await VendorApi.updateCategories(selected);
      setUser({
        ...(user as any),
        ...(res?.user ?? {}),
        categories: selected,
      });
    } catch (err: any) {
      setError(err?.message ?? "Could not save your categories. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={[styles.brand, { color: colors.textMuted }]}>PARTNER ONBOARDING</Text>
        <Text style={[styles.title, { color: colors.text }]}>What do you offer?</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Choose one or more business categories. Your dashboard, tabs and forms adapt to each category.
        </Text>

        <ScrollView style={{ marginTop: 20 }} contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>
          {OPTIONS.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                onPress={() => toggle(opt.id)}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border },
                  active && { borderWidth: 1.5, shadowColor: colors.primary, shadowOpacity: 0.14, shadowRadius: 12, elevation: 4 },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: active ? `${colors.primary}18` : colors.chipBg }]}>
                  <Ionicons name={opt.icon as never} size={22} color={active ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{opt.title}</Text>
                    <View style={[styles.badge, { backgroundColor: `${colors.primary}14` }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>{opt.badge}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardText, { color: colors.textMuted }]}>{opt.text}</Text>
                </View>
                <View
                  style={[
                    styles.check,
                    { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : "transparent" },
                  ]}
                >
                  {active ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <Button
          label={multi ? "Save categories" : "Continue"}
          onPress={save}
          loading={saving}
          style={{ height: 52, borderRadius: 14, marginBottom: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 24 },
  brand: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 26, fontWeight: "900", marginTop: 6 },
  sub: { fontSize: 13.5, lineHeight: 20, marginTop: 8 },
  cards: { gap: 10, paddingBottom: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 14.5, fontWeight: "800" },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  cardText: { fontSize: 12, lineHeight: 17 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { fontSize: 12.5, fontWeight: "500", marginBottom: 4 },
});
