/**
 * Account-status gate — suspended / rejected vendor accounts are hard-blocked
 * by the backend (`requireVendor` middleware). This screen explains the state
 * and offers sign-out; it is never used to fake a verification state.
 */

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "../../components/ui/Button";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { vendorName } from "../../rbac/categories";

const COPY: Record<string, { icon: string; color: string; title: string; text: string }> = {
  suspended: {
    icon: "lock-closed-outline",
    color: "#D97706",
    title: "Account suspended",
    text: "Your vendor account has been suspended by the administrator. Your listings are not visible to customers and management features are locked. Please contact the King of Properties team to resolve this.",
  },
  rejected: {
    icon: "close-circle-outline",
    color: "#DC2626",
    title: "Account rejected",
    text: "Your vendor account application was not approved. Please contact the King of Properties team for more information or sign up again with corrected business details.",
  },
};

export function AccountStatusScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useVendorAuth();
  const [signingOut, setSigningOut] = useState(false);

  const meta = COPY[(user?.status as string) === "Suspended" ? "suspended" : "rejected"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={[styles.brand, { color: colors.textMuted }]}>KING OF PROPERTIES</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
            <Ionicons name={meta.icon as never} size={30} color={meta.color} />
          </View>
          <Text style={[styles.title, { color: meta.color }]}>{meta.title}</Text>
          <Text style={[styles.name, { color: colors.textMuted }]}>
            {vendorName(user)} · {user?.email}
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>{meta.text}</Text>
        </View>

        <Button
          label={signingOut ? "" : "Sign out"}
          onPress={async () => {
            setSigningOut(true);
            await signOut();
            setSigningOut(false);
          }}
          variant="outline"
          style={{ height: 50, borderRadius: 14 }}
          loading={signingOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },
  brand: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  card: {
    marginTop: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", marginTop: 14 },
  name: { fontSize: 12.5, marginTop: 4 },
  body: { fontSize: 13.5, lineHeight: 21, textAlign: "center", marginTop: 14 },
});
