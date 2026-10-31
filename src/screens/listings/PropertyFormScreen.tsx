/**
 * To-Let listing create & edit — rental-only (no sale fields).
 * POST /properties | PUT /properties/:id — `purpose: rent`, `listingType: TO_LET`.
 * Backend category gate: vendor must own TO_LET. Images ride the multipart request.
 */

import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { ImagePickerGrid, type PickedImage } from "../../components/ImagePickerGrid";
import { useTheme } from "../../theme/ThemeProvider";
import { PropertyApi } from "../../lib/api";
import type { Property } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const TYPES = ["Apartment", "Flat", "Builder Floor", "Independent House", "Villa", "Studio"];
const BHK = ["1", "2", "3", "4", "5+"];
const FURNISHING = ["Unfurnished", "Semi Furnished", "Full Furnished"];
const TENANTS = ["Family", "Bachelor", "Working Professional", "Student", "Any"];
const BROKERAGE = ["No Brokerage", "Brokerage"];
const AMENITIES = [
  "Wifi", "Lift", "Power Backup", "Parking", "Security", "Swimming Pool",
  "Gym", "Park", "Balcony", "Servant Room", "Water Supply", "CCTV",
];

export function PropertyFormScreen({ navigation, route }: StackScreenProps<"PropertyForm">) {
  const { colors } = useTheme();
  const editId = route.params?.propertyId;

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Apartment");
  const [bhk, setBhk] = useState("2");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSize, setAreaSize] = useState("");
  const [carpetArea, setCarpetArea] = useState("");
  const [furnishing, setFurnishing] = useState("Semi Furnished");
  const [tenantPreference, setTenantPreference] = useState("Family");
  const [brokerageToggle, setBrokerageToggle] = useState("No Brokerage");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [floorNum, setFloorNum] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [zeroBrokerageAuto, setZeroBrokerageAuto] = useState(true);
  const [existing, setExisting] = useState<string[]>([]);
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const p: Property = await PropertyApi.get(editId);
        setTitle(p.title ?? "");
        setType(p.type ?? "Apartment");
        setBhk(String(p.bhk ?? p.bedrooms ?? "2"));
        setBathrooms(String(p.bathrooms ?? ""));
        setAreaSize(String(p.areaSize ?? ""));
        setCarpetArea(String(p.carpetArea ?? ""));
        setFurnishing(p.furnishing ?? "Semi Furnished");
        setTenantPreference(p.tenantPreference ?? "Family");
        setBrokerageToggle(p.isZeroBrokerage ? "No Brokerage" : p.brokerage ?? "No Brokerage");
        setCity(p.city ?? "");
        setLocality(p.locality ?? "");
        setAddress(p.address ?? "");
        setPincode(String(p.pincode ?? ""));
        setMonthlyRent(String(p.monthlyRent ?? p.price ?? ""));
        setSecurityDeposit(String(p.securityDeposit ?? ""));
        setMaintenance(String(p.maintenance ?? ""));
        setAvailableFrom(p.availableFrom ?? "");
        setFloorNum(String(p.floor ?? ""));
        setTotalFloors(String(p.totalFloors ?? ""));
        setDescription(p.description ?? "");
        setAmenities(p.amenities ?? []);
        setZeroBrokerageAuto(p.isZeroBrokerage ?? true);
        setExisting(p.images ?? (p.image ? [p.image] : []));
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not load the listing.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, navigation]);

  useEffect(() => {
    setZeroBrokerageAuto(brokerageToggle === "No Brokerage");
  }, [brokerageToggle]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <Text style={{ textAlign: "center", color: colors.textMuted }}>Loading listing…</Text>
      </View>
    );
  }

  const submit = async (asDraft: boolean) => {
    const next: Record<string, string> = {};
    if (title.trim().length < 4) next.title = "Enter a listing title";
    if (!city.trim()) next.city = "City is required";
    if (!monthlyRent.trim() || Number(monthlyRent.replace(/[^\d.]/g, "")) <= 0)
      next.monthlyRent = "Enter monthly rent";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (saving) return;

    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        title: title.trim(),
        listingType: "TO_LET",
        purpose: "rent",
        type,
        bhk,
        bedrooms: parseInt(bhk, 10) || 1,
        bathrooms: parseInt(bathrooms, 10) || 1,
        areaSize: Number(areaSize.replace(/[^\d.]/g, "")) || undefined,
        carpetArea: Number(carpetArea.replace(/[^\d.]/g, "")) || undefined,
        furnishing,
        tenantPreference,
        brokerage: brokerageToggle,
        isZeroBrokerage: zeroBrokerageAuto,
        monthlyRent: Number(monthlyRent.replace(/[^\d.]/g, "")),
        securityDeposit: Number(securityDeposit.replace(/[^\d.]/g, "")) || undefined,
        maintenance: maintenance ? Number(maintenance.replace(/[^\d.]/g, "")) : undefined,
        availableFrom: availableFrom || undefined,
        floor: floorNum || undefined,
        totalFloors: totalFloors || undefined,
        city: city.trim(),
        locality: locality.trim(),
        address: address.trim(),
        pincode: pincode.trim() || undefined,
        description: description.trim(),
        amenities: amenities.join(","),
        postedBy: "Owner",
        isDraft: asDraft,
        status: asDraft ? "DRAFT" : "PENDING_APPROVAL",
      };
      if (editId) {
        await PropertyApi.update(editId, { ...fields, images: existing }, []);
        Alert.alert("Saved", "Listing updated successfully.");
      } else {
        await PropertyApi.create(fields, picked);
        Alert.alert(
          "Submitted",
          asDraft
            ? "Your listing was saved as a draft."
            : "Your rental listing was submitted for approval.",
        );
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save the listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader
          title={editId ? "Edit listing" : "Add rental listing"}
          subtitle="Homes & apartments for rent / To-Let"
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onScrollBeginDrag={Keyboard.dismiss}>
        <Input label="Listing title" value={title} onChangeText={setTitle} error={errors.title} placeholder="e.g. Sunlit 2BHK near City Park" />
        <View style={{ height: 12 }} />

        <Text style={[styles.label, { color: colors.text }]}>Property type</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Bedrooms (BHK)</Text>
        <View style={styles.chips}>
          {BHK.map((b) => (
            <Chip key={b} label={`${b} BHK`} selected={bhk === b} onPress={() => setBhk(b)} />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" placeholder="2" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Area (sq ft)" value={areaSize} onChangeText={setAreaSize} keyboardType="number-pad" placeholder="1100" />
          </View>
        </View>
        <View style={{ height: 12 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Furnishing" value={furnishing} onChangeText={setFurnishing} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Tenant preference" value={tenantPreference} onChangeText={setTenantPreference} />
          </View>
        </View>
        <View style={{ height: 8 }} />
        <View style={styles.chips}>
          {FURNISHING.map((f) => (
            <Chip key={f} label={f} selected={furnishing === f} onPress={() => setFurnishing(f)} />
          ))}
        </View>
        <View style={{ height: 4 }} />
        <View style={styles.chips}>
          {TENANTS.map((t) => (
            <Chip key={t} label={t} selected={tenantPreference === t} onPress={() => setTenantPreference(t)} />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Brokerage</Text>
        <View style={styles.chips}>
          {BROKERAGE.map((b) => (
            <Chip key={b} label={b} selected={brokerageToggle === b} onPress={() => setBrokerageToggle(b)} />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="City" value={city} onChangeText={setCity} error={errors.city} placeholder="Jaipur" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Locality" value={locality} onChangeText={setLocality} placeholder="Vaishali Nagar" />
          </View>
        </View>
        <View style={{ height: 12 }} />
        <Input label="Address" value={address} onChangeText={setAddress} multiline placeholder="Full address shown to tenants" />
        <View style={{ height: 12 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" placeholder="302021" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Floor" value={floorNum} onChangeText={setFloorNum} placeholder="e.g. 2 of 5" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Pricing (rental only)</Text>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Monthly rent (₹)" value={monthlyRent} onChangeText={setMonthlyRent} keyboardType="number-pad" error={errors.monthlyRent} placeholder="22000" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Security deposit (₹)" value={securityDeposit} onChangeText={setSecurityDeposit} keyboardType="number-pad" placeholder="44000" />
          </View>
        </View>
        <View style={{ height: 12 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Maintenance (₹/mo)" value={maintenance} onChangeText={setMaintenance} keyboardType="number-pad" placeholder="1500" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Available from" value={availableFrom} onChangeText={setAvailableFrom} placeholder="2026-01-15" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline placeholder="Describe your home, society and connectivity." />

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Amenities</Text>
        <View style={styles.chips}>
          {AMENITIES.map((a) => (
            <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))} />
          ))}
        </View>

        <View style={{ height: 18 }} />
        <ImagePickerGrid
          existing={existing}
          onExistingChange={setExisting}
          picked={picked}
          onPickedChange={setPicked}
          max={8}
          label="Listing photos"
        />

        <Button
          label={editId ? "Save changes" : "Submit for approval"}
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
});
