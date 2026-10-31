/**
 * Notification list (tab "Alerts" + stack route) — in-app notifications only.
 * GET /notifications · PATCH /:id/read · read-all · DELETE — no push (FCM) exists server-side.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";
import { NotificationApi } from "../../lib/api";
import { formatDateTime } from "../../components/Pill";
import { StateView } from "../../components/ui/StateView";
import { Skeleton } from "../../components/ui/Skeleton";
import type { VendorNotification } from "../../lib/types";

const TYPE_ICONS: Record<string, string> = {
  booking: "calendar-outline",
  lead: "chatbubbles-outline",
  system: "settings-outline",
  info: "information-circle-outline",
};

export function NotificationsScreen({ navigation }: { navigation: any; route?: any }) {
  const { colors } = useTheme();

  const [items, setItems] = useState<VendorNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (asRefresh = false) => {
    asRefresh ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const res = await NotificationApi.list();
      if (mounted.current) {
        setItems(res.notifications);
        setUnread(res.unreadCount);
      }
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    load();
    const sub = navigation?.addListener?.("focus", () => load(true));
    return () => {
      mounted.current = false;
      sub?.();
    };
  }, [load, navigation]);

  const open = async (n: VendorNotification) => {
    if (!n.isRead && n._id) {
      try {
        await NotificationApi.readOne(String(n._id));
        load(true);
      } catch {
        // non-fatal
      }
    }
  };

  const readAll = async () => {
    try {
      await NotificationApi.readAll();
      load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not mark all as read.");
    }
  };

  const remove = async (n: VendorNotification) => {
    try {
      await NotificationApi.remove(String(n._id));
      setItems((prev) => prev.filter((x) => x._id !== n._id));
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not delete the notification.");
    }
  };

  const renderItem = ({ item }: { item: VendorNotification }) => (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftWidth: item.isRead ? 0 : 3, borderLeftColor: colors.primary }]}
      onPress={() => open(item)}
      onLongPress={() => remove(item)}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.chipBg }]}>
        <Ionicons name={(TYPE_ICONS[item.type ?? ""] ?? "notifications-outline") as never} size={18} color={item.isRead ? colors.textMuted : colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: item.isRead ? colors.textMuted : colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        </View>
        <Text style={[styles.msg, { color: colors.textMuted }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 2 }}>{formatDateTime(item.createdAt ?? (item as any).timestamp)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 46 }}>
        <ScreenHeader title="Notifications" subtitle={unread ? `${unread} unread` : "You're all caught up"} onBack={navigation?.goBack ? () => navigation.goBack() : undefined} right={unread > 0 ? (
          <Pressable onPress={readAll} hitSlop={8}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>Read all</Text>
          </Pressable>
        ) : undefined} />
      </View>

      {loading && !items.length ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={70} radius={14} />
          ))}
        </View>
      ) : !items.length ? (
        <StateView
          visible
          full={false}
          kind={failed ? "error" : "empty"}
          title={failed ? "Couldn't load notifications" : "No notifications"}
          message={failed ? "Check your connection and retry." : "Bookings, enquiries and account updates will appear here."}
          onRetry={failed ? () => load() : undefined}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => String(item._id ?? item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 11,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13.5, fontWeight: "800", flex: 1 },
  msg: { fontSize: 12.5, lineHeight: 17 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
