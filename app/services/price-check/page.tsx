"use client";

import { useState } from "react";
import { Scale, Search, BarChart3, CheckCircle, Shield, Clock, Star, Lock, ArrowRight, Loader2, TrendingUp, Home, AlertTriangle } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { ServicePricingCard } from "@/components/services/ServicePricingCard";
import { useI18n } from "@/app/i18n/I18nProvider";
import type { PriceCheckResult, PriceIndicator } from "@/app/lib/services-types";
import Link from "next/link";

export default function PriceCheckPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [error, setError] = useState("");

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

  const handleFreeAnalysis = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setError("");
    setResult(null);
    setProgress("Fetching listing details...");

    try {
      // Simulate progress steps
      setTimeout(() => setProgress("Analyzing district data..."), 3000);
      setTimeout(() => setProgress("Computing fair price estimate..."), 6000);
      setTimeout(() => setProgress("Generating indicators..."), 9000);

      const res = await fetch("/api/services/price-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), tier: "free" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ServiceHeader />

      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link href="/services" className="text-xs text-muted-foreground hover:text-foreground">{t("services.backToServices")}</Link>
      </div>

      {/* Hero with Free URL Input */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full border border-accent/20 mb-4">
            <Scale size={12} /> Price Fairness Check
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight">
            Not sure if that apartment<br className="hidden sm:block" /> is worth it?
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
            Paste any Czech real estate listing and we&apos;ll tell you if the price is fair,
            overpriced, or a bargain. Get 4 key indicators free — no account needed.
          </p>
        </div>

        {/* URL Input */}
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleFreeAnalysis(); }}
                placeholder="Paste listing URL (sreality.cz, bezrealitky.cz, ...)"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                disabled={analyzing}
              />
            </div>
            <button
              onClick={handleFreeAnalysis}
              disabled={analyzing || !url.trim()}
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md text-sm whitespace-nowrap"
            >
              {analyzing ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              {analyzing ? "Analyzing..." : "Check Price"}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span>Supported: sreality.cz, bezrealitky.cz, idnes.cz/reality, realitymix.cz</span>
          </div>

          {/* Progress */}
          {analyzing && progress && (
            <div className="mt-4 flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
              <Loader2 size={14} className="animate-spin text-accent" />
              <span className="text-sm text-foreground">{progress}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-red-600 shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* Free Result */}
      {result && (
        <section className="max-w-3xl mx-auto px-4 pb-12">
          {/* Verdict Card */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  result.verdict === "overpriced" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                  result.verdict === "underpriced" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                  "bg-blue-500/10 text-blue-600 border-blue-500/20"
                }`}>
                  {result.verdict === "overpriced" ? "OVERPRICED" : result.verdict === "underpriced" ? "GOOD DEAL" : "FAIR PRICE"}
                </span>
                <span className="text-xs text-muted-foreground">{result.verdictConfidence}% confidence</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {result.listing.rooms} · {result.listing.areaM2} m² · {result.listing.district}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Listed Price</div>
                <div className="text-lg font-bold text-foreground">{result.listing.priceTotal.toLocaleString()} Kč</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Fair Estimate</div>
                <div className={`text-lg font-bold ${result.verdict === "overpriced" ? "text-green-600" : "text-foreground"}`}>
                  {result.estimatedFairPrice.toLocaleString()} Kč
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Difference</div>
                <div className={`text-lg font-bold ${result.priceDifferencePercent > 0 ? "text-red-600" : "text-green-600"}`}>
                  {result.priceDifferencePercent > 0 ? "+" : ""}{result.priceDifferencePercent}%
                </div>
              </div>
            </div>

            {/* Free Indicators */}
            <div className="space-y-3">
              {result.freeIndicators.map((indicator) => (
                <IndicatorRow key={indicator.id} indicator={indicator} />
              ))}
            </div>
          </div>

          {/* Locked Paid Indicators */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card z-10 pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <Lock size={14} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">14 more indicators available</h3>
            </div>
            <div className="space-y-3 blur-[3px] select-none">
              {result.paidIndicators.slice(0, 5).map((indicator) => (
                <IndicatorRow key={indicator.id} indicator={indicator} locked />
              ))}
            </div>

            {/* Unlock CTA */}
            <div className="relative z-20 mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Unlock comparable listings, noise & air quality scores, renovation estimates, investment yield, and more.
              </p>
              <button
                onClick={() => handleCheckout("price_check_basic")}
                disabled={loading === "price_check_basic"}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
              >
                {loading === "price_check_basic" ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                Unlock Full Report — 299 Kč
              </button>
            </div>
          </div>
        </section>
      )}

      {/* How it works (shown when no result) */}
      {!result && (
        <>
          {/* What you get */}
          <section className="bg-card border-y border-border py-14">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl font-extrabold text-foreground text-center mb-3">What you&apos;ll get</h2>
              <p className="text-center text-muted-foreground text-sm mb-10">18 data-driven indicators analyzed from your listing</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <FeatureCard icon={TrendingUp} title="Fair Price Estimate" desc="Hedonic model compares to 6+ market factors" free />
                <FeatureCard icon={BarChart3} title="Price vs. District Avg" desc="How the listing compares to local averages" free />
                <FeatureCard icon={AlertTriangle} title="Red Flags" desc="Building age, condition, urgency signals" free />
                <FeatureCard icon={Home} title="Comparable Listings" desc="5-10 similar properties in the same area" />
                <FeatureCard icon={Scale} title="Renovation Estimate" desc="Bathroom, kitchen, flooring cost breakdown" />
                <FeatureCard icon={Shield} title="Crime & Safety Score" desc="District crime rates vs. city average" />
              </div>

              <div className="text-center mt-8">
                <span className="text-xs text-muted-foreground">+ 12 more indicators: noise, air quality, transit, schools, energy costs, investment yield, 5-year TCO...</span>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-14 max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-extrabold text-foreground text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold text-foreground text-sm">1. Paste a listing URL</h3>
                <p className="text-xs text-muted-foreground mt-1">From sreality.cz, bezrealitky.cz, or any Czech real estate site</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold text-foreground text-sm">2. We analyze everything</h3>
                <p className="text-xs text-muted-foreground mt-1">Price, district data, noise, air quality, crime, transit — 18 factors total</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold text-foreground text-sm">3. Get a clear verdict</h3>
                <p className="text-xs text-muted-foreground mt-1">Fair, overpriced, or a bargain — with confidence % and detailed breakdown</p>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-card border-y border-border py-14">
            <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-2xl font-extrabold text-foreground text-center mb-2">Choose your depth</h2>
              <p className="text-center text-muted-foreground text-sm mb-10">Free gets you started. Paid gives you the full picture.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ServicePricingCard
                  name="Quick Check"
                  price="Free"
                  description="Instant verdict based on district averages"
                  features={[
                    "Price vs. district average",
                    "Fair/overpriced/underpriced verdict",
                    "Estimated fair price",
                    "Top red flag (if any)",
                  ]}
                  cta="Already included above ↑"
                  loading={false}
                  onSelect={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                />
                <ServicePricingCard
                  name="Full Report"
                  price="299 Kč"
                  description="Complete analysis with comparables & projections"
                  badge="Most Popular"
                  highlighted
                  features={[
                    "All 18 indicators unlocked",
                    "5-10 comparable listings",
                    "Renovation cost estimate",
                    "Noise, air quality & crime scores",
                    "Investment yield calculation",
                    "5-year total cost projection",
                  ]}
                  cta="Get Full Report"
                  loading={loading === "price_check_basic"}
                  onSelect={() => handleCheckout("price_check_basic")}
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* FAQ */}
      <section className="py-14 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            { q: "Which websites are supported?", a: "We support sreality.cz, bezrealitky.cz, idnes.cz/reality, realitymix.cz, and flatzone.cz. If your site isn't supported, you can provide the details manually." },
            { q: "How accurate is the fair price estimate?", a: "Our hedonic model uses 8+ factors including district averages, building type, floor, condition, and environmental data. It's typically within 10-15% of actual transaction prices." },
            { q: "Do I need to create an account?", a: "No! The free check (4 indicators) works instantly without any sign-up. You only pay if you want the full 18-indicator report." },
            { q: "How long does the analysis take?", a: "The free check takes 5-15 seconds (we need to fetch the listing page). The full report may take up to 30 seconds as we also search for comparable listings." },
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
      <section className="py-10 max-w-3xl mx-auto px-4 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <Shield className="h-5 w-5 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Secure payments via Stripe</p>
          </div>
          <div>
            <Clock className="h-5 w-5 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Results in under 30 seconds</p>
          </div>
          <div>
            <Star className="h-5 w-5 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Based on real district data</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Helper Components ---

function IndicatorRow({ indicator, locked }: { indicator: PriceIndicator; locked?: boolean }) {
  const impactColor = indicator.impact === "positive" ? "text-green-600" :
    indicator.impact === "negative" ? "text-red-600" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        indicator.impact === "positive" ? "bg-green-500" :
        indicator.impact === "negative" ? "bg-red-500" : "bg-muted-foreground/40"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">{indicator.name}</span>
          <span className={`text-xs font-semibold shrink-0 ${impactColor}`}>{indicator.rawValue}</span>
        </div>
        {!locked && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{indicator.explanation}</p>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, free }: { icon: React.ElementType; title: string; desc: string; free?: boolean }) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon size={16} className="text-accent" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {free && <span className="text-[9px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">FREE</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
