/**
 * Home-Expert profile create & edit (Style category).
 * POST /vendor/style-experts | PUT /vendor/style-experts/:id
 * Subcategories (backend enum): FURNITURE | INTERIOR_DESIGNER | RENOVATION.
 * Image routing on backend: first image → profileImage; all → portfolioImages.
 */

import React, { useEffect, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { ImagePickerGrid, type PickedImage } from "../../components/ImagePickerGrid";
import { useTheme } from "../../theme/ThemeProvider";
import { StyleExpertApi } from "../../lib/api";
import { STYLE_SUBCATEGORY_META } from "../../rbac/categories";
import type { StyleExpertCategory } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const SUBCATEGORIES: StyleExpertCategory[] = ["FURNITURE", "INTERIOR_DESIGNER", "RENOVATION"];

export function ExpertFormScreen({ navigation, route }: StackScreenProps<"ExpertForm">) {
  const { colors } = useTheme();
  const editId = route.params?.expertId;

  const [category, setCategory] = useState<StyleExpertCategory>("INTERIOR_DESIGNER");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [shortIntroduction, setShortIntroduction] = useState("");
  const [about, setAbout] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [startingAmount, setStartingAmount] = useState("");
  const [startingLabel, setStartingLabel] = useState("onwards");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const e = await StyleExpertApi.get(editId);
        if (!e) {
          Alert.alert("Not found", "This profile is unavailable.", [{ text: "OK", onPress: () => navigation.goBack() }]);
          return;
        }
        setCategory((e.category as StyleExpertCategory) ?? "FURNITURE");
        setName(e.name ?? "");
        setTitle(e.title ?? "");
        setShortIntroduction(e.shortIntroduction ?? "");
        setAbout(e.about ?? e.description ?? "");
        setExperienceYears(String(e.experienceYears ?? ""));
        setCity(e.city ?? "");
        setLocality(e.locality ?? "");
        setPhone(e.phone ?? "");
        setEmail(e.email ?? "");
        setWhatsapp(e.whatsapp ?? "");
        setStartingAmount(String(e.startingPrice?.amount ?? ""));
        setStartingLabel(e.startingPrice?.label ?? "onwards");
        setSpecializations(e.specializations ?? []);
        setServices(e.servicesOffered ?? e.services ?? []);
        setPortfolio(e.portfolioImages ?? e.portfolio ?? []);
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not load the profile.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, navigation]);

  const submit = async (asDraft: boolean) => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your business / profile name";
    if (!city.trim()) next.city = "City is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (saving) return;

    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        name: name.trim(),
        category,
        title: title.trim(),
        shortIntroduction: shortIntroduction.trim(),
        description: about.trim(),
        experienceYears: Number(experienceYears) || 0,
        city: city.trim(),
        locality: locality.trim(),
        phone: phone.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        startingPrice: String(Number(startingAmount.replace(/[^\d.]/g, "")) || 0),
        startingPriceLabel: startingLabel.trim(),
        specializations: specializations.join(","),
        services: services.join(","),
        serviceAreas: city.trim(),
        isDraft: asDraft ? "true" : "false",
        status: asDraft ? "Draft" : "Published",
      };
      if (editId) {
        await StyleExpertApi.update(editId, fields, []);
        Alert.alert("Saved", "Service profile updated successfully.");
      } else {
        await StyleExpertApi.create(fields, picked);
        Alert.alert("Submitted", asDraft ? "Saved as draft." : "Your service profile was submitted for approval.");
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save the profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <Text style={{ textAlign: "center", color: colors.textMuted }}>Loading profile…</Text>
      </View>
    );
  }

  const servicesForCategory = STYLE_SUBCATEGORY_META[category]?.services ?? [];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader
          title={editId ? "Edit service" : "Add service"}
          subtitle="Interior · Furniture · Renovation"
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onScrollBeginDrag={Keyboard.dismiss}>
        {!editId ? (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Service category</Text>
            <View style={styles.row3}>
              {SUBCATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.catBtn,
                    { borderColor: category === c ? colors.primary : colors.border, backgroundColor: colors.surface },
                    category === c && { borderWidth: 1.5, backgroundColor: `${colors.primary}0D` },
                  ]}
                >
                  <Ionicons name={STYLE_SUBCATEGORY_META[c].icon as never} size={17} color={category === c ? colors.primary : colors.textMuted} />
                  <Text style={{ fontSize: 11.5, fontWeight: "800", color: category === c ? colors.primary : colors.textMuted, textAlign: "center" }}>
                    {STYLE_SUBCATEGORY_META[c].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Input label="Business / profile name" value={name} onChangeText={setName} error={errors.name} placeholder="e.g. Studio Decora" />
        <View style={{ height: 12 }} />
        <Input label="Professional title" value={title} onChangeText={setTitle} placeholder="e.g. Lead Interior Designer" />
        <View style={{ height: 12 }} />
        <Input
          label="Short introduction"
          value={shortIntroduction}
          onChangeText={setShortIntroduction}
          multiline
          placeholder="One-line pitch shown on your card"
        />
        <View style={{ height: 12 }} />
        <Input label="About / detailed description" value={about} onChangeText={setAbout} multiline placeholder="Experience, design philosophy, materials…" />

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Experience (years)" value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" placeholder="8" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Starting price (₹)" value={startingAmount} onChangeText={setStartingAmount} keyboardType="number-pad" placeholder="15000" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="City" value={city} onChangeText={setCity} error={errors.city} placeholder="Jaipur" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Locality" value={locality} onChangeText={setLocality} placeholder="C-Scheme" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98XXXXXXXX" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@studio.com" />
          </View>
        </View>

        <View style={{ height: 16 }} />
        <Text style={[styles.label, { color: colors.text }]}>Specializations</Text>
        <View style={styles.chips}>
          {servicesForCategory.slice(0, 6).map((s) => (
            <Chip
              key={s}
              label={s}
              selected={specializations.includes(s)}
              onPress={() => setSpecializations((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
            />
          ))}
        </View>

        <View style={{ height: 12 }} />
        <Text style={[styles.label, { color: colors.text }]}>Services offered</Text>
        <View style={styles.chips}>
          {servicesForCategory.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={services.includes(s)}
              onPress={() => setServices((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
            />
          ))}
        </View>

        <View style={{ height: 18 }} />
        <ImagePickerGrid
          existing={portfolio}
          onExistingChange={setPortfolio}
          picked={picked}
          onPickedChange={setPicked}
          max={8}
          label="Portfolio & profile photo"
        />
        <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 6 }}>
          The first image becomes your profile photo; the rest appear in your portfolio.
        </Text>

        <Button
          label={editId ? "Save changes" : "Publish service"}
          onPress={() => submit(false)}
          loading={saving}
          style={{ height: 52, borderRadius: 14, marginTop: 22 }}
        />
        <Button
          label="Save as draft"
          variant="ghost"
          onPress={() => submit(true)}
          disabled={saving}
          style={{ height: 46, marginTop: 4 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 40, marginTop: 8 },
  label: { fontSize: 13.5, fontWeight: "700", marginBottom: 8 },
  row2: { flexDirection: "row", gap: 12 },
  row3: { flexDirection: "row", gap: 8, marginBottom: 14 },
  catBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 5,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
