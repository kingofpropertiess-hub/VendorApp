/**
 * Guest browse home — shown when a vendor skips sign-in.
 *
 * Guest mode is a preview only: no bearer token exists, so every vendor
 * endpoint stays out of reach. This screen sells the portal's value and
 * funnels the guest into sign-in / registration. No fake or mock data is
 * ever rendered here.
 */

import React from "react";
import {
  Image,
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
import type { AuthScreenProps } from "../../navigation/types";

const EXPLORE: { icon: string; title: string; text: string }[] = [
  {
    icon: "bed-outline",
    title: "Hotels & Villas",
    text: "Hourly stays with rooms, slot pricing and live reservations.",
  },
  {
    icon: "home-outline",
    title: "Homes & Apartments",
    text: "Rental / to-let listings with tenant enquiry management.",
  },
  {
    icon: "sparkles-outline",
    title: "Home Experts",
    text: "Interior, furniture & renovation service portfolios.",
  },
  {
    icon: "stats-chart-outline",
    title: "Insights & Earnings",
    text: "Bookings, leads and revenue analytics in one place.",
  },
];

export function GuestHomeScreen({ navigation }: AuthScreenProps<"GuestHome">) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <Image source={require("../../../assets/appicon.png")} style={styles.icon} />
          <View>
            <Text style={[styles.brand, { color: colors.text }]}>KING OF PROPERTIES</Text>
            <Text style={[styles.brandSub, { color: colors.textMuted }]}>Vendor Partner Portal</Text>
          </View>
        </View>

        {/* Guest badge */}
        <View style={[styles.guestPill, { backgroundColor: `${colors.primary}14` }]}>
          <Ionicons name="eye-outline" size={14} color={colors.primary} />
          <Text style={[styles.guestPillText, { color: colors.primary }]}>
            Exploring as guest
          </Text>
        </View>

        <Text style={[styles.headline, { color: colors.text }]}>
          Take a look around.{"\n"}Sign in when you're ready.
        </Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Guest mode is a preview — once you sign in, you'll get your vendor dashboard, listings, bookings, enquiries and alerts.
        </Text>

        {/* What's inside */}
        <View style={styles.features}>
          {EXPLORE.map((f) => (
            <View
              key={f.title}
              style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
            label="Vendor sign in"
            onPress={() => navigation.navigate("Login")}
            style={{ borderRadius: 999, height: 52 }}
          />
          <Button
            label="Create partner account"
            variant="outline"
            onPress={() => navigation.navigate("Register")}
            style={{ borderRadius: 999, height: 52, marginTop: 10 }}
          />
          <Pressable
            onPress={() => navigation.navigate("Welcome")}
            hitSlop={10}
            style={styles.backLink}
          >
            <Text style={[styles.backLinkText, { color: colors.textMuted }]}>
              Back to start
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.footnote, { color: colors.textMuted }]}>
          partner · kingofproperties.app
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 30, paddingBottom: 24 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  icon: { width: 56, height: 56, borderRadius: 16 },
  brand: { fontSize: 16, fontWeight: "900", letterSpacing: 0.4 },
  brandSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  guestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 12,
  },
  guestPillText: { fontSize: 11.5, fontWeight: "800", letterSpacing: 0.3 },
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
  backLink: { alignSelf: "center", marginTop: 16, paddingVertical: 6 },
  backLinkText: { fontSize: 13, fontWeight: "700" },
  footnote: {
    textAlign: "center",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 14,
    textTransform: "uppercase",
  },
});
