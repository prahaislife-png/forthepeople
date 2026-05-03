import { type District } from "@/app/data/districts";

export interface TrendInfo {
  direction: "up" | "down" | "flat";
  percentChange: number;
  history: { year: number; value: number }[];
}

export function getTrendForTile(tileId: string, district: District): TrendInfo | null {
  switch (tileId) {
    case "budget": {
      const trend = district.budget.yearlyTrend;
      if (trend.length < 2) return null;
      const prev = trend[trend.length - 2].revenue;
      const curr = trend[trend.length - 1].revenue;
      const pct = ((curr - prev) / prev) * 100;
      return {
        direction: Math.abs(pct) < 1 ? "flat" : pct > 0 ? "up" : "down",
        percentChange: pct,
        history: trend.map(t => ({ year: t.year, value: t.revenue })),
      };
    }
    case "housing": {
      const trend = district.housing.rentTrend;
      if (trend.length < 2) return null;
      const prev = trend[trend.length - 2].avgRent;
      const curr = trend[trend.length - 1].avgRent;
      const pct = ((curr - prev) / prev) * 100;
      return {
        direction: Math.abs(pct) < 1 ? "flat" : pct > 0 ? "up" : "down",
        percentChange: pct,
        history: trend.map(t => ({ year: t.year, value: t.avgRent })),
      };
    }
    case "crime": {
      const pct = district.crime.change;
      return {
        direction: Math.abs(pct) < 1 ? "flat" : pct > 0 ? "up" : "down",
        percentChange: pct,
        history: [],
      };
    }
    default:
      return null;
  }
}
