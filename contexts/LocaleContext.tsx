"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "fa";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const LocaleContext = createContext<LocaleContextValue | undefined>(
  undefined,
);

interface LocaleProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "baby-tracker-locale";

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as Locale | null)
        : null;
    if (stored === "en" || stored === "fa") {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    document.body.dataset.locale = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === "en" ? "fa" : "en"));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

