import React, { useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { isValidEmail, isValidPassword, isValidPhone } from "../../utils/validation";
import type { AuthScreenProps } from "../../navigation/types";

/** Vendor registration — POST /auth/register/vendor (email+password; no OTP exists server-side). */

export function RegisterScreen({ navigation }: AuthScreenProps<"Register">) {
  const { colors } = useTheme();
  const { signUp } = useVendorAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    Keyboard.dismiss();
    const next: Record<string, string> = {};
    if (firstName.trim().length < 2) next.firstName = "Enter your first name";
    if (lastName.trim().length < 1) next.lastName = "Enter your last name";
    if (!isValidEmail(email)) next.email = "Enter a valid email address";
    if (phone.trim() !== "" && !isValidPhone(phone)) next.phone = "Enter a valid 10-digit mobile number";
    if (!isValidPassword(password)) next.password = "Use at least 6 characters";
    if (password !== confirm) next.confirm = "Passwords do not match";
    if (!accepted) next.terms = "Please accept the partner terms to continue";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setErrors({});
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, "") || undefined,
        companyName: companyName.trim() || undefined,
        password,
      });
      // RootNavigator auth gate takes over (→ category onboarding).
    } catch (err: any) {
      setErrors({ form: err?.message ?? "Unable to create the account. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Partner Registration</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>Create your vendor account</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            List stays, rentals and expert services on King of Properties.
          </Text>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="First name" value={firstName} onChangeText={setFirstName} error={errors.firstName} placeholder="Rajesh" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Last name" value={lastName} onChangeText={setLastName} error={errors.lastName} placeholder="Kumar" />
            </View>
          </View>

          <Input
            label="Business name (optional)"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Sunrise Hospitality Pvt Ltd"
            error={errors.companyName}
            autoCapitalize="words"
          />
          <View style={{ height: 14 }} />
          <Input
            label="Mobile number (India)"
            value={phone}
            onChangeText={setPhone}
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <View style={{ height: 14 }} />
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@business.com"
            keyboardType="email-address"
            error={errors.email}
          />
          <View style={{ height: 14 }} />
          <Input label="Password" value={password} onChangeText={setPassword} secure error={errors.password} placeholder="Min. 6 characters" />
          <View style={{ height: 14 }} />
          <Input
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secure
            error={errors.confirm}
            placeholder="Repeat password"
          />

          {/* Terms */}
          <Pressable
            onPress={() => { setAccepted(!accepted); setErrors((e) => ({ ...e, terms: "", form: "" })); }}
            style={styles.termsRow}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: accepted ? colors.primary : colors.border, backgroundColor: accepted ? colors.primary : "transparent" },
              ]}
            >
              {accepted ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
            </View>
            <Text style={[styles.termsText, { color: colors.textMuted }]}>
              I accept the King of Properties partner terms & listing policies.
            </Text>
          </Pressable>
          {errors.terms ? <Text style={[styles.err, { color: colors.danger }]}>{errors.terms}</Text> : null}

          {errors.form ? (
            <View style={[styles.errorBanner, { backgroundColor: "rgba(220,38,38,0.08)" }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.form}</Text>
            </View>
          ) : null}

          <Button
            label={submitting ? "" : "Create partner account"}
            onPress={submit}
            loading={submitting}
            style={{ height: 52, marginTop: 8, borderRadius: 14 }}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Already a partner? </Text>
          <Pressable onPress={() => navigation.replace("Login")}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "800" }}>Sign in</Text>
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
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  scroll: { paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: "900", marginTop: 16 },
  sub: { fontSize: 13.5, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  row2: { flexDirection: "row", gap: 12 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  err: { fontSize: 12.5, marginTop: 6, fontWeight: "500" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  errorText: { fontSize: 12.5, fontWeight: "600", flex: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 18,
    paddingTop: 10,
  },
});
