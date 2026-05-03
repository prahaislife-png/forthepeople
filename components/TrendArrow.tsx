"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendArrowProps {
  current: number;
  previous: number;
  invert?: boolean;
}

export function TrendArrow({ current, previous, invert }: TrendArrowProps) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 1) {
    return <Minus size={12} className="inline text-muted-foreground ml-1" />;
  }
  const isUp = pct > 0;
  const isGood = invert ? !isUp : isUp;

  return (
    <span className={`inline-flex items-center ml-1.5 text-[10px] font-bold ${isGood ? "text-green-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span className="ml-0.5">{Math.abs(pct).toFixed(1)}%</span>
    </span>
  );
}
