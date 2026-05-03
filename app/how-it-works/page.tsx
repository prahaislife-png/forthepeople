"use client";

import Link from "next/link";
import { MapPin, BarChart3, FileText, CheckCircle, ArrowRight, Shield, Clock, Globe } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function HowItWorksPage() {
  const { t } = useI18n();

  const steps = [
    {
      num: "01",
      icon: MapPin,
      title: t("howItWorks.step1.title"),
      desc: t("howItWorks.step1.desc"),
    },
    {
      num: "02",
      icon: BarChart3,
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
    },
    {
      num: "03",
      icon: Clock,
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
    },
    {
      num: "04",
      icon: FileText,
      title: t("howItWorks.step4.title"),
      desc: t("howItWorks.step4.desc"),
    },
    {
      num: "05",
      icon: CheckCircle,
      title: t("howItWorks.step5.title"),
      desc: t("howItWorks.step5.desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-base font-black text-foreground">Move<span className="text-accent">Prague</span></Link>
          <div className="flex items-center gap-3 text-xs">
            <LanguageSwitcher />
            <Link href="/" className="text-muted-foreground hover:text-foreground">{t("nav.home")}</Link>
            <Link href="/pricing" className="text-accent hover:underline font-semibold">{t("nav.pricing")}</Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">{t("nav.dashboard")}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">{t("howItWorks.hero.title")}</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          {t("howItWorks.hero.subtitle")}
        </p>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={step.num} className="flex gap-6 items-start">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <step.icon className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{step.num}</span>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:block shrink-0 pt-8">
                  <ArrowRight className="h-4 w-4 text-border rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* What's in a report */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-10">{t("howItWorks.report.title")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              t("howItWorks.report.item1"), t("howItWorks.report.item2"), t("howItWorks.report.item3"), t("howItWorks.report.item4"),
              t("howItWorks.report.item5"), t("howItWorks.report.item6"), t("howItWorks.report.item7"), t("howItWorks.report.item8"),
              t("howItWorks.report.item9"), t("howItWorks.report.item10"), t("howItWorks.report.item11"), t("howItWorks.report.item12"),
              t("howItWorks.report.item13"), t("howItWorks.report.item14"), t("howItWorks.report.item15"), t("howItWorks.report.item16"),
              t("howItWorks.report.item17"), t("howItWorks.report.item18"), t("howItWorks.report.item19"), t("howItWorks.report.item20"),
              t("howItWorks.report.item21"), t("howItWorks.report.item22"), t("howItWorks.report.item23"), t("howItWorks.report.item24"),
              t("howItWorks.report.item25"), t("howItWorks.report.item26"), t("howItWorks.report.item27"), t("howItWorks.report.item28"),
              t("howItWorks.report.item29"), t("howItWorks.report.item30"), t("howItWorks.report.item31"),
              t("howItWorks.report.item32"), t("howItWorks.report.item33"), t("howItWorks.report.item34"),
              t("howItWorks.report.item35"), t("howItWorks.report.item36"), t("howItWorks.report.item37"),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-foreground p-2 rounded-lg bg-background border border-border">
                <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process highlights */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-extrabold text-foreground text-center mb-3">{t("howItWorks.different.title")}</h2>
        <p className="text-center text-muted-foreground mb-10 text-sm">{t("howItWorks.different.subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <Shield className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm">{t("howItWorks.different.verified.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("howItWorks.different.verified.desc")}</p>
          </div>
          <div>
            <Clock className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm">{t("howItWorks.different.expert.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("howItWorks.different.expert.desc")}</p>
          </div>
          <div>
            <Globe className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm">{t("howItWorks.different.bilingual.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("howItWorks.different.bilingual.desc")}</p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-card border-y border-border py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-foreground italic text-lg leading-relaxed">"{t("howItWorks.testimonial.text")}"</p>
          <div className="mt-4 text-sm text-muted-foreground">— {t("howItWorks.testimonial.author")}</div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-extrabold text-foreground mb-4">{t("howItWorks.cta.title")}</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/report/7" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-accent/25">
            {t("howItWorks.cta.demo")}
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 text-foreground border border-border hover:border-accent px-6 py-3 rounded-lg transition-colors">
            {t("howItWorks.cta.plans")}
          </Link>
        </div>
      </section>
    </div>
  );
}
