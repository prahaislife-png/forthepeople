"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription, type UserPlan } from "@/app/hooks/useSubscription";
import { useAdmin } from "@/app/hooks/useAdmin";
import { DISTRICTS } from "@/app/data/districts";
import { FileText, Crown, Settings, ExternalLink, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function DashboardPage() {
  const { user } = useAuth();
  const { plan, purchasedDistricts, canAccessReport, loading } = useSubscription();
  const { isAdmin } = useAdmin();
  const [managingBilling, setManagingBilling] = useState(false);
  const { t } = useI18n();

  const accessibleDistricts = DISTRICTS.filter((d) => canAccessReport(d.id));

  const handleManageBilling = async () => {
    if (!user) return;
    setManagingBilling(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setManagingBilling(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{t("dashboard.signInPrompt")}</p>
          <Link href="/?auth=signin" className="text-blue-400 hover:text-blue-300">
            {t("nav.signIn")} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-white">{t("dashboard.title")}</h1>
              <LanguageSwitcher />
            </div>
            <p className="text-slate-400 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`${PLAN_COLORS[plan]} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {t(`dashboard.plan.${plan}`)}
            </span>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 border border-amber-600/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Crown className="h-4 w-4" /> Admin
              </Link>
            )}
            {plan !== "free" && (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                {managingBilling ? t("pricing.loading") : t("dashboard.manageBilling")}
              </button>
            )}
          </div>
        </div>

        {/* Plan Status */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">{t("dashboard.subscription")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-slate-400">{t("dashboard.currentPlan")}</div>
              <div className="text-xl font-bold text-white">{t(`dashboard.plan.${plan}`)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">{t("dashboard.reportsAvailable")}</div>
              <div className="text-xl font-bold text-white">
                {plan === "explorer" || plan === "pro" ? t("dashboard.unlimited") : accessibleDistricts.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">{t("dashboard.districtsAccessed")}</div>
              <div className="text-xl font-bold text-white">{purchasedDistricts.length + 1}</div>
            </div>
          </div>
          {plan === "free" && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t("dashboard.upgradePlan")} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Reports Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            {t("dashboard.myReports")}
          </h2>
          {(plan === "explorer" || plan === "pro") && (
            <Link href="/" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
              <Plus className="h-4 w-4" /> {t("dashboard.generateNew")}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleDistricts.map((d) => (
            <Link
              key={d.id}
              href={`/report/${d.id}`}
              className="bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-white group-hover:text-blue-300 transition-colors">{d.name}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">{d.nameCz}</p>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{t("dashboard.pop")}: {d.population.toLocaleString()}</span>
                <span>{t("dashboard.rent")}: {d.housing.avgRentM2} Kč/m²</span>
              </div>
            </Link>
          ))}

          {/* Add more CTA */}
          {plan === "free" && (
            <Link
              href="/pricing"
              className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[140px]"
            >
              <Plus className="h-8 w-8 text-slate-600 mb-2" />
              <span className="text-sm text-slate-400">{t("dashboard.unlockMore")}</span>
              <span className="text-xs text-blue-400 mt-1">{t("dashboard.fromPrice")}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const PLAN_COLORS: Record<UserPlan, string> = {
  free: "bg-slate-600",
  single: "bg-blue-600",
  explorer: "bg-purple-600",
  pro: "bg-amber-600",
};
