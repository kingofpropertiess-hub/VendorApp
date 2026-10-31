import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "../../components/ui/Button";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import type { AuthScreenProps } from "../../navigation/types";

/** Vendor onboarding welcome — premium intro to the partner portal. */

const FEATURES: { icon: string; title: string; text: string }[] = [
  {
    icon: "bed-outline",
    title: "Hotels & Villas",
    text: "Manage hourly stays, rooms, availability & reservations.",
  },
  {
    icon: "home-outline",
    title: "Homes & Apartments",
    text: "List rentals, track tenant enquiries and follow-ups.",
  },
  {
    icon: "sparkles-outline",
    title: "Home Experts",
    text: "Interior, furniture & renovation services portfolio.",
  },
];

export function WelcomeScreen({ navigation }: AuthScreenProps<"Welcome">) {
  const { colors } = useTheme();
  const { continueAsGuest } = useVendorAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <Image source={require("../../../assets/vendorappicon.png")} style={styles.icon} />
            <View>
              <Text style={[styles.brand, { color: colors.text }]}>KING OF PROPERTIES</Text>
              <Text style={[styles.brandSub, { color: colors.textMuted }]}>Vendor Partner Portal</Text>
            </View>
          </View>

          <Text style={[styles.headline, { color: colors.text }]}>
            Grow your business,{"\n"}right from your phone.
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            The official partner app. List your stays and homes, receive bookings & enquiries, and manage everything on the go.
          </Text>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <View
                key={f.title}
                style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }, i === 1 && { opacity: 0.96 }]}
              >
                <View style={[styles.fIcon, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name={f.icon as never} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.fText, { color: colors.textMuted }]}>{f.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <Button
              label="Create partner account"
              onPress={() => navigation.navigate("Register")}
              style={{ borderRadius: 999, height: 52 }}
            />
            <Button
              label="Vendor sign in"
              variant="outline"
              onPress={() => navigation.navigate("Login")}
              style={{ borderRadius: 999, height: 52, marginTop: 10 }}
            />
            <Pressable onPress={continueAsGuest} hitSlop={8} style={styles.guestLink}>
              <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.guestLinkText, { color: colors.textMuted }]}>
                Continue as guest
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.footnote, { color: colors.textMuted }]}>
            partner · kingofproperties.app
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 34, paddingBottom: 24 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 26,
  },
  icon: { width: 56, height: 56, borderRadius: 16 },
  brand: { fontSize: 16, fontWeight: "900", letterSpacing: 0.4 },
  brandSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  headline: { fontSize: 27, fontWeight: "900", lineHeight: 34 },
  sub: { fontSize: 13.5, lineHeight: 20, marginTop: 10 },
  features: { marginTop: 20, gap: 10 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
  },
  fIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  fTitle: { fontSize: 13.5, fontWeight: "800" },
  fText: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  ctas: { marginTop: 24 },
  guestLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 6,
  },
  guestLinkText: { fontSize: 13, fontWeight: "700" },
  footnote: {
    textAlign: "center",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 22,
    textTransform: "uppercase",
  },
});
