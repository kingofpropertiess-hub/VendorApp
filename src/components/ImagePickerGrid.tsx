/**
 * Image picker + preview grid used by every listing form.
 *
 * Existing (already-uploaded URL) images render from the URL and can be
 * removed (i.e. excluded from the next update payload) or kept; freshly
 * picked local images upload with the create/update request — images ride
 * the same multipart request (backend Cloudinary middleware).
 */

import React, { useCallback } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from "react-native-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider";
import { resolveImageUrl } from "../lib/config";
import { SmartImage } from "./ui/SmartImage";

export interface PickedImage {
  uri: string;
  fileName?: string;
}

interface Props {
  /** Already-uploaded URLs (rendered over the network). */
  existing?: string[];
  onExistingChange?: (next: string[]) => void;
  /** Fresh local picks awaiting upload. */
  picked: PickedImage[];
  onPickedChange: (next: PickedImage[]) => void;
  max?: number;
  label?: string;
}

export function ImagePickerGrid({
  existing = [],
  onExistingChange,
  picked,
  onPickedChange,
  max = 8,
  label = "Photos",
}: Props) {
  const { colors } = useTheme();

  const remaining = max - existing.length - picked.length;

  const pick = useCallback(() => {
    if (remaining <= 0) {
      Alert.alert("Limit reached", `You can attach up to ${max} images.`);
      return;
    }
    launchImageLibrary(
      { mediaType: "photo", quality: 0.7, maxWidth: 1280, maxHeight: 1280, selectionLimit: remaining },
      (response: { didCancel?: boolean; errorMessage?: string; assets?: Asset[] }) => {
        if (response.didCancel || response.errorMessage) return;
        const assets = response.assets ?? [];
        const mapped = assets
          .filter((a) => a.uri)
          .map((a) => ({ uri: a.uri as string, fileName: a.fileName ?? undefined }));
        onPickedChange([...picked, ...mapped].slice(0, Math.max(0, max - existing.length)));
      },
    );
  }, [remaining, max, picked, existing.length, onPickedChange]);

  const addFromCamera = useCallback(() => {
    if (remaining <= 0) {
      Alert.alert("Limit reached", `You can attach up to ${max} images.`);
      return;
    }
    launchCamera(
      { mediaType: "photo", quality: 0.7, maxWidth: 1280, maxHeight: 1280, saveToPhotos: false },
      (response: { didCancel?: boolean; errorMessage?: string; assets?: Asset[] }) => {
        if (response.didCancel || response.errorMessage) return;
        const asset = (response.assets ?? [])[0];
        if (asset?.uri) {
          onPickedChange([...picked, { uri: asset.uri, fileName: asset.fileName }].slice(0, Math.max(0, max - existing.length)));
        }
      },
    );
  }, [remaining, max, picked, existing.length, onPickedChange]);

  const chooseSource = () => {
    Alert.alert(label, "Add images from", [
      { text: "Photo Library", onPress: pick },
      { text: "Take Photo", onPress: addFromCamera },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removePicked = (index: number) =>
    onPickedChange(picked.filter((_, i) => i !== index));

  const removeExisting = (index: number) =>
    onExistingChange?.(existing.filter((_, i) => i !== index));

  const data = [
    ...existing.map((uri, i) => ({ type: "existing" as const, uri, index: i })),
    ...picked.map((img, i) => ({ type: "picked" as const, uri: img.uri, index: i })),
  ];

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          <Text style={{ color: colors.textMuted, fontWeight: "600" }}>
            {"  "}{existing.length + picked.length}/{max}
          </Text>
        </Text>
        <Pressable onPress={chooseSource} hitSlop={6}>
          <Text style={[styles.add, { color: colors.primary }]}>+ Add</Text>
        </Pressable>
      </View>
      {data.length === 0 ? (
        <Pressable
          onPress={chooseSource}
          style={[styles.empty, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Ionicons name="images-outline" size={26} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {label} make listings credible. Tap to add.
          </Text>
        </Pressable>
      ) : (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item, i) => `${item.type}_${item.index}_${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          renderItem={({ item }) => (
            <View style={[styles.thumb, { borderColor: colors.border }]}>
              <SmartImage
                uri={resolveImageUrl(item.uri)}
                style={{ width: 76, height: 76, borderRadius: 10 }}
              />
              <Pressable
                onPress={() =>
                  item.type === "picked" ? removePicked(item.index) : removeExisting(item.index)
                }
                style={[styles.remove, { backgroundColor: "rgba(0,0,0,0.55)" }]}
                hitSlop={6}
              >
                <Ionicons name="close" size={13} color="#fff" />
              </Pressable>
              {item.type === "picked" ? (
                <View style={[styles.newTag, { backgroundColor: colors.primary }]}>
                  <Text style={styles.newText}>New</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 13.5, fontWeight: "600" },
  add: { fontSize: 13, fontWeight: "800" },
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 18,
    alignItems: "center",
    gap: 6,
  },
  emptyText: { fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  newTag: {
    position: "absolute",
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  newText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
