/** Small status pill + shared formatting helpers for vendor screens. */

import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface PillMeta {
  label: string;
  color: string;
  bg: string;
}

export function StatusPill({ meta, small = false }: { meta: PillMeta; small?: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }, small && { paddingVertical: 2 }]}>
      <Text style={[styles.text, { color: meta.color }, small && { fontSize: 10.5 }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: { fontSize: 11, fontWeight: "700" },
});

/* ───────────────────── formatting helpers ───────────────────── */

export function formatMoney(value: unknown): string {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  if (!Number.isFinite(n)) return "₹0";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1).replace(/\.0$/, "")} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function normalizeId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object" && value !== null && "_id" in (value as any)) {
    return String((value as any)._id);
  }
  return String(value);
}

export function initialsOf(name?: string): string {
  if (!name) return "V";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
