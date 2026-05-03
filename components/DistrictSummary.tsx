"use client";

import { Sparkles } from "lucide-react";
import { type District } from "@/app/data/districts";
import { type BulkData } from "@/app/hooks/useLiveData";
import { generateSummary } from "@/app/hooks/useDistrictSummary";

export function DistrictSummary({ district, bulk }: { district: District; bulk: BulkData | null }) {
  const summary = generateSummary(district, bulk);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-start gap-3">
      <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
      <p className="text-sm text-foreground leading-relaxed">{summary}</p>
    </div>
  );
}
