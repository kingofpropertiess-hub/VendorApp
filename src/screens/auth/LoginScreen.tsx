import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { isValidEmail, isValidPassword } from "../../utils/validation";
import type { AuthScreenProps } from "../../navigation/types";

/** Vendor sign-in — email + password, backend role-checked (`/auth/login/vendor`). */

export function LoginScreen({ navigation }: AuthScreenProps<"Login">) {
  const { colors } = useTheme();
  const { signIn, continueAsGuest } = useVendorAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    Keyboard.dismiss();
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = "Enter a valid email address";
    if (!isValidPassword(password)) next.password = "Password must be at least 6 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setErrors({});
    try {
      await signIn(email, password);
      // Navigation is driven by the auth gate in RootNavigator.
    } catch (err: any) {
      setErrors({ form: err?.message ?? "Unable to sign in. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vendor Sign In</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome back, Partner</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Sign in with your vendor account to manage listings, bookings and enquiries.
          </Text>

          <View style={styles.form}>
            <Input
              label="Email address"
              value={email}
              onChangeText={(t) => setEmail(t)}
              placeholder="you@business.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={errors.email}
            />
            <View style={{ height: 14 }} />
            <Input
              label="Password"
              value={password}
              onChangeText={(t) => setPassword(t)}
              placeholder="Your password"
              secure
              autoCapitalize="none"
              error={errors.password}
            />

            {errors.form ? (
              <View style={[styles.errorBanner, { backgroundColor: "rgba(220,38,38,0.08)" }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.form}</Text>
              </View>
            ) : null}

            <Button
              label={submitting ? "" : "Sign in"}
              onPress={submit}
              loading={submitting}
              style={{ height: 52, marginTop: 6, borderRadius: 14 }}
              icon={submitting ? <ActivityIndicator color={colors.onPrimary} /> : undefined}
            />
          </View>

          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Forgot your password? Contact the King of Properties team to reset your vendor password.
          </Text>

          <Pressable onPress={continueAsGuest} hitSlop={8} style={styles.guestRow}>
            <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.guestText, { color: colors.textMuted }]}>
              Just exploring? Continue as guest
            </Text>
          </Pressable>
        </View>

        {/* Footer switch */}
        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>New to the platform? </Text>
          <Pressable onPress={() => navigation.replace("Register")}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "800" }}>Create partner account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    minHeight: 52,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  body: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "900" },
  sub: { fontSize: 13.5, lineHeight: 20, marginTop: 8 },
  form: { marginTop: 26 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: { fontSize: 12.5, fontWeight: "600", flex: 1 },
  muted: { fontSize: 12, lineHeight: 17, marginTop: 18 },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },
  guestText: { fontSize: 12.5, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 22,
  },
});
