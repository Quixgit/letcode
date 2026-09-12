"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "lecode-admin-theme";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggle: () => {},
  setMode: () => {},
});

function applyTheme(mode: ThemeMode) {
  if (mode === "dark") {
    document.documentElement.setAttribute("data-md-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-md-theme");
  }
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored === "dark" || stored === "light" ? stored : "light";
    setModeState(initial);
    applyTheme(initial);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const toggle = () => setMode(mode === "dark" ? "light" : "dark");

  return <ThemeContext.Provider value={{ mode, toggle, setMode }}>{children}</ThemeContext.Provider>;
}

export function useAdminTheme() {
  return useContext(ThemeContext);
}
