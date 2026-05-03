"use client";

import { Check, type LucideIcon } from "lucide-react";

interface ServicePricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
  highlighted?: boolean;
  loading?: boolean;
  onSelect: () => void;
}

export function ServicePricingCard({ name, price, period, description, features, cta, badge, highlighted, loading, onSelect }: ServicePricingCardProps) {
  return (
    <div className={`relative rounded-2xl p-6 flex flex-col ${highlighted ? "bg-accent/10 border-2 border-accent shadow-lg shadow-accent/5" : "bg-card border border-border"}`}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-foreground">{price}</span>
          <span className="text-sm text-muted-foreground">Kč{period || ""}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all cursor-pointer ${highlighted ? "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25" : "bg-secondary hover:bg-secondary/80 text-foreground"} disabled:opacity-50`}
      >
        {loading ? "..." : cta}
      </button>
    </div>
  );
}
