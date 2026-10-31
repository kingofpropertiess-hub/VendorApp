/**
 * Settings — business categories (RBAC manager) + vendor notification
 * preferences (GET/PUT /vendor/settings) + environment info.
 */

import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { useTheme } from "../../theme/ThemeProvider";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { VendorApi, VendorSettingsApi } from "../../lib/api";
import { CATEGORY_META } from "../../rbac/categories";
import type { VendorCategory, VendorSettings } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const OFFERED: VendorCategory[] = ["HOTEL_VILLA", "TO_LET", "STYLE"];

export function SettingsScreen({ navigation }: StackScreenProps<"Settings">) {
  const { colors } = useTheme();
  const { user, refreshMe } = useVendorAuth();

  const [selected, setSelected] = useState<VendorCategory[]>((user?.categories ?? []) as VendorCategory[]);
  const [savingCats, setSavingCats] = useState(false);
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState<string | null>(null);

  useEffect(() => {
    setSelected((user?.categories ?? []) as VendorCategory[]);
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const s = await VendorSettingsApi.get();
        setSettings(s);
      } catch {
        settingsUnavailable();
      }
    })();
  }, []);

  const settingsUnavailable = () => setSettings(null);

  const toggleCat = (c: VendorCategory) => {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const saveCategories = async () => {
    if (selected.length === 0) {
      Alert.alert("Categories", "Select at least one category (your active category must remain authorized).");
      return;
    }
    setSavingCats(true);
    try {
      await VendorApi.updateCategories(selected);
      await refreshMe();
      Alert.alert("Saved", "Authorized categories updated.");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save categories.");
    } finally {
      setSavingCats(false);
    }
  };

  const toggleSetting = async (key: keyof VendorSettings) => {
    if (!settings) return;
    const nextValue = !settings[key];
    setSavingSettings(key);
    setSettings({ ...settings, [key]: nextValue });
    try {
      await VendorSettingsApi.update({ [key]: nextValue } as any);
    } catch (err: any) {
      setSettings({ ...settings, [key]: !nextValue });
      Alert.alert("Error", err?.message ?? "Could not save the setting.");
    } finally {
      setSavingSettings(null);
    }
  };

  const TOGGLES: { key: keyof VendorSettings; label: string; sub: string }[] = [
    { key: "bookingNotifications", label: "Booking notifications", sub: "New hourly reservations & bookings" },
    { key: "leadNotifications", label: "Enquiry notifications", sub: "New rental & service enquiries" },
    { key: "paymentNotifications", label: "Payment notifications", sub: "Payment & earnings updates" },
    { key: "emailNotifications", label: "Email notifications", sub: "Email alerts to your registered inbox" },
    { key: "marketingNotifications", label: "Marketing updates", sub: "Platform news & promotions" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader title="Settings" subtitle="Categories & notifications" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>AUTHORIZED BUSINESS CATEGORIES</Text>
        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {OFFERED.map((c) => {
            const active = selected.includes(c);
            return (
              <Pressable key={c} onPress={() => toggleCat(c)} style={styles.catRow}>
                <Ionicons name={CATEGORY_META[c].icon as never} size={19} color={active ? colors.primary : colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{CATEGORY_META[c].label}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{CATEGORY_META[c].badge}</Text>
                </View>
                <Ionicons
                  name={active ? "checkbox" : "square-outline"}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
          Removing your currently active category will switch you to another authorized one. Listing permissions are enforced by the backend.
        </Text>
        <Button
          label={savingCats ? "" : "Save categories"}
          onPress={saveCategories}
          loading={savingCats}
          style={{ height: 50, borderRadius: 14, marginTop: 12 }}
        />

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NOTIFICATION PREFERENCES</Text>
        {settings ? (
          <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {TOGGLES.map((t) => (
              <View key={String(t.key)} style={styles.catRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{t.label}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t.sub}</Text>
                </View>
                <Switch
                  value={Boolean(settings[t.key])}
                  onValueChange={() => toggleSetting(t.key)}
                  disabled={savingSettings === t.key}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        ) : null}

        {/* Environment info */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.catRow}>
            <Ionicons name="server-outline" size={18} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>Connected backend</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                {__DEV__ ? "Development environment" : "Production environment"}
              </Text>
            </View>
          </View>
          <View style={styles.catRow}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning as never} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>Password resets</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>Contact the platform team (no self-serve reset exists yet)</Text>
            </View>
          </View>
          <View style={styles.catRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>Push notifications</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>In-app alerts today · push delivery arrives when Firebase is configured server-side</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11.5, fontWeight: "800", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  block: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: 8,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
});
