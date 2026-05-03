"use client";

import { useI18n } from "@/app/i18n/I18nProvider";
import type { Locale } from "@/app/i18n/translations";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative flex items-center bg-secondary rounded-full p-0.5 gap-0.5">
      <button
        onClick={() => setLocale("en")}
        className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
          locale === "en"
            ? "bg-foreground text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("cs")}
        className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
          locale === "cs"
            ? "bg-foreground text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        CZ
      </button>
    </div>
  );
}
