import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type Mode = "light" | "dark" | "system";

export interface ThemeColors {
  mode: "light" | "dark";
  primary: string;
  primaryDark: string;
  onPrimary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  backdrop: string;
  success: string;
  warning: string;
  danger: string;
  skeleton: string;
  tabBar: string;
  chipBg: string;
}

const brand = {
  primary: "#E11D48",
  primaryDark: "#BE123C",
  secondary: "#2B2D42",
};

const light: ThemeColors = {
  mode: "light",
  primary: brand.primary,
  primaryDark: brand.primaryDark,
  onPrimary: "#FFFFFF",
  secondary: brand.secondary,
  background: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F3F6",
  border: "#E9ECEF",
  text: "#1A1A1A",
  textMuted: "#6C757D",
  backdrop: "rgba(15,18,25,0.45)",
  success: "#0E9F6E",
  warning: "#D97706",
  danger: "#DC2626",
  skeleton: "#E7EAEF",
  tabBar: "#FFFFFF",
  chipBg: "#F4F6F8",
};

const dark: ThemeColors = {
  mode: "dark",
  primary: "#FB5B7E",
  primaryDark: "#E11D48",
  onPrimary: "#FFFFFF",
  secondary: "#C9CDDA",
  background: "#0E1117",
  surface: "#161B24",
  surfaceAlt: "#1E2530",
  border: "#262E3B",
  text: "#F3F5F9",
  textMuted: "#98A2B3",
  backdrop: "rgba(0,0,0,0.6)",
  success: "#2BD596",
  warning: "#F5A623",
  danger: "#F87171",
  skeleton: "#222B37",
  tabBar: "#10151D",
  chipBg: "#222B37",
};

interface ThemeCtx {
  colors: ThemeColors;
  mode: Mode;
  setMode: (m: Mode) => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx>({ colors: light, mode: "system", setMode: () => {}, isDark: false });
const KEY = "kop_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === "light" || v === "dark" || v === "system") setModeState(v);
    }).catch(() => {});
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  };

  const isDark = mode === "system" ? system === "dark" : mode === "dark";
  const value = useMemo(
    () => ({ colors: isDark ? dark : light, mode, setMode, isDark }),
    [isDark, mode]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
