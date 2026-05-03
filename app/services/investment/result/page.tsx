"use client";

import { useState } from "react";
import { TrendingUp, CheckCircle, MapPin, AlertTriangle, Building2 } from "lucide-react";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { useI18n } from "@/app/i18n/I18nProvider";
import { DISTRICTS } from "@/app/data/districts";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { InvestmentReport } from "@/app/lib/services-types";

export default function InvestmentResultPage() {
  const { t } = useI18n();
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvestmentReport | null>(null);

  const handleGenerate = async () => {
    if (!selectedDistrict) return;
    setLoading(true);
    try {
      const res = await fetch("/api/services/investment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtId: selectedDistrict, address: address || undefined }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const recColor = (rec: string) => {
    switch (rec) {
      case "strong_buy": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "buy": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "hold": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "caution": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-secondary text-foreground border-border";
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
            <span className="text-xs text-accent font-medium">Paid</span>
          </div>
          <div className="w-8 h-px bg-accent" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${result ? "bg-accent text-white" : "bg-accent/20 text-accent"}`}>
              {result ? "✓" : "2"}
            </div>
            <span className="text-xs text-foreground font-medium">Select District</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${result ? "bg-accent text-white" : "bg-secondary text-muted-foreground"}`}>3</div>
            <span className="text-xs text-muted-foreground font-medium">Report</span>
          </div>
        </div>

        {/* Payment badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-semibold">
            <CheckCircle size={14} /> {t("services.payment.success")}
          </div>
        </div>

        {/* District selector */}
        {!result && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-accent" /> {t("services.investment.select.title")}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">{t("services.investment.select.district")}</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
              {DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDistrict(d.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${selectedDistrict === d.id ? "bg-accent text-white shadow-lg shadow-accent/25" : "bg-secondary text-foreground hover:bg-accent/10"}`}
                >
                  Praha {d.id}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">{t("services.investment.select.address")}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("services.investment.select.addressPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedDistrict}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? t("services.investment.select.generating") : t("services.investment.select.submit")}
            </button>
          </div>
        )}

        {/* Report Results */}
        {result && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t("services.investment.result.title")}</h2>
                  <p className="text-sm text-muted-foreground">{result.districtName}{result.address ? ` — ${result.address}` : ""}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${recColor(result.recommendation)}`}>
                  {t(`services.investment.result.rec.${result.recommendation}`)}
                </span>
              </div>
            </div>

            {/* ROI Chart */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">{t("services.investment.result.roi")}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={result.roiProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cumulativeReturn" stroke="#6b7f5a" strokeWidth={2} dot={{ r: 3 }} name="Cumulative ROI" />
                  <Line type="monotone" dataKey="totalReturn" stroke="#b8d4a0" strokeWidth={1.5} strokeDasharray="4 4" name="Annual Return" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Rental Yield */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">{t("services.investment.result.yield")}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <div className="text-[10px] text-muted-foreground">{t("services.investment.result.gross")}</div>
                  <div className="text-lg font-bold text-foreground">{result.rentalYield.grossYield}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t("services.investment.result.net")}</div>
                  <div className="text-lg font-bold text-accent">{result.rentalYield.netYield}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t("services.investment.result.monthly")}</div>
                  <div className="text-lg font-bold text-foreground">{result.rentalYield.avgMonthlyRent.toLocaleString("cs-CZ")} Kč</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t("services.investment.result.expenses")}</div>
                  <div className="text-lg font-bold text-foreground">{result.rentalYield.estimatedExpenses.toLocaleString("cs-CZ")} Kč</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t("services.investment.result.occupancy")}</div>
                  <div className="text-lg font-bold text-foreground">{result.rentalYield.occupancyRate}%</div>
                </div>
              </div>
            </div>

            {/* Development Plans */}
            {result.developmentPlans.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Building2 size={14} className="text-accent" /> {t("services.investment.result.development")}
                </h3>
                <div className="space-y-3">
                  {result.developmentPlans.map((plan, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${plan.impact === "positive" ? "bg-green-500" : plan.impact === "negative" ? "bg-red-500" : "bg-amber-500"}`} />
                      <div>
                        <div className="text-xs font-medium text-foreground">{plan.project}</div>
                        <div className="text-[10px] text-muted-foreground">{plan.description}</div>
                        <div className="text-[9px] text-accent mt-0.5">{plan.status} • {plan.completionYear}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {result.riskFactors.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> {t("services.investment.result.risks")}
                </h3>
                <div className="space-y-3">
                  {result.riskFactors.map((risk, i) => (
                    <div key={i} className="bg-background border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${risk.severity === "high" ? "bg-red-500/10 text-red-600" : risk.severity === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"}`}>
                          {risk.severity}
                        </span>
                        <span className="text-xs font-medium text-foreground">{risk.factor}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{risk.description}</p>
                      <p className="text-[10px] text-accent mt-1">Mitigation: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison vs Alternatives */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3">{t("services.investment.result.comparison")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Instrument</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Expected Return</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Risk</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Liquidity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparisonVsAlternatives.map((alt, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 font-medium text-foreground">{alt.instrument}</td>
                        <td className="py-2 text-right text-accent font-bold">{alt.expectedReturn}%</td>
                        <td className="py-2 text-right text-muted-foreground">{alt.risk}</td>
                        <td className="py-2 text-right text-muted-foreground">{alt.liquidity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-3">{t("services.investment.result.recommendation")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
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
