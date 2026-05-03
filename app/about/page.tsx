"use client";

import Link from "next/link";
import { MapPin, Users, Shield, Heart } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-base font-black text-foreground">Move<span className="text-accent">Prague</span></Link>
          <div className="flex items-center gap-3 text-xs">
            <LanguageSwitcher />
            <Link href="/" className="text-muted-foreground hover:text-foreground">{t("nav.home")}</Link>
            <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">{t("nav.howItWorks")}</Link>
            <Link href="/pricing" className="text-accent hover:underline font-semibold">{t("nav.pricing")}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 max-w-3xl mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">{t("about.hero.title")}</h1>
        <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
          {t("about.hero.subtitle")}
        </p>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="prose prose-sm text-foreground space-y-6">
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">{t("about.problem.title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("about.problem.p1")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              {t("about.problem.p2")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              {t("about.problem.p3")}
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-10">{t("about.values.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { icon: Shield, title: t("about.values.verified.title"), desc: t("about.values.verified.desc") },
              { icon: Users, title: t("about.values.decisions.title"), desc: t("about.values.decisions.desc") },
              { icon: MapPin, title: t("about.values.local.title"), desc: t("about.values.local.desc") },
              { icon: Heart, title: t("about.values.transparent.title"), desc: t("about.values.transparent.desc") },
            ].map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <v.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{v.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "37", label: t("about.stats.categories") },
            { num: "22", label: t("about.stats.districts") },
            { num: "2,400+", label: t("about.stats.reports") },
            { num: "24h", label: t("about.stats.delivery") },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-accent">{s.num}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-card border-y border-border py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">{t("about.contact.title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t("about.contact.desc")}
          </p>
          <a href="mailto:hello@moveprague.cz" className="text-accent font-semibold hover:underline">hello@moveprague.cz</a>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>{t("about.contact.location")}</span>
            <span>•</span>
            <span>{t("about.contact.established")}</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <Link href="/report/7" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-accent/25">
          {t("about.cta.button")}
        </Link>
      </section>
    </div>
  );
}
