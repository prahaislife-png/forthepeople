"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, Building2, AlertTriangle, PieChart, FileText, Shield, Clock, Star } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { ServicePricingCard } from "@/components/services/ServicePricingCard";
import { useI18n } from "@/app/i18n/I18nProvider";
import Link from "next/link";

export default function InvestmentPage() {
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
          <TrendingUp size={12} /> {t("services.investment.hero.badge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">{t("services.investment.hero.title")}</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          {t("services.investment.hero.subtitle")}
        </p>
      </section>

      {/* What's Included */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">{t("services.investment.how.title")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: BarChart3, label: t("services.investment.how.item1") },
            { icon: PieChart, label: t("services.investment.how.item2") },
            { icon: TrendingUp, label: t("services.investment.how.item3") },
            { icon: Building2, label: t("services.investment.how.item4") },
            { icon: AlertTriangle, label: t("services.investment.how.item5") },
            { icon: PieChart, label: t("services.investment.how.item6") },
            { icon: FileText, label: t("services.investment.how.item7") },
            { icon: Shield, label: t("services.investment.how.item8") },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <item.icon size={14} className="text-accent shrink-0" />
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-10">{t("services.investment.pricing.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServicePricingCard
              name={t("services.investment.pricing.standard.name")}
              price={t("services.investment.pricing.standard.price")}
              description={t("services.investment.pricing.standard.desc")}
              features={[
                t("services.investment.pricing.standard.f1"),
                t("services.investment.pricing.standard.f2"),
                t("services.investment.pricing.standard.f3"),
                t("services.investment.pricing.standard.f4"),
                t("services.investment.pricing.standard.f5"),
              ]}
              cta={t("services.investment.pricing.standard.cta")}
              loading={loading === "investment_standard"}
              onSelect={() => handleCheckout("investment_standard")}
            />
            <ServicePricingCard
              name={t("services.investment.pricing.premium.name")}
              price={t("services.investment.pricing.premium.price")}
              description={t("services.investment.pricing.premium.desc")}
              badge={t("services.investment.pricing.premium.badge")}
              highlighted
              features={[
                t("services.investment.pricing.premium.f1"),
                t("services.investment.pricing.premium.f2"),
                t("services.investment.pricing.premium.f3"),
                t("services.investment.pricing.premium.f4"),
                t("services.investment.pricing.premium.f5"),
                t("services.investment.pricing.premium.f6"),
              ]}
              cta={t("services.investment.pricing.premium.cta")}
              loading={loading === "investment_premium"}
              onSelect={() => handleCheckout("investment_premium")}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">{t("services.investment.faq.title")}</h2>
        <div className="space-y-4">
          {[
            { q: t("services.investment.faq.q1"), a: t("services.investment.faq.a1") },
            { q: t("services.investment.faq.q2"), a: t("services.investment.faq.a2") },
            { q: t("services.investment.faq.q3"), a: t("services.investment.faq.a3") },
            { q: t("services.investment.faq.q4"), a: t("services.investment.faq.a4") },
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
