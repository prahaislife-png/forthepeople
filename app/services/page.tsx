"use client";

import { Scale, TrendingUp, Bell, Shield, Clock, Sparkles, CreditCard } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { ServiceCard } from "@/components/services/ServiceCard";
import { useI18n } from "@/app/i18n/I18nProvider";
import Link from "next/link";

export default function ServicesPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <ServiceHeader />

      {/* Hero */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full border border-accent/20 mb-4">
          <Sparkles size={12} /> {t("services.hub.badge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">{t("services.hub.title")}</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          {t("services.hub.subtitle")}
        </p>
      </section>

      {/* Service Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ServiceCard
            title={t("services.card.priceCheck.title")}
            description={t("services.card.priceCheck.desc")}
            price={t("services.card.priceCheck.price")}
            cta={t("services.card.priceCheck.cta")}
            href="/services/price-check"
            icon={Scale}
          />
          <ServiceCard
            title={t("services.card.investment.title")}
            description={t("services.card.investment.desc")}
            price={t("services.card.investment.price")}
            cta={t("services.card.investment.cta")}
            href="/services/investment"
            icon={TrendingUp}
            highlighted
          />
          <ServiceCard
            title={t("services.card.marketUpdates.title")}
            description={t("services.card.marketUpdates.desc")}
            price={t("services.card.marketUpdates.price")}
            cta={t("services.card.marketUpdates.cta")}
            href="/services/market-updates"
            icon={Bell}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-10">{t("services.hub.howTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-extrabold text-accent">1</span>
              </div>
              <h3 className="font-bold text-foreground text-sm">{t("services.hub.step1")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t("services.hub.step1Desc")}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-extrabold text-accent">2</span>
              </div>
              <h3 className="font-bold text-foreground text-sm">{t("services.hub.step2")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t("services.hub.step2Desc")}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-extrabold text-accent">3</span>
              </div>
              <h3 className="font-bold text-foreground text-sm">{t("services.hub.step3")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t("services.hub.step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <CreditCard className="h-7 w-7 text-accent mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-sm">{t("services.trust.stripe")}</h3>
          </div>
          <div>
            <Shield className="h-7 w-7 text-accent mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-sm">{t("services.trust.expert")}</h3>
          </div>
          <div>
            <Clock className="h-7 w-7 text-accent mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-sm">{t("services.trust.fast")}</h3>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center border-t border-border">
        <p className="text-sm text-muted-foreground mb-4">Also check out our comprehensive district reports</p>
        <Link href="/pricing" className="inline-flex items-center gap-2 text-foreground border border-border hover:border-accent px-6 py-3 rounded-lg transition-colors text-sm font-semibold">
          View District Report Pricing →
        </Link>
      </section>
    </div>
  );
}
