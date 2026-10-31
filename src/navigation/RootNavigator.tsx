/**
 * Root navigation — auth gate + RBAC gates + role-specific tab sets.
 *
 * Boot order:
 *   1. Splash overlay until session restore resolves (min dwell for polish).
 *   2. signedOut            → AuthStack      (Welcome / Login / Register)
 *   3. authed + no categories → Onboarding   (business-category setup)
 *   4. authed + suspended/rejected → AccountStatus gate
 *   5. authed               → MainStack      (category-aware tabs)
 *
 * Permissions re-evaluate on every render: editing categories, being
 * suspended or signed out anywhere immediately reroutes the vendor.
 */

import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useTheme } from "../theme/ThemeProvider";
import { useVendorAuth } from "../auth/VendorAuthProvider";
import { authorizedCategories, statusOf } from "../rbac/categories";
import { useActiveCategory } from "../rbac/ActiveCategory";
import { SplashScreen as SplashScreenView } from "../screens/splash/SplashScreen";

/* Auth */
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { GuestHomeScreen } from "../screens/auth/GuestHomeScreen";

/* Gates */
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { AccountStatusScreen } from "../screens/onboarding/AccountStatusScreen";

/* Tabs */
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { StaysScreen } from "../screens/stays/StaysScreen";
import { BookingsScreen } from "../screens/bookings/BookingsScreen";
import { ListingsScreen } from "../screens/listings/ListingsScreen";
import { LeadsScreen } from "../screens/leads/LeadsScreen";
import { ExpertsScreen } from "../screens/style/ExpertsScreen";
import { NotificationsScreen } from "../screens/account/NotificationsScreen";
import { ProfileScreen } from "../screens/account/ProfileScreen";

/* Stack detail + form screens */
import { StayDetailScreen } from "../screens/stays/StayDetailScreen";
import { StayFormScreen } from "../screens/stays/StayFormScreen";
import { RoomTypeFormScreen } from "../screens/stays/RoomTypeFormScreen";
import { RoomCalendarScreen } from "../screens/stays/RoomCalendarScreen";
import { PropertyFormScreen } from "../screens/listings/PropertyFormScreen";
import { PropertySlotsScreen } from "../screens/listings/PropertySlotsScreen";
import { ExpertFormScreen } from "../screens/style/ExpertFormScreen";
import { BookingDetailScreen } from "../screens/bookings/BookingDetailScreen";
import { LeadDetailScreen } from "../screens/leads/LeadDetailScreen";
import { EditProfileScreen } from "../screens/account/EditProfileScreen";
import { SettingsScreen } from "../screens/account/SettingsScreen";
import { AnalyticsScreen } from "../screens/account/AnalyticsScreen";

import { VendorTabBar } from "../components/VendorTabBar";
import type { MainStackParamList, TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const GateStack = createNativeStackNavigator<{ Onboarding: undefined; AccountStatusScreen: undefined }>();

const SPLASH_MIN_MS = 2200;
const SPLASH_FADE_MS = 400;

function MainTabs() {
  const { category } = useActiveCategory();
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <VendorTabBar {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Manage"
        component={
          category === "HOTEL_VILLA"
            ? StaysScreen
            : category === "STYLE"
            ? ExpertsScreen
            : ListingsScreen
        }
        options={{}}
      />
      <Tab.Screen
        name="Inbox"
        component={category === "HOTEL_VILLA" ? BookingsScreen : LeadsScreen}
        options={{}}
      />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{}} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{}} />
    </Tab.Navigator>
  );
}

/**
 * The tab component choices depend on the active category; remount tabs on
 * category change so list screens refetch fresh data.
 */
function MainTabsKeyed() {
  const { category } = useActiveCategory();
  return <MainTabs key={category} />;
}

function MainFlow() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Main" component={MainTabsKeyed} />
      <MainStack.Screen
        name="StayDetail"
        component={StayDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="StayForm"
        component={StayFormScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="RoomTypeForm"
        component={RoomTypeFormScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="RoomCalendar"
        component={RoomCalendarScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="PropertySlots"
        component={PropertySlotsScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="ExpertForm"
        component={ExpertFormScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="LeadDetail"
        component={LeadDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: "slide_from_right" }}
      />
      <MainStack.Screen name="Settings" component={SettingsScreen} options={{}} />
      <MainStack.Screen name="Analytics" component={AnalyticsScreen} options={{}} />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const { status, user } = useVendorAuth();
  const { mode, colors } = useTheme();
  const [splashMounted, setSplashMounted] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  const accountState = statusOf(user?.status);
  const categories = useMemo(() => authorizedCategories(user), [user]);

  /* Splash dwell + graceful fade-out. */
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    if (status !== "loading") {
      fadeTimer = setTimeout(() => setSplashFading(true), SPLASH_MIN_MS);
      removeTimer = setTimeout(() => setSplashMounted(false), SPLASH_MIN_MS + SPLASH_FADE_MS);
    }
    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [status]);

  const navTheme = useMemo(() => {
    const base = mode === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [mode, colors]);

  if (status === "loading") {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="small" color="#C6A25C" />
      </View>
    );
  }

  let tree: React.ReactNode;
  if (status === "signedOut") {
    tree = (
      <SignOutStack />
    );
  } else if (status === "guest") {
    /* Guest preview — lands on GuestHome, funnels into Login / Register. */
    tree = (
      <AuthStack.Navigator
        key="guest"
        screenOptions={{ headerShown: false }}
        initialRouteName="GuestHome"
      >
        <AuthStack.Screen name="GuestHome" component={GuestHomeScreen} />
        <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  } else if (status === "authed" && user && categories.length === 0) {
    tree = (
      <GateStack.Navigator screenOptions={{ headerShown: false }}>
        <GateStack.Screen name="Onboarding" component={OnboardingScreen} />
      </GateStack.Navigator>
    );
  } else if (accountState === "suspended" || accountState === "rejected") {
    tree = (
      <GateStack.Navigator screenOptions={{ headerShown: false }}>
        <GateStack.Screen name="AccountStatusScreen" component={AccountStatusScreen} />
      </GateStack.Navigator>
    );
  } else {
    tree = <MainFlow />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {tree}
      {splashMounted ? (
        <SplashScreenView exiting={splashFading} />
      ) : null}
    </NavigationContainer>
  );
}

const AuthStack = createNativeStackNavigator<import("./types").AuthStackParamList>();

function SignOutStack() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8F3",
  },
});

