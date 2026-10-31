/**
 * Hotel / Villa create & edit — POST /stays | PUT /stays/:id.
 *
 * Supports both hospitality kinds:
 *  - hotel: totalRooms (+ rooms/room-types managed from StayDetail)
 *  - villa: bedrooms, bathrooms, maximumGuests, area
 * Shared: description, location, price + label, amenities, hourly slot
 * configuration (availableDays, opening/closing time, slot duration).
 * New picks upload with the same multipart request (backend Cloudinary).
 *
 * UI: premium sectioned-card layout with progress indicator.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { ImagePickerGrid, type PickedImage } from "../../components/ImagePickerGrid";
import { useTheme } from "../../theme/ThemeProvider";
import { StayApi } from "../../lib/api";
import type { Stay } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const AMENITIES = [
  "Free Wi-Fi", "Air Conditioning", "Swimming Pool", "Free Parking", "Gym", "Spa",
  "Room Service", "Breakfast Included", "Power Backup", "Elevator", "Security",
  "Garden", "Terrace", "BBQ Area", "Housekeeping", "Beach Access",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATIONS = [30, 60, 90, 120];

const TIMES = ["00:00", "06:00", "08:00", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "21:00", "24:00"];

/* ---------------------------------- card ---------------------------------- */

function SectionCard({
  icon,
  title,
  hint,
  badge,
  children,
  colors,
  isLast,
}: {
  icon: string;
  title: string;
  hint?: string;
  badge?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          marginBottom: isLast ? 0 : 14,
          shadowColor: colors.mode === "dark" ? "#000" : "#0F172A",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}14` }]}>
          <Ionicons name={icon as never} size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          {hint ? (
            <Text style={[styles.cardHint, { color: colors.textMuted }]} numberOfLines={1}>
              {hint}
            </Text>
          ) : null}
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* --------------------------------- screen --------------------------------- */

export function StayFormScreen({ navigation, route }: StackScreenProps<"StayForm">) {
  const { colors } = useTheme();
  const editId = route.params?.stayId;

  const [type, setType] = useState<"hotel" | "villa">("hotel");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [priceLabel, setPriceLabel] = useState("per hour");
  const [totalRooms, setTotalRooms] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [maximumGuests, setMaximumGuests] = useState("");
  const [area, setArea] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([...DAYS]);
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("24:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const [existing, setExisting] = useState<string[]>([]);
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const stay: Stay = await StayApi.get(editId);
        if (!stay) {
          Alert.alert("Not found", "This stay is no longer available.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setType((stay.type as "hotel" | "villa") ?? "hotel");
        setName(stay.name ?? "");
        setDescription(stay.description ?? "");
        setCity(stay.city ?? "");
        setStateName(stay.state ?? "");
        setAddress(stay.address ?? "");
        setPrice(String(stay.price ?? ""));
        setPriceLabel(stay.priceLabel ?? "per hour");
        setTotalRooms(String(stay.totalRooms ?? ""));
        setBedrooms(String(stay.bedrooms ?? ""));
        setBathrooms(String(stay.bathrooms ?? ""));
        setMaximumGuests(String(stay.maximumGuests ?? ""));
        setArea(String(stay.area ?? ""));
        setAmenities(stay.amenities ?? []);
        setAvailableDays(stay.availableDays?.length ? stay.availableDays : [...DAYS]);
        setOpeningTime(stay.openingTime ?? "09:00");
        setClosingTime(stay.closingTime ?? "24:00");
        setSlotDuration(stay.slotDuration ?? 60);
        setExisting(stay.images ?? (stay.image ? [stay.image] : []));
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not load the stay.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, navigation]);

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const toggleDay = (d: string) =>
    setAvailableDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const allDaysSelected = availableDays.length === DAYS.length;

  /* completion tracker for the header progress bar */
  const { progress, done, total } = useMemo(() => {
    const checks = [
      name.trim().length >= 2,
      description.trim().length > 0,
      city.trim().length > 0,
      type === "hotel" ? Number(totalRooms) > 0 : Number(bedrooms) > 0,
      Number(price.replace(/[^\d.]/g, "")) > 0,
      availableDays.length > 0,
      amenities.length > 0,
    ];
    const d = checks.filter(Boolean).length;
    return { progress: Math.round((d / checks.length) * 100), done: d, total: checks.length };
  }, [name, description, city, type, totalRooms, bedrooms, price, availableDays, amenities]);

  const submit = async (asDraft: boolean) => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter the property name";
    if (!city.trim()) next.city = "City is required";
    if (type === "hotel") {
      if (!totalRooms.trim() || Number(totalRooms) <= 0) next.totalRooms = "Number of rooms is required";
    } else {
      if (!bedrooms.trim() || Number(bedrooms) <= 0) next.bedrooms = "Bedrooms required";
    }
    if (!price.trim() || Number(price.replace(/[^\d.]/g, "")) <= 0)
      next.price = "Enter an hourly price";
    if (availableDays.length === 0) next.availableDays = "Select at least one open day";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (saving) return;

    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        name: name.trim(),
        type,
        description: description.trim(),
        city: city.trim(),
        state: stateName.trim(),
        address: address.trim(),
        price: Number(price.replace(/[^\d.]/g, "")),
        priceLabel,
        amenities: amenities.join(","),
        availableDays: availableDays.join(","),
        openingTime,
        closingTime,
        slotDuration,
        isTimeSlotEnabled: true,
        isDraft: asDraft,
        status: asDraft ? "DRAFT" : "PENDING_APPROVAL",
      };
      if (type === "hotel") {
        fields.totalRooms = Number(totalRooms);
      } else {
        Object.assign(fields, {
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms || 0),
          maximumGuests: Number(maximumGuests || 0),
          area: area.trim(),
        });
      }

      if (editId) {
        await StayApi.update(editId, { ...fields, images: existing });
        Alert.alert("Saved", "Stay updated successfully.");
      } else {
        await StayApi.create(fields, picked);
        Alert.alert("Submitted", asDraft
          ? "Your stay was saved as a draft."
          : "Your stay was submitted for approval. You'll be notified once it's live.");
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save the stay. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <Text style={{ textAlign: "center", color: colors.textMuted }}>Loading stay…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* ------------------------------- header ------------------------------- */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Go back" hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {editId ? "Edit stay" : "Add hotel / villa"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {editId ? "Update listing details & availability" : "Hourly stays for hospitality guests"}
            </Text>
          </View>
        </View>

        {/* progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Listing completeness</Text>
            <Text style={[styles.progressValue, { color: colors.primary }]}>{done}/{total}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {/* --------------------------- stay type --------------------------- */}
        <SectionCard icon="business-outline" title="Stay type" hint="Choose what you're listing" colors={colors}>
          <View style={styles.row2}>
            {([
              { key: "hotel", icon: "business-outline", label: "Hotel", sub: "Rooms & suites" },
              { key: "villa", icon: "home-outline", label: "Villa", sub: "Private holiday home" },
            ] as const).map((t) => {
              const active = type === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setType(t.key)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.typeBtn,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? `${colors.primary}0D` : colors.surfaceAlt,
                      opacity: pressed ? 0.85 : 1,
                    },
                    active && styles.typeBtnActive,
                  ]}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: active ? `${colors.primary}1A` : colors.chipBg }]}>
                    <Ionicons name={t.icon as never} size={20} color={active ? colors.primary : colors.textMuted} />
                  </View>
                  <Text style={[styles.typeText, { color: active ? colors.primary : colors.text }]}>{t.label}</Text>
                  <Text style={[styles.typeSub, { color: colors.textMuted }]}>{t.sub}</Text>
                  <View
                    style={[
                      styles.typeCheck,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    {active ? <Ionicons name="checkmark" size={11} color={colors.onPrimary} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* ------------------------ property basics ------------------------ */}
        <SectionCard icon="document-text-outline" title="Property details" hint="Name & description guests will see" colors={colors}>
          <Input label="Property name" value={name} onChangeText={setName} error={errors.name} placeholder="e.g. The Royal Suites Hotel" />
          <View style={{ height: 12 }} />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="What makes this stay special? Pool, view, service…"
          />
        </SectionCard>

        {/* --------------------------- location ---------------------------- */}
        <SectionCard icon="location-outline" title="Location" hint="Where is your property located?" colors={colors}>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="City" value={city} onChangeText={setCity} error={errors.city} placeholder="Jaipur" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="State" value={stateName} onChangeText={setStateName} placeholder="Rajasthan" />
            </View>
          </View>
          <View style={{ height: 12 }} />
          <Input label="Address" value={address} onChangeText={setAddress} placeholder="Street, locality, landmark" multiline />
        </SectionCard>

        {/* ---------------------------- capacity --------------------------- */}
        <SectionCard
          icon={type === "hotel" ? "bed-outline" : "columns-outline"}
          title={type === "hotel" ? "Property capacity" : "Villa configuration"}
          hint={type === "hotel" ? "Manage room types after publishing" : "Spaces & guest limits"}
          colors={colors}
        >
          {type === "hotel" ? (
            <Input label="Total rooms" value={totalRooms} onChangeText={setTotalRooms} keyboardType="number-pad" error={errors.totalRooms} placeholder="12" />
          ) : (
            <>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Input label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" error={errors.bedrooms} placeholder="3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" placeholder="2" />
                </View>
              </View>
              <View style={{ height: 12 }} />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Input label="Max guests" value={maximumGuests} onChangeText={setMaximumGuests} keyboardType="number-pad" placeholder="6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Area" value={area} onChangeText={setArea} placeholder="1800 sq ft" />
                </View>
              </View>
            </>
          )}
        </SectionCard>

        {/* ---------------------------- pricing ---------------------------- */}
        <SectionCard icon="pricetag-outline" title="Hourly pricing" hint="Guests book by the hour" colors={colors}>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Hourly price (₹)" value={price} onChangeText={setPrice} keyboardType="number-pad" error={errors.price} placeholder="1200" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Price label" value={priceLabel} onChangeText={setPriceLabel} placeholder="per hour" />
            </View>
          </View>
        </SectionCard>

        {/* --------------------------- amenities --------------------------- */}
        <SectionCard
          icon="sparkles-outline"
          title="Amenities"
          hint={`${amenities.length} selected`}
          colors={colors}
        >
          <View style={styles.chips}>
            {AMENITIES.map((a) => (
              <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => toggleAmenity(a)} />
            ))}
          </View>
        </SectionCard>

        {/* ------------------------ hourly availability -------------------- */}
        <SectionCard icon="time-outline" title="Hourly availability" hint="Days guests can book & slot timings" colors={colors}>
          <View style={styles.rowBetween}>
            <View style={styles.miniLabel}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.miniLabelTxt, { color: colors.text }]}>Open days</Text>
            </View>
            <Pressable onPress={() => setAvailableDays(allDaysSelected ? [] : [...DAYS])} hitSlop={6}>
              <Text style={[styles.selectAll, { color: colors.primary }]}>
                {allDaysSelected ? "Clear" : "Select all"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {DAYS.map((d) => (
              <Chip key={d} label={d.slice(0, 3)} selected={availableDays.includes(d)} onPress={() => toggleDay(d)} />
            ))}
          </View>
          {errors.availableDays ? <Text style={[styles.err, { color: colors.danger }]}>{errors.availableDays}</Text> : null}

          <View style={{ height: 16 }} />
          <View style={styles.miniLabel}>
            <Ionicons name="sunny-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.miniLabelTxt, { color: colors.text }]}>Opening time</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRowScroll}>
            <View style={styles.timeRow}>
              {TIMES.filter((t) => t !== "24:00").map((t) => (
                <Chip key={t} label={t} selected={openingTime === t} onPress={() => setOpeningTime(t)} />
              ))}
            </View>
          </ScrollView>

          <View style={{ height: 12 }} />
          <View style={styles.miniLabel}>
            <Ionicons name="moon-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.miniLabelTxt, { color: colors.text }]}>Closing time</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRowScroll}>
            <View style={styles.timeRow}>
              {TIMES.map((t) => (
                <Chip key={t} label={t} selected={closingTime === t} onPress={() => setClosingTime(t)} />
              ))}
            </View>
          </ScrollView>

          <View style={{ height: 12 }} />
          <View style={styles.miniLabel}>
            <Ionicons name="hourglass-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.miniLabelTxt, { color: colors.text }]}>Slot duration</Text>
          </View>
          <View style={styles.timeRow}>
            {DURATIONS.map((d) => (
              <Chip key={d} label={`${d}m`} selected={slotDuration === d} onPress={() => setSlotDuration(d)} />
            ))}
          </View>
        </SectionCard>

        {/* ---------------------------- photos ----------------------------- */}
        <SectionCard icon="images-outline" title="Photos" hint="Up to 8 photos — first one is the cover" colors={colors} isLast>
          <ImagePickerGrid
            existing={existing}
            onExistingChange={setExisting}
            picked={picked}
            onPickedChange={setPicked}
            max={8}
            label="Photos"
          />
        </SectionCard>

        {/* ----------------------------- submit ---------------------------- */}
        <Button
          label={editId ? "Save changes" : "Submit for approval"}
          onPress={() => submit(false)}
          loading={saving}
          style={{ height: 54, borderRadius: 16, marginTop: 8, marginBottom: 8 }}
        />
        <Button
          label="Save as draft"
          variant="ghost"
          onPress={() => submit(true)}
          disabled={saving}
          style={{ height: 48 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* header */
  headerWrap: { paddingHorizontal: 16, paddingTop: 46 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },
  headerSub: { fontSize: 12.5, marginTop: 1 },

  /* progress */
  progressCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  progressTitle: { fontSize: 12.5, fontWeight: "700" },
  progressValue: { fontSize: 12.5, fontWeight: "800" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },

  /* scroll */
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  /* card */
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14.5, fontWeight: "800", letterSpacing: 0.1 },
  cardHint: { fontSize: 11.5, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  /* layout */
  row2: { flexDirection: "row", gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  /* type selector */
  typeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  typeBtnActive: { shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  typeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeText: { fontSize: 14, fontWeight: "800" },
  typeSub: { fontSize: 10.5, marginTop: 2, fontWeight: "500" },
  typeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* time rows */
  miniLabel: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  miniLabelTxt: { fontSize: 12.5, fontWeight: "700" },
  selectAll: { fontSize: 12.5, fontWeight: "700" },
  timeRowScroll: { paddingRight: 8 },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },

  err: { fontSize: 12, marginTop: 6, fontWeight: "500" },
});
