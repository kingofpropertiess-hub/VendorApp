/**
 * Active business-category context.
 *
 * A vendor may be authorized for multiple categories (the backend
 * `categories[]` array supports all four). This context tracks which
 * category the vendor is currently operating in; navigation adapts to it.
 * The selection persists locally and self-corrects if permissions change.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorizedCategories } from "./categories";
import type { VendorCategory, VendorUser } from "../lib/types";

interface ActiveCategoryValue {
  category: VendorCategory;
  setCategory: (c: VendorCategory) => void;
}

const Ctx = createContext<ActiveCategoryValue>(null as any);
const KEY = "kopv_active_category";

export function ActiveCategoryProvider({
  user,
  children,
}: {
  user: VendorUser | null;
  children: React.ReactNode;
}) {
  const [category, setCategoryState] = useState<VendorCategory>("HOTEL_VILLA");

  // Choose the persisted category if still authorized; else the first
  // authorized one (permission revoked / changed handling).
  useEffect(() => {
    if (!user) return;
    (async () => {
      let stored: string | null = null;
      try {
        stored = await AsyncStorage.getItem(KEY);
      } catch {
        stored = null;
      }
      const allowed = authorizedCategories(user);
      if (allowed.length === 0) return;
      const pick = allowed.find((c) => c === stored) ?? allowed[0];
      setCategoryState(pick);
    })();
  }, [user]);

  const setCategory = useCallback((c: VendorCategory) => {
    setCategoryState(c);
    AsyncStorage.setItem(KEY, c).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ category, setCategory }), [category, setCategory]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveCategory(): ActiveCategoryValue {
  return useContext(Ctx);
}
