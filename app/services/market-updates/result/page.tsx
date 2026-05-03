"use client";

import { useState } from "react";
import { Bell, CheckCircle, TrendingUp, TrendingDown, Newspaper, AlertTriangle } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { useI18n } from "@/app/i18n/I18nProvider";
import { DISTRICTS } from "@/app/data/districts";
import Link from "next/link";
import type { MarketUpdate, MarketUpdatePreferences } from "@/app/lib/services-types";

export default function MarketUpdatesResultPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<"preferences" | "dashboard">("preferences");
  const [email, setEmail] = useState("");
  const [selectedDistricts, setSelectedDistricts] = useState<number[]>([]);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [categories, setCategories] = useState<string[]>(["price", "supply"]);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<MarketUpdate | null>(null);

  const toggleDistrict = (id: number) => {
    setSelectedDistricts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async () => {
    if (!email || selectedDistricts.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/services/market-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          districts: selectedDistricts,
          frequency,
          categories,
        }),
      });
      const data = await res.json();
      setDashboard(data.sampleUpdate);
      setStep("dashboard");
    } catch {
      alert("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ServiceHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">✓</div>
            <span className="text-xs text-accent font-medium">Subscribed</span>
          </div>
          <div className="w-8 h-px bg-accent" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "dashboard" ? "bg-accent text-white" : "bg-accent/20 text-accent"}`}>
              {step === "dashboard" ? "✓" : "2"}
            </div>
            <span className="text-xs text-foreground font-medium">Preferences</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "dashboard" ? "bg-accent text-white" : "bg-secondary text-muted-foreground"}`}>3</div>
            <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
          </div>
        </div>

        {/* Payment badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-semibold">
            <CheckCircle size={14} /> {t("services.payment.success")}
          </div>
        </div>

        {/* Preferences Form */}
        {step === "preferences" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground">{t("services.marketUpdates.result.title")}</h2>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">{t("services.marketUpdates.result.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("services.marketUpdates.result.emailPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Districts */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">{t("services.marketUpdates.result.districts")}</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {DISTRICTS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => toggleDistrict(d.id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedDistricts.includes(d.id) ? "bg-accent text-white" : "bg-secondary text-foreground hover:bg-accent/10"}`}
                  >
                    P{d.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">{t("services.marketUpdates.result.categories")}</label>
              <div className="flex flex-wrap gap-2">
                {(["price", "supply", "development", "regulation"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categories.includes(cat) ? "bg-accent text-white" : "bg-secondary text-foreground hover:bg-accent/10"}`}
                  >
                    {t(`services.marketUpdates.dashboard.cat.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">{t("services.marketUpdates.result.frequency")}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFrequency("weekly")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium ${frequency === "weekly" ? "bg-accent text-white" : "bg-secondary text-foreground"}`}
                >
                  {t("services.marketUpdates.result.weekly")}
                </button>
                <button
                  onClick={() => setFrequency("monthly")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium ${frequency === "monthly" ? "bg-accent text-white" : "bg-secondary text-foreground"}`}
                >
                  {t("services.marketUpdates.result.monthly")}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !email || selectedDistricts.length === 0}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? t("services.marketUpdates.result.saving") : t("services.marketUpdates.result.submit")}
            </button>
          </div>
        )}

        {/* Dashboard */}
        {step === "dashboard" && dashboard && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground">{t("services.marketUpdates.dashboard.title")}</h2>
              <p className="text-sm text-muted-foreground">{dashboard.districtName} — {dashboard.month}</p>
            </div>

            {/* Price Changes */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" /> {t("services.marketUpdates.dashboard.priceChanges")}
              </h3>
              <div className="space-y-2">
                {dashboard.priceChanges.map((change, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{change.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{change.currentValue.toLocaleString("cs-CZ")}</span>
                      <span className={`text-xs font-bold ${change.changePercent >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {change.changePercent >= 0 ? "↑" : "↓"} {Math.abs(change.changePercent)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Movers */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                {dashboard.topMovers[0]?.direction === "up" ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-500" />}
                {t("services.marketUpdates.dashboard.topMovers")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {dashboard.topMovers.map((mover, i) => (
                  <div key={i} className="bg-background border border-border rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground">{mover.area}</div>
                    <div className={`text-lg font-bold ${mover.direction === "up" ? "text-green-600" : "text-red-500"}`}>
                      {mover.direction === "up" ? "+" : ""}{mover.change}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News Digest */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Newspaper size={14} className="text-accent" /> {t("services.marketUpdates.dashboard.news")}
              </h3>
              <div className="space-y-3">
                {dashboard.newsDigest.map((news, i) => (
                  <div key={i} className="py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${news.impact === "positive" ? "bg-green-500" : news.impact === "negative" ? "bg-red-500" : "bg-amber-500"}`} />
                      <span className="text-xs font-medium text-foreground">{news.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-3.5">{news.summary}</p>
                    <div className="text-[9px] text-accent ml-3.5 mt-0.5">{news.source} • {news.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {dashboard.alerts.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> {t("services.marketUpdates.dashboard.alerts")}
                </h3>
                <div className="space-y-2">
                  {dashboard.alerts.map((alert, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${alert.severity === "critical" ? "bg-red-500/5 border-red-500/20" : alert.severity === "warning" ? "bg-amber-500/5 border-amber-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
                      <Bell size={12} className={alert.severity === "critical" ? "text-red-500" : alert.severity === "warning" ? "text-amber-500" : "text-blue-500"} />
                      <span className="text-xs text-foreground">{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Narrative */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3">{t("services.marketUpdates.dashboard.narrative")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{dashboard.narrative}</p>
            </div>

            <div className="text-center pt-4">
              <Link href="/services" className="text-sm text-accent hover:underline font-medium">{t("services.backToServices")}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
