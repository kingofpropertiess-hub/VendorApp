/**
 * Vendor auth context — independent session from the Client App.
 *
 * Token lives in the Android Keystore (react-native-keychain) namespaced
 * under com.kingofproperties.vendor; the cached vendor profile is JSON in
 * AsyncStorage for instant boot, then revalidated with GET /auth/me.
 *
 * A lightweight GUEST browse mode exists: guests skip sign-in and land on a
 * read-only preview home (no API access — every vendor endpoints requires a
 * bearer token). The flag persists so guests are not nagged to sign in.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTokenProvider, setUnauthorizedHandler } from "../lib/client";
import { SecureStorage } from "../lib/secureStorage";
import { AuthApi } from "../lib/api";
import type { VendorUser } from "../lib/types";

type AuthStatus = "loading" | "authed" | "signedOut" | "guest";

interface VendorAuthContextValue {
  status: AuthStatus;
  user: VendorUser | null;
  loadingAccount: boolean;
  signIn: (email: string, password: string) => Promise<VendorUser>;
  signUp: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
    password: string;
  }) => Promise<VendorUser>;
  continueAsGuest: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateCategories: (categories: string[]) => Promise<void>;
  setUser: (user: VendorUser | null) => void;
  signOut: () => Promise<void>;
}

const VendorAuthContext = createContext<VendorAuthContextValue>(null as any);

const TOKEN_KEY = "kopv_auth_token";
const USER_KEY = "kopv_auth_user_json";
const GUEST_KEY = "kopv_guest_mode";

export function VendorAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUserState] = useState<VendorUser | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const signingOutRef = useRef(false);

  const setUser = useCallback((next: VendorUser | null) => {
    setUserState(next);
    if (next) {
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(USER_KEY).catch(() => undefined);
    }
  }, []);

  const storeToken = useCallback(async (token: string | null) => {
    tokenRef.current = token;
    if (token) {
      await SecureStorage.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  /** Revalidate the stored session against the backend. */
  const refreshMe = useCallback(async () => {
    if (!tokenRef.current) return;
    setLoadingAccount(true);
    try {
      const res = await AuthApi.me();
      if (res?.user && res.user.role !== "user") {
        setUser(res.user);
      } else {
        await storeToken(null);
        setUser(null);
        setStatus("signedOut");
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await storeToken(null);
        setUser(null);
        setStatus("signedOut");
      }
      // network errors keep the cached profile
    } finally {
      setLoadingAccount(false);
    }
  }, [setUser, storeToken]);

  /* Boot: restore session. */
  useEffect(() => {
    setTokenProvider(async () => tokenRef.current);
    (async () => {
      const token = await SecureStorage.getItemAsync(TOKEN_KEY);
      let cached: VendorUser | null = null;
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) cached = JSON.parse(raw);
      } catch {
        cached = null;
      }
      if (token && cached) {
        tokenRef.current = token;
        setUserState(cached);
        setStatus("authed");
        refreshMe();
      } else if (token) {
        tokenRef.current = token;
        setStatus("authed");
        refreshMe();
      } else {
        const guest = await AsyncStorage.getItem(GUEST_KEY);
        setStatus(guest === "1" ? "guest" : "signedOut");
      }
    })();
  }, [refreshMe]);

  /* Global 401 handling — signed out silently. */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      (async () => {
        await storeToken(null);
        setUser(null);
        setStatus("signedOut");
        signingOutRef.current = false;
      })();
    });
  }, [setUser, storeToken]);

  /** Enter the read-only guest preview (no token; nothing hits the API). */
  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, "1");
    setUserState(null);
    setStatus("guest");
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await AuthApi.loginVendor({ email: email.trim(), password });
      if (!res?.token || !res?.user) {
        throw new Error(res?.message || "Login failed. Please try again.");
      }
      await storeToken(res.token);
      await AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
      setUser(res.user);
      setStatus("authed");
      return res.user;
    },
    [setUser, storeToken],
  );

  const signUp = useCallback(
    async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      companyName?: string;
      password: string;
    }) => {
      const res = await AuthApi.registerVendor({
        ...payload,
        email: payload.email.trim(),
        name: [payload.firstName, payload.lastName].filter(Boolean).join(" "),
      });
      if (!res?.token || !res?.user) {
        throw new Error(res?.message || "Registration failed. Please try again.");
      }
      await storeToken(res.token);
      await AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
      setUser(res.user);
      setStatus("authed");
      return res.user;
    },
    [setUser, storeToken],
  );

  const updateCategories = useCallback(
    async (categories: string[]) => {
      // Persisting via the vendor categories endpoint, then revalidating.
      await import("../lib/api").then(({ VendorApi }) =>
        VendorApi.updateCategories(categories as any),
      );
      await refreshMe();
    },
    [refreshMe],
  );

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    try {
      await AuthApi.logout();
    } catch {
      // best-effort — session cleared locally regardless
    }
    await storeToken(null);
    await AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
    setUser(null);
    setStatus("signedOut");
    signingOutRef.current = false;
  }, [setUser, storeToken]);

  const value = useMemo<VendorAuthContextValue>(
    () => ({
      status,
      user,
      loadingAccount,
      signIn,
      signUp,
      continueAsGuest,
      refreshMe,
      updateCategories,
      setUser,
      signOut,
    }),
    [
      status,
      user,
      loadingAccount,
      signIn,
      signUp,
      continueAsGuest,
      refreshMe,
      updateCategories,
      setUser,
      signOut,
    ],
  );

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>;
}

export function useVendorAuth(): VendorAuthContextValue {
  return useContext(VendorAuthContext);
}
