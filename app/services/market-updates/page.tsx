"use client";

import { useState } from "react";
import { Bell, BarChart3, Newspaper, AlertTriangle, TrendingUp, Shield, Clock, Star } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { ServicePricingCard } from "@/components/services/ServicePricingCard";
import { useI18n } from "@/app/i18n/I18nProvider";
import Link from "next/link";

export default function MarketUpdatesPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planKey: string) => {
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ServiceHeader />

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link href="/services" className="text-xs text-muted-foreground hover:text-foreground">{t("services.backToServices")}</Link>
      </div>

      {/* Hero */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full border border-accent/20 mb-4">
          <Bell size={12} /> {t("services.marketUpdates.hero.badge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">{t("services.marketUpdates.hero.title")}</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          {t("services.marketUpdates.hero.subtitle")}
        </p>
      </section>

      {/* What you get */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">{t("services.marketUpdates.how.title")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: BarChart3, label: t("services.marketUpdates.how.item1") },
            { icon: TrendingUp, label: t("services.marketUpdates.how.item2") },
            { icon: Newspaper, label: t("services.marketUpdates.how.item3") },
            { icon: Bell, label: t("services.marketUpdates.how.item4") },
            { icon: AlertTriangle, label: t("services.marketUpdates.how.item5") },
            { icon: Shield, label: t("services.marketUpdates.how.item6") },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <item.icon size={14} className="text-accent shrink-0" />
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sample update preview */}
      <section className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/95 z-10" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Praha 5 — May 2026 Update</h3>
            <span className="text-[9px] text-accent bg-accent/10 px-2 py-0.5 rounded font-medium">Sample</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg rent/m²</span>
              <span className="font-medium text-foreground">385 Kč <span className="text-green-600">↑ +2.4%</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg sale price/m²</span>
              <span className="font-medium text-foreground">96,000 Kč <span className="text-green-600">↑ +1.8%</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active listings</span>
              <span className="font-medium text-foreground">342 <span className="text-red-500">↓ -12%</span></span>
            </div>
            <div className="mt-3 pt-3 border-t border-border blur-[2px] select-none">
              <p className="text-muted-foreground">Market narrative: The rental market in Praha 5 continues to tighten as new supply...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-10">{t("services.marketUpdates.pricing.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ServicePricingCard
              name={t("services.marketUpdates.pricing.basic.name")}
              price={t("services.marketUpdates.pricing.basic.price")}
              period={t("services.marketUpdates.pricing.basic.period")}
              description={t("services.marketUpdates.pricing.basic.desc")}
              features={[
                t("services.marketUpdates.pricing.basic.f1"),
                t("services.marketUpdates.pricing.basic.f2"),
                t("services.marketUpdates.pricing.basic.f3"),
                t("services.marketUpdates.pricing.basic.f4"),
              ]}
              cta={t("services.marketUpdates.pricing.basic.cta")}
              loading={loading === "market_basic"}
              onSelect={() => handleCheckout("market_basic")}
            />
            <ServicePricingCard
              name={t("services.marketUpdates.pricing.pro.name")}
              price={t("services.marketUpdates.pricing.pro.price")}
              period={t("services.marketUpdates.pricing.pro.period")}
              description={t("services.marketUpdates.pricing.pro.desc")}
              badge={t("services.marketUpdates.pricing.pro.badge")}
              highlighted
              features={[
                t("services.marketUpdates.pricing.pro.f1"),
                t("services.marketUpdates.pricing.pro.f2"),
                t("services.marketUpdates.pricing.pro.f3"),
                t("services.marketUpdates.pricing.pro.f4"),
                t("services.marketUpdates.pricing.pro.f5"),
              ]}
              cta={t("services.marketUpdates.pricing.pro.cta")}
              loading={loading === "market_pro"}
              onSelect={() => handleCheckout("market_pro")}
            />
            <ServicePricingCard
              name={t("services.marketUpdates.pricing.enterprise.name")}
              price={t("services.marketUpdates.pricing.enterprise.price")}
              period={t("services.marketUpdates.pricing.enterprise.period")}
              description={t("services.marketUpdates.pricing.enterprise.desc")}
              features={[
                t("services.marketUpdates.pricing.enterprise.f1"),
                t("services.marketUpdates.pricing.enterprise.f2"),
                t("services.marketUpdates.pricing.enterprise.f3"),
                t("services.marketUpdates.pricing.enterprise.f4"),
                t("services.marketUpdates.pricing.enterprise.f5"),
              ]}
              cta={t("services.marketUpdates.pricing.enterprise.cta")}
              loading={loading === "market_enterprise"}
              onSelect={() => handleCheckout("market_enterprise")}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">{t("services.marketUpdates.faq.title")}</h2>
        <div className="space-y-4">
          {[
            { q: t("services.marketUpdates.faq.q1"), a: t("services.marketUpdates.faq.a1") },
            { q: t("services.marketUpdates.faq.q2"), a: t("services.marketUpdates.faq.a2") },
            { q: t("services.marketUpdates.faq.q3"), a: t("services.marketUpdates.faq.a3") },
            { q: t("services.marketUpdates.faq.q4"), a: t("services.marketUpdates.faq.a4") },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-card rounded-xl border border-border p-4">
              <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between text-sm">
                {q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 max-w-3xl mx-auto px-4 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <Shield className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("services.trust.stripe")}</p>
          </div>
          <div>
            <Clock className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("services.trust.fast")}</p>
          </div>
          <div>
            <Star className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("services.trust.expert")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
