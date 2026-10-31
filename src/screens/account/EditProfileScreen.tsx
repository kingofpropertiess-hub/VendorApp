/** Edit vendor profile — name, business name, phone, email display + avatar. */

import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useTheme } from "../../theme/ThemeProvider";
import { useVendorAuth } from "../../auth/VendorAuthProvider";
import { VendorApi } from "../../lib/api";
import { isValidPhone } from "../../utils/validation";
import type { StackScreenProps } from "../../navigation/types";

export function EditProfileScreen({ navigation }: StackScreenProps<"EditProfile">) {
  const { colors } = useTheme();
  const { user, refreshMe } = useVendorAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    if (firstName.trim().length < 2) next.firstName = "Enter your first name";
    if (phone.trim() !== "" && !isValidPhone(phone)) next.phone = "Enter a valid 10-digit number";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await VendorApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: [firstName.trim(), lastName.trim()].filter(Boolean).join(" "),
        companyName: companyName.trim(),
        phone: phone.replace(/\D/g, ""),
      });
      await refreshMe();
      Alert.alert("Saved", "Profile updated successfully.");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update the profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader title="Edit profile" subtitle="Your vendor identity" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input label="First name" value={firstName} onChangeText={setFirstName} error={errors.firstName} />
        <View style={{ height: 12 }} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} />
        <View style={{ height: 12 }} />
        <Input label="Business name" value={companyName} onChangeText={setCompanyName} placeholder="Your company / firm" />
        <View style={{ height: 12 }} />
        <Input label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} placeholder="98XXXXXXXX" />
        <View style={{ height: 12 }} />
        <Input label="Email address" value={user?.email ?? ""} editable={false} />

        <Button label={saving ? "" : "Save changes"} onPress={save} loading={saving} style={{ height: 52, borderRadius: 14, marginTop: 22 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 40, marginTop: 8 },
});
