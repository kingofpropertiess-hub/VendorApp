/**
 * King of Properties — Vendor App
 *
 * Provider composition (same architecture as the Client App):
 *   SafeArea → Theme → VendorAuth (independent session) → ActiveBusinessCategory → RootNavigator
 */

import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { VendorAuthProvider, useVendorAuth } from "./src/auth/VendorAuthProvider";
import { ActiveCategoryProvider } from "./src/rbac/ActiveCategory";
import { RootNavigator } from "./src/navigation/RootNavigator";

function AppInner() {
  const { user } = useVendorAuth();
  return (
    <ActiveCategoryProvider user={user}>
      <RootNavigator />
    </ActiveCategoryProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <VendorAuthProvider>
          <AppInner />
        </VendorAuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
