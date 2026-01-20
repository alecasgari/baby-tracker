export type Locale = "en" | "fa";

export type TranslationKey = "home" | "reports" | "settings" | "dashboardTitle";

export const defaultLocale: Locale = "en";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    home: "Home",
    reports: "Reports",
    settings: "Settings",
    dashboardTitle: "Baby Tracker",
  },
  fa: {
    home: "خانه",
    reports: "گزارش‌ها",
    settings: "تنظیمات",
    dashboardTitle: "ردیاب نوزاد",
  },
};

export function t(locale: Locale, key: TranslationKey) {
  return translations[locale][key];
}

