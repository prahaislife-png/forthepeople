"use client";

import { useState } from "react";
import { Scale, AlertTriangle, Clock, Wrench, MapPin, CheckCircle, Search, BarChart3, TrendingUp, Loader2, Zap } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { useI18n } from "@/app/i18n/I18nProvider";
import Link from "next/link";
import type { PriceCheckResult, PriceIndicator } from "@/app/lib/services-types";

export default function PriceCheckResultPage() {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    try { new URL(url); } catch { setError("Please enter a valid URL"); return; }

    setError("");
    setLoading(true);
    setProgress("Scraping listing details...");

    try {
      setTimeout(() => setProgress("Fetching comparable listings..."), 4000);
      setTimeout(() => setProgress("Analyzing 18 price factors..."), 8000);
      setTimeout(() => setProgress("Generating full report..."), 12000);

      const res = await fetch("/api/services/price-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), tier: "paid" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed. Please try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const verdictColor = (v: string) => {
    switch (v) {
      case "overpriced": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "underpriced": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "high": return "text-red-600";
      case "medium": return "text-amber-600";
      default: return "text-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ServiceHeader />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">✓</div>
            <span className="text-xs text-accent font-medium">Paid</span>
          </div>
          <div className="w-8 h-px bg-accent" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${result ? "bg-accent text-white" : "bg-accent/20 text-accent"}`}>
              {result ? "✓" : "2"}
            </div>
            <span className="text-xs text-foreground font-medium">Paste URL</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${result ? "bg-accent text-white" : "bg-secondary text-muted-foreground"}`}>3</div>
            <span className="text-xs text-muted-foreground font-medium">Full Report</span>
          </div>
        </div>

        {/* Payment success badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-semibold">
            <CheckCircle size={14} /> Payment successful — full report unlocked
          </div>
        </div>

        {/* URL Input */}
        {!result && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">Paste the listing URL</h2>
            <p className="text-xs text-muted-foreground mb-4">Supported: sreality.cz, bezrealitky.cz, idnes.cz/reality, realitymix.cz, flatzone.cz</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                  placeholder="https://www.sreality.cz/detail/prodej/byt/..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !url}
                className="bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

            {/* Progress */}
            {loading && progress && (
              <div className="mt-4 flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
                <Loader2 size={14} className="animate-spin text-accent" />
                <span className="text-sm text-foreground">{progress}</span>
              </div>
            )}
          </div>
        )}

        {/* Full Results */}
        {result && (
          <div className="space-y-6">
            {/* Verdict Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${verdictColor(result.verdict)}`}>
                    {result.verdict === "overpriced" ? "OVERPRICED" : result.verdict === "underpriced" ? "GOOD DEAL" : "FAIR PRICE"}
                  </span>
                  <span className="text-xs text-muted-foreground">{result.verdictConfidence}% confidence</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {result.listing.title} · {result.listing.rooms} · {result.listing.areaM2} m² · {result.listing.district}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Listed Price</div>
                  <div className="text-lg font-bold text-foreground">{result.listing.priceTotal.toLocaleString()} Kč</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Fair Estimate</div>
                  <div className="text-lg font-bold text-green-600">{result.estimatedFairPrice.toLocaleString()} Kč</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Difference</div>
                  <div className={`text-lg font-bold ${result.priceDifferencePercent > 0 ? "text-red-600" : "text-green-600"}`}>
                    {result.priceDifferencePercent > 0 ? "+" : ""}{result.priceDifferencePercent}%
                  </div>
                </div>
              </div>
            </div>

            {/* All 18 Indicators */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 size={14} className="text-accent" /> All Indicators ({result.indicators.length})
              </h3>
              <div className="space-y-3">
                {result.indicators.map((indicator) => (
                  <IndicatorRow key={indicator.id} indicator={indicator} />
                ))}
              </div>
            </div>

            {/* Comparables */}
            {result.comparables.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Scale size={14} className="text-accent" /> Comparable Listings ({result.comparables.length})
                </h3>
                <div className="space-y-3">
                  {result.comparables.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-xs font-medium text-foreground">{comp.title}</div>
                        <div className="text-[10px] text-muted-foreground">{comp.address} · {comp.areaM2} m²{comp.rooms ? ` · ${comp.rooms}` : ""}</div>
                      </div>
                      <div className="text-sm font-bold text-foreground">{comp.pricePerM2.toLocaleString()} Kč/m²</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* District Averages */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-accent" /> District Market Data
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-muted-foreground">Avg. price/m²</div>
                  <div className="text-sm font-bold text-foreground">{result.districtAverages.avgPriceM2.toLocaleString()} Kč</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Median price/m²</div>
                  <div className="text-sm font-bold text-foreground">{result.districtAverages.medianPriceM2.toLocaleString()} Kč</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Price range</div>
                  <div className="text-sm font-bold text-foreground">{result.districtAverages.priceRange[0].toLocaleString()}–{result.districtAverages.priceRange[1].toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {result.redFlags.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> Red Flags ({result.redFlags.length})
                </h3>
                <div className="space-y-2">
                  {result.redFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                      <span className={`text-xs font-bold mt-0.5 shrink-0 ${severityColor(flag.severity)}`}>
                        {flag.severity === "high" ? "⚠️" : flag.severity === "medium" ? "⚡" : "ℹ️"}
                      </span>
                      <div>
                        <div className="text-xs font-medium text-foreground">{flag.category}</div>
                        <div className="text-[11px] text-muted-foreground">{flag.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investment & Costs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Investment Yield */}
              {result.investmentYield && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" /> Investment Yield
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Gross yield</span>
                      <span className="font-bold text-foreground">{result.investmentYield.grossYield}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Net yield</span>
                      <span className="font-bold text-foreground">{result.investmentYield.netYield}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Est. monthly rent</span>
                      <span className="font-bold text-foreground">{result.investmentYield.monthlyRentEstimate.toLocaleString()} Kč</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Renovation Estimate */}
              {result.renovationEstimate && result.renovationEstimate.needed && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Wrench size={14} className="text-accent" /> Renovation Estimate
                  </h3>
                  <div className="text-lg font-bold text-foreground mb-3">
                    ~{result.renovationEstimate.estimatedCostCZK.toLocaleString()} Kč
                  </div>
                  <div className="space-y-1">
                    {result.renovationEstimate.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1">
                        <span className="text-muted-foreground">{item.item}</span>
                        <span className="font-medium text-foreground">{item.cost.toLocaleString()} Kč</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5-Year TCO */}
            {result.totalCostOfOwnership5yr && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center">
                <h3 className="text-sm font-bold text-foreground mb-1">5-Year Total Cost of Ownership</h3>
                <div className="text-2xl font-black text-foreground">{result.totalCostOfOwnership5yr.toLocaleString()} Kč</div>
                <p className="text-xs text-muted-foreground mt-1">Purchase + renovation + energy + tax + maintenance</p>
              </div>
            )}

            {/* Commute Times */}
            {result.commuteTimes.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-accent" /> Commute Estimates
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {result.commuteTimes.map((ct, i) => (
                    <div key={i} className="bg-background border border-border rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{ct.minutes} min</div>
                      <div className="text-[10px] text-muted-foreground">{ct.destination}</div>
                      <div className="text-[9px] text-accent font-medium uppercase mt-0.5">{ct.mode}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            </div>

            {/* Back */}
            <div className="text-center pt-4">
              <Link href="/services" className="text-sm text-accent hover:underline font-medium">← Back to all services</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IndicatorRow({ indicator }: { indicator: PriceIndicator }) {
  const impactColor = indicator.impact === "positive" ? "text-green-600" :
    indicator.impact === "negative" ? "text-red-600" : "text-muted-foreground";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-b-0">
      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
        indicator.impact === "positive" ? "bg-green-500" :
        indicator.impact === "negative" ? "bg-red-500" : "bg-muted-foreground/40"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{indicator.name}</span>
          <span className={`text-xs font-semibold shrink-0 ${impactColor}`}>{indicator.rawValue}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{indicator.explanation}</p>
      </div>
    </div>
  );
}
