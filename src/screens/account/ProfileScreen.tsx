/**
 * Vendor profile tab — avatar upload (multipart PUT /vendor/profile),
 * category summary, appearance toggle, sign out.
 */

import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { useActiveCategory } from "../../rbac/ActiveCategory";
import { authorizedCategories, statusOf, vendorName, CATEGORY_META } from "../../rbac/categories";
import { VendorApi } from "../../lib/api";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { SmartImage } from "../../components/ui/SmartImage";
import { Button } from "../../components/ui/Button";
import { resolveImageUrl } from "../../lib/config";
import { initialsOf, StatusPill } from "../../components/Pill";
import type { VendorCategory } from "../../lib/types";

export function ProfileScreen({ navigation }: { navigation: any }) {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshMe } = useVendorAuth();
  const { category, setCategory } = useActiveCategory();
  const [uploading, setUploading] = useState(false);

  const accounts = authorizedCategories(user);
  const state = statusOf(user?.status);

  const changeAvatar = () => {
    Alert.alert("Profile photo", "Choose an image source", [
      {
        text: "Photo Library",
        onPress: () =>
          launchImageLibrary(
            { mediaType: "photo", quality: 0.7, maxWidth: 900, maxHeight: 900 },
            (r) => pickDone(r.assets?.[0]?.uri),
          ),
      },
      {
        text: "Take Photo",
        onPress: () =>
          launchCamera(
            { mediaType: "photo", quality: 0.7, maxWidth: 900, maxHeight: 900, saveToPhotos: false },
            (r) => pickDone(r.assets?.[0]?.uri),
          ),
      },
      { text: "Remove photo", style: "destructive", onPress: removeAvatar },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickDone = async (uri?: string) => {
    if (!uri) return;
    setUploading(true);
    try {
      await VendorApi.updateProfile({}, { uri });
      await refreshMe();
      Alert.alert("Updated", "Profile photo updated.");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      await VendorApi.updateProfile({ profileImage: "" } as any, null);
      await refreshMe();
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: "Approved", color: "#0E9F6E", bg: "rgba(14,159,110,0.12)" },
    pending: { label: "Pending review", color: "#D97706", bg: "rgba(217,119,6,0.12)" },
    suspended: { label: "Suspended", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    rejected: { label: "Rejected", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    unknown: { label: String(user?.status ?? ""), color: "#6C757D", bg: "rgba(108,117,125,0.12)" },
  };

  const Row = ({ icon, label, sub, onPress, danger }: { icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean }) => (
    <Pressable style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <Ionicons name={icon as never} size={19} color={danger ? colors.danger : colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? colors.danger : colors.text, fontSize: 13.5, fontWeight: "700" }}>{label}</Text>
        {sub ? <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable onPress={changeAvatar} style={styles.avatarWrap}>
          {user?.profileImage ? (
            <SmartImage uri={resolveImageUrl(user.profileImage)} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: `${colors.primary}14` }]}>
              <Text style={{ color: colors.primary, fontSize: 26, fontWeight: "900" }}>{initialsOf(vendorName(user))}</Text>
            </View>
          )}          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={13} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 10 }}>{vendorName(user)}</Text>
        {user?.companyName ? (
          <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 2 }}>{user.companyName}</Text>
        ) : null}
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>{user?.email}</Text>
        <View style={{ marginTop: 8 }}>
          <StatusPill meta={STATUS_META[state] ?? STATUS_META.unknown} />
        </View>
        {uploading ? <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 6 }}>Uploading…</Text> : null}
      </View>

      {/* Business categories */}
      <Text style={[styles.section, { color: colors.textMuted }]}>BUSINESS CATEGORIES</Text>
      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {(["HOTEL_VILLA", "TO_LET", "STYLE"] as VendorCategory[]).map((cat) => {
          const active = accounts.includes(cat);
          const meta = CATEGORY_META[cat];
          return (
            <Pressable
              key={cat}
              disabled={!active}
              onPress={() => setCategory(cat)}
              style={[styles.catRow, !active && { opacity: 0.45 }]}
            >
              <Ionicons name={meta.icon as never} size={19} color={active && category === cat ? colors.primary : colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: active && category === cat ? colors.primary : colors.text, fontSize: 13, fontWeight: "700" }}>
                  {meta.label}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{active ? "Authorized" : "Not authorized"}</Text>
              </View>
              {active && category === cat ? (
                <View style={{ backgroundColor: `${colors.primary}16`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                  <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: "800" }}>Active</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Categories link */}
      <Text style={[styles.section, { color: colors.textMuted }]}>MANAGE</Text>
      <View style={{ gap: 8 }}>
        <Row icon="create-outline" label="Edit profile" onPress={() => navigation.navigate("EditProfile")} />
        <Row icon="ribbon-outline" label="Business categories" sub="Add or update what you offer" onPress={() => navigation.navigate("Settings")} />
        <Row icon="stats-chart-outline" label="Performance & earnings" sub="Leads, bookings, revenue" onPress={() => navigation.navigate("Analytics")} />
        <Row icon="notifications-outline" label="Notification preferences" onPress={() => navigation.navigate("Settings")} />
      </View>

      {/* Appearance */}
      <Text style={[styles.section, { color: colors.textMuted }]}>APPEARANCE</Text>
      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {(["light", "dark", "system"] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={styles.catRow}>
            <Ionicons
              name={(m === "light" ? "sunny-outline" : m === "dark" ? "moon-outline" : "phone-portrait-outline") as never}
              size={18}
              color={mode === m ? colors.primary : colors.textMuted}
            />
            <Text style={{ color: mode === m ? colors.primary : colors.text, fontSize: 13, fontWeight: "700", flex: 1, textTransform: "capitalize" }}>
              {m} mode
            </Text>
            {mode === m ? <Ionicons name="checkmark" size={17} color={colors.primary} /> : null}
          </Pressable>
        ))}
      </View>

      <Button
        label="Sign out"
        variant="danger"
        onPress={signOut}
        style={{ height: 50, borderRadius: 14, marginTop: 22 }}
        icon={<Ionicons name="log-out-outline" size={19} color={colors.onPrimary} />}
      />

      <Text style={[styles.footnote, { color: colors.textMuted }]}>
        King of Properties · Vendor App v1.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    padding: 24,
    paddingBottom: 18,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  section: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 8,
  },
  block: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  footnote: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 18,
    textTransform: "uppercase",
  },
});

