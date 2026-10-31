/**
 * Room type create / edit — hourly pricing, duration limits & capacity.
 * POST /rooms/stays/:stayId/room-types | PUT .../:roomTypeId
 */

import React, { useEffect, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { ImagePickerGrid, type PickedImage } from "../../components/ImagePickerGrid";
import { useTheme } from "../../theme/ThemeProvider";
import { RoomApi } from "../../lib/api";
import type { RoomType } from "../../lib/types";
import type { StackScreenProps } from "../../navigation/types";

const BED_TYPES = ["1 King Bed", "1 Queen Bed", "2 Twin Beds", "1 Double Bed", "2 Queen Beds"];
const BATHS = ["Attached", "Shared", "Private Bathroom"];

export function RoomTypeFormScreen({ navigation, route }: StackScreenProps<"RoomTypeForm">) {
  const { colors } = useTheme();
  const { stayId, roomTypeId } = route.params;
  const editing = !!roomTypeId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [minDuration, setMinDuration] = useState("1");
  const [maxDuration, setMaxDuration] = useState("12");
  const [capacity, setCapacity] = useState("2");
  const [bedType, setBedType] = useState("1 King Bed");
  const [bathroomType, setBathroomType] = useState("Attached");
  const [roomSize, setRoomSize] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!roomTypeId) return;
    (async () => {
      try {
        const list = await RoomApi.roomTypes(stayId);
        const rt: RoomType | undefined = list.find((r) => String(r._id) === roomTypeId || (r as any).id === roomTypeId);
        if (!rt) {
          Alert.alert("Not found", "Room type unavailable.", [{ text: "OK", onPress: () => navigation.goBack() }]);
          return;
        }
        setName(rt.name);
        setDescription(rt.description ?? "");
        setPricePerHour(String(rt.pricePerHour ?? ""));
        setMinDuration(String(rt.minDuration ?? 1));
        setMaxDuration(String(rt.maxDuration ?? 12));
        setCapacity(String(rt.capacity ?? rt.adults ?? 2));
        setBedType(rt.bedType ?? "1 King Bed");
        setBathroomType(rt.bathroomType ?? "Attached");
        setRoomSize(rt.roomSize ?? "");
        setAmenities(rt.amenities ?? []);
        setExisting(rt.images ?? []);
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not load the room type.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomTypeId, stayId, navigation]);

  const AMENITIES = ["Free Wi-Fi", "Air Conditioning", "TV", "Mini Fridge", "Room Service", "Bath Tub", "Balcony", "Work Desk"];

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter a room name";
    const price = Number(pricePerHour.replace(/[^\d.]/g, ""));
    if (!price || price <= 0) next.pricePerHour = "Enter hourly price";
    const min = Number(minDuration) || 1;
    const max = Number(maxDuration) || 12;
    if (max < min) next.maxDuration = "Max must be ≥ min duration";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (saving) return;

    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        name: name.trim(),
        title: name.trim(),
        description: description.trim(),
        pricePerHour: price,
        minDuration: min,
        maxDuration: max,
        capacity: Number(capacity) || 2,
        adults: Number(capacity) || 2,
        bedType,
        bathroomType,
        roomSize: roomSize.trim(),
        amenities: amenities.join(","),
      };
      if (editing) {
        await RoomApi.updateRoomType(stayId, roomTypeId!, { ...fields, images: existing }, []);
        Alert.alert("Saved", "Room type updated successfully.");
      } else {
        await RoomApi.createRoomType(stayId, fields, images);
        Alert.alert("Added", "Room type added with hourly pricing.");
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save the room type.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ScreenHeader title="Loading…" onBack={() => navigation.goBack()} />
        <Text style={{ textAlign: "center", color: colors.textMuted }}>Fetching room type…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader
          title={editing ? "Edit room type" : "Add room type"}
          subtitle="Hourly price & booking durations per room"
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onScrollBeginDrag={Keyboard.dismiss}>
        <Input label="Room name" value={name} onChangeText={setName} error={errors.name} placeholder="Deluxe Room" />
        <View style={{ height: 12 }} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline placeholder="What makes this room comfortable?" />
        <View style={{ height: 12 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Price per hour (₹)" value={pricePerHour} onChangeText={setPricePerHour} keyboardType="number-pad" error={errors.pricePerHour} placeholder="900" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Capacity (guests)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="2" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Min booking (hours)" value={minDuration} onChangeText={setMinDuration} keyboardType="number-pad" placeholder="1" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Max booking (hours)" value={maxDuration} onChangeText={setMaxDuration} keyboardType="number-pad" error={errors.maxDuration} placeholder="12" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input label="Room size" value={roomSize} onChangeText={setRoomSize} placeholder="e.g. 300 sq ft" />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Bed type</Text>
        <View style={styles.chips}>
          {BED_TYPES.map((b) => (
            <Chip key={b} label={b} selected={bedType === b} onPress={() => setBedType(b)} />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Bathroom</Text>
        <View style={styles.chips}>
          {BATHS.map((b) => (
            <Chip key={b} label={b} selected={bathroomType === b} onPress={() => setBathroomType(b)} />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: colors.text }]}>Room amenities</Text>
        <View style={styles.chips}>
          {AMENITIES.map((a) => (
            <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))} />
          ))}
        </View>

        {!editing ? (
          <>
            <View style={{ height: 18 }} />
            <ImagePickerGrid label="Room photos" picked={images} onPickedChange={setImages} existing={[]} max={5} />
          </>
        ) : null}

        <Button
          label={editing ? "Save changes" : "Add room type"}
          onPress={submit}
          loading={saving}
          style={{ height: 52, borderRadius: 14, marginTop: 22 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, backgroundColor: "#F7F8FA" },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, marginTop: 8 },
  row2: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13.5, fontWeight: "700", marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
