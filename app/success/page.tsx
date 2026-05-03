"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, MapPin } from "lucide-react";
import { DISTRICTS } from "@/app/data/districts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SuccessPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useI18n();

  const handleSubmit = () => {
    if (!selectedDistrict) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-3">{t("success.submitted.title")}</h1>
          <p className="text-muted-foreground mb-2">
            {t("success.submitted.preparing")} <strong className="text-foreground">Praha {selectedDistrict}</strong> {t("success.submitted.preparingSuffix")}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t("success.submitted.review")} <strong className="text-foreground">{t("success.submitted.timeframe")}</strong>.
          </p>
          <div className="bg-card border border-border rounded-xl p-4 text-left mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2">{t("success.submitted.nextTitle")}</h3>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> {t("success.submitted.next1")} Praha {selectedDistrict}</li>
              <li className="flex gap-2"><span className="text-accent font-bold">2.</span> {t("success.submitted.next2")}</li>
              <li className="flex gap-2"><span className="text-accent font-bold">3.</span> {t("success.submitted.next3")}</li>
            </ol>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors">
            {t("success.submitted.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">{t("success.payment.title")}</h1>
          <p className="text-muted-foreground">{t("success.payment.subtitle")}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            {t("success.select.title")}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDistrict(d.id)}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedDistrict === d.id
                    ? "bg-accent text-white shadow-lg shadow-accent/25"
                    : "bg-secondary text-foreground hover:bg-accent/10"
                }`}
              >
                Praha {d.id}
              </button>
            ))}
          </div>

          {selectedDistrict && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                {t("success.select.description")} <strong className="text-foreground">Praha {selectedDistrict}</strong> {t("success.select.descriptionSuffix")}
              </p>
              <button
                onClick={handleSubmit}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-accent/25"
              >
                {t("success.select.button")} Praha {selectedDistrict}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("success.help")}
        </p>
      </div>
    </div>
  );
}
