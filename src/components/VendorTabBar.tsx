/**
 * Custom bottom tab bar — same design language as the Client App footer
 * (Ionicons 21, hairline top border, elevation 14), but vendor tab sets.
 */

import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider";
import { useActiveCategory } from "../rbac/ActiveCategory";

interface Item {
  name: keyof import("../navigation/types").TabParamList;
  label: string;
  icon: string;
  iconActive: string;
}

const SETS: Record<string, Item[]> = {
  HOTEL_VILLA: [
    { name: "Dashboard", label: "Dashboard", icon: "grid-outline", iconActive: "grid" },
    { name: "Manage", label: "Stays", icon: "bed-outline", iconActive: "bed" },
    { name: "Inbox", label: "Bookings", icon: "calendar-outline", iconActive: "calendar" },
    { name: "Alerts", label: "Alerts", icon: "notifications-outline", iconActive: "notifications" },
    { name: "Profile", label: "Profile", icon: "person-outline", iconActive: "person" },
  ],
  TO_LET: [
    { name: "Dashboard", label: "Dashboard", icon: "grid-outline", iconActive: "grid" },
    { name: "Manage", label: "Listings", icon: "home-outline", iconActive: "home" },
    { name: "Inbox", label: "Enquiries", icon: "chatbubbles-outline", iconActive: "chatbubbles" },
    { name: "Alerts", label: "Alerts", icon: "notifications-outline", iconActive: "notifications" },
    { name: "Profile", label: "Profile", icon: "person-outline", iconActive: "person" },
  ],
  STYLE: [
    { name: "Dashboard", label: "Dashboard", icon: "grid-outline", iconActive: "grid" },
    { name: "Manage", label: "Services", icon: "sparkles-outline", iconActive: "sparkles" },
    { name: "Inbox", label: "Requests", icon: "chatbubbles-outline", iconActive: "chatbubbles" },
    { name: "Alerts", label: "Alerts", icon: "notifications-outline", iconActive: "notifications" },
    { name: "Profile", label: "Profile", icon: "person-outline", iconActive: "person" },
  ],
};

export function VendorTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { category: activeCategory } = useActiveCategory();

  const items = SETS[activeCategory ?? "HOTEL_VILLA"] ?? SETS.HOTEL_VILLA;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {items.map((item, index) => {
        const route = state.routes[index];
        if (!route) return null;
        const focused = state.index === index;
        const tint = focused ? colors.primary : colors.textMuted;
        return (
          <View key={item.name} style={styles.itemWrap}>
            <TabButton
              icon={focused ? item.iconActive : item.icon}
              label={item.label}
              tint={tint}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
            />
          </View>
        );
      })}
      {/* Fill slots when the tab set is shorter than the route list (never in practice) */}
      {Array.from({ length: Math.max(0, state.routes.length - items.length) }).map((_, i) => (
        <View key={`pad_${i}`} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

function TabButton({
  icon,
  label,
  tint,
  focused,
  onPress,
}: {
  icon: string;
  label: string;
  tint: string;
  focused: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
    >
      <Ionicons name={icon as never} size={21} color={tint} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
  },
  itemWrap: { flex: 1 },
  item: { alignItems: "center", justifyContent: "center", gap: 2 },
  label: { fontSize: 10, fontWeight: "700" },
});

