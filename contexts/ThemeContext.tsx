"use client";

import React, { createContext, useCallback, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  const setMode = useCallback((value: ThemeMode) => {
    setModeState(value);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = value;
    }
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, [setMode]);

  const value = useMemo(
    () => ({
      mode,
      toggle,
      setMode,
    }),
    [mode, toggle, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

