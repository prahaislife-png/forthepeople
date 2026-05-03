"use client";

import { Check, Sparkles, Shield, Clock, Star } from "lucide-react";
import { useSubscription } from "@/app/hooks/useSubscription";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PricingPage() {
  const { plan } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const { t } = useI18n();

  const tiers = [
    {
      key: "free" as const,
      name: t("pricing.tier.free.name"),
      price: "0",
      period: "",
      description: t("pricing.tier.free.description"),
      features: [
        t("pricing.tier.free.feature1"),
        t("pricing.tier.free.feature2"),
        t("pricing.tier.free.feature3"),
        t("pricing.tier.free.feature4"),
      ],
      cta: t("pricing.tier.free.cta"),
      highlighted: false,
    },
    {
      key: "single_report" as const,
      name: t("pricing.tier.single.name"),
      price: "799",
      originalPrice: "1 140",
      period: t("pricing.tier.single.period"),
      description: t("pricing.tier.single.description"),
      badge: t("pricing.tier.single.badge"),
      features: [
        t("pricing.tier.single.feature1"),
        t("pricing.tier.single.feature2"),
        t("pricing.tier.single.feature3"),
        t("pricing.tier.single.feature4"),
        t("pricing.tier.single.feature5"),
        t("pricing.tier.single.feature6"),
        t("pricing.tier.single.feature7"),
      ],
      cta: t("pricing.tier.single.cta"),
      highlighted: false,
    },
    {
      key: "explorer" as const,
      name: t("pricing.tier.explorer.name"),
      price: "1 500",
      period: t("pricing.tier.explorer.period"),
      description: t("pricing.tier.explorer.description"),
      features: [
        t("pricing.tier.explorer.feature1"),
        t("pricing.tier.explorer.feature2"),
        t("pricing.tier.explorer.feature3"),
        t("pricing.tier.explorer.feature4"),
        t("pricing.tier.explorer.feature5"),
        t("pricing.tier.explorer.feature6"),
        t("pricing.tier.explorer.feature7"),
      ],
      cta: t("pricing.tier.explorer.cta"),
      highlighted: true,
      badge: t("pricing.tier.explorer.badge"),
    },
    {
      key: "pro" as const,
      name: t("pricing.tier.pro.name"),
      price: "2 500",
      period: t("pricing.tier.pro.period"),
      description: t("pricing.tier.pro.description"),
      features: [
        t("pricing.tier.pro.feature1"),
        t("pricing.tier.pro.feature2"),
        t("pricing.tier.pro.feature3"),
        t("pricing.tier.pro.feature4"),
        t("pricing.tier.pro.feature5"),
        t("pricing.tier.pro.feature6"),
        t("pricing.tier.pro.feature7"),
      ],
      cta: t("pricing.tier.pro.cta"),
      highlighted: false,
    },
  ];

  const handleCheckout = async (planKey: string) => {
    if (planKey === "free") {
      window.location.href = "/";
      return;
    }

    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
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
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

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
            <Link href="/dashboard" className="text-accent hover:underline font-semibold">{t("nav.dashboard")}</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full border border-accent/20 mb-4">
            <Sparkles size={12} /> {t("pricing.hero.badge")}
          </div>
          <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">
            {t("pricing.hero.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.hero.subtitle")}
          </p>
        </div>

        {/* Reviews on top */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { text: t("pricing.review1.text"), name: t("pricing.review1.name"), role: t("pricing.review1.role"), stars: 5 },
            { text: t("pricing.review2.text"), name: t("pricing.review2.name"), role: t("pricing.review2.role"), stars: 5 },
            { text: t("pricing.review3.text"), name: t("pricing.review3.name"), role: t("pricing.review3.role"), stars: 5 },
            { text: t("pricing.review4.text"), name: t("pricing.review4.name"), role: t("pricing.review4.role"), stars: 5 },
          ].map((review) => (
            <div key={review.name} className="bg-card border border-border rounded-xl p-4">
              <div className="flex gap-0.5 mb-1.5">{Array.from({length: review.stars}).map((_, i) => <Star key={i} size={11} className="text-accent fill-accent" />)}</div>
              <p className="text-xs text-foreground italic leading-relaxed">"{review.text}"</p>
              <div className="mt-2 text-[10px] text-muted-foreground font-medium">— {review.name}, {review.role}</div>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`relative rounded-2xl p-6 flex flex-col ${
                tier.highlighted
                  ? "bg-accent/10 border-2 border-accent shadow-lg shadow-accent/5"
                  : "bg-card border border-border"
              }`}
            >
              {tier.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full ${tier.key === "single_report" ? "bg-red-500" : "bg-accent"}`}>
                  {tier.badge}
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">Kč{tier.period}</span>
                </div>
                {"originalPrice" in tier && tier.originalPrice && (
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground line-through">{tier.originalPrice} Kč</span>
                    <span className="ml-2 text-xs font-bold text-red-500">{t("pricing.save30")}</span>
                  </div>
                )}
              </div>

              <ul className="flex-1 space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier.key)}
                disabled={loading !== null || (plan === tier.key)}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                  tier.highlighted
                    ? "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25"
                    : plan === tier.key
                    ? "bg-secondary text-muted-foreground cursor-default"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                } disabled:opacity-50`}
              >
                {plan === tier.key ? t("pricing.currentPlan") : loading === tier.key ? t("pricing.loading") : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <Shield className="h-7 w-7 text-accent mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-sm">{t("pricing.trust.secure.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("pricing.trust.secure.desc")}</p>
          </div>
          <div className="text-center">
            <Clock className="h-7 w-7 text-accent mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-sm">{t("pricing.trust.expert.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("pricing.trust.expert.desc")}</p>
          </div>
          <div className="text-center">
            <Star className="h-7 w-7 text-accent mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-sm">{t("pricing.trust.clients.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("pricing.trust.clients.desc")}</p>
          </div>
        </div>

        {/* Why Move Prague */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-3">
            {t("pricing.why.title")}
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t("pricing.why.subtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: "37", label: t("pricing.why.stat1.label"), desc: t("pricing.why.stat1.desc") },
              { stat: "22", label: t("pricing.why.stat2.label"), desc: t("pricing.why.stat2.desc") },
              { stat: "24h", label: t("pricing.why.stat3.label"), desc: t("pricing.why.stat3.desc") },
            ].map((item) => (
              <div key={item.label} className="text-center p-6 bg-card border border-border rounded-xl">
                <div className="text-3xl font-extrabold text-accent">{item.stat}</div>
                <div className="text-sm font-bold text-foreground mt-1">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-2">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* More Testimonials */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">
            {t("pricing.testimonials.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { text: t("pricing.testimonial1.text"), name: t("pricing.testimonial1.name"), role: t("pricing.testimonial1.role") },
              { text: t("pricing.testimonial2.text"), name: t("pricing.testimonial2.name"), role: t("pricing.testimonial2.role") },
              { text: t("pricing.testimonial3.text"), name: t("pricing.testimonial3.name"), role: t("pricing.testimonial3.role") },
              { text: t("pricing.testimonial4.text"), name: t("pricing.testimonial4.name"), role: t("pricing.testimonial4.role") },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm text-foreground italic leading-relaxed">"{testimonial.text}"</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">{testimonial.name[0]}</div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-[10px] text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">
            {t("pricing.faq.title")}
          </h2>
          <div className="space-y-4">
            {[
              { q: t("pricing.faq.q1"), a: t("pricing.faq.a1") },
              { q: t("pricing.faq.q2"), a: t("pricing.faq.a2") },
              { q: t("pricing.faq.q3"), a: t("pricing.faq.a3") },
              { q: t("pricing.faq.q4"), a: t("pricing.faq.a4") },
              { q: t("pricing.faq.q5"), a: t("pricing.faq.a5") },
              { q: t("pricing.faq.q6"), a: t("pricing.faq.a6") },
              { q: t("pricing.faq.q7"), a: t("pricing.faq.a7") },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-card rounded-xl border border-border p-4">
                <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <Link href="/report/7" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-accent/25">
            {t("pricing.finalCta.button")}
          </Link>
          <p className="text-xs text-muted-foreground mt-3">{t("pricing.finalCta.sub")}</p>
        </div>
      </div>
    </div>
  );
}
