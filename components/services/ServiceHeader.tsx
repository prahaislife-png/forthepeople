"use client";

import Link from "next/link";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function ServiceHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <Link href="/" className="text-base font-black text-foreground">Move<span className="text-accent">Prague</span></Link>
        <div className="flex items-center gap-3 text-xs">
          <LanguageSwitcher />
          <Link href="/" className="text-muted-foreground hover:text-foreground">{t("nav.home")}</Link>
          <Link href="/services" className="text-accent hover:underline font-semibold">{t("nav.services")}</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">{t("nav.pricing")}</Link>
        </div>
      </div>
    </header>
  );
}
