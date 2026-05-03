"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { translations, type Locale } from "@/app/i18n/translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("mp-locale") as Locale | null;
    if (stored && (stored === "en" || stored === "cs")) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("mp-locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string) => {
    return translations[locale][key] || translations["en"][key] || key;
  }, [locale]);

  return (
    <I18nContext value={{ locale, setLocale, t }}>
      {children}
    </I18nContext>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
