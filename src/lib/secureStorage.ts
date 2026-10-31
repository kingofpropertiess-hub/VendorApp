/**
 * Secure storage wrapper on top of react-native-keychain (Android Keystore).
 *
 * Independent session from the Client App: the keychain service names are
 * namespaced with the vendor package id so the two apps never collide.
 */

import * as Keychain from "react-native-keychain";

const SERVICE_PREFIX = "com.kingofproperties.vendor.";

export const STORAGE_KEYS = {
  token: "kopv_auth_token",
  user: "kopv_auth_user_json",
} as const;

export const SecureStorage = {
  async setItemAsync(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword("token", value, {
      service: SERVICE_PREFIX + key,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async getItemAsync(key: string): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({ service: SERVICE_PREFIX + key });
      if (result === false) return null;
      return result.password;
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE_PREFIX + key });
    } catch {
      // best-effort
    }
  },
};
