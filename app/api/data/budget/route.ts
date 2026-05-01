import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface BudgetData {
  source: string;
  year?: number;
  totalRevenue?: number;
  totalExpenditure?: number;
  surplus?: number;
  topCategories?: Array<{ label: string; value: number }>;
  summary?: string;
  lastScraped?: string;
}

const SOURCE = "https://monitor.statnipokladna.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `budget-${districtId}`;

  const cached = getCached<BudgetData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<BudgetData>);
  }

  const persisted = await getPersistedData<BudgetData>(districtId, "budget");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<BudgetData>);
  }

  return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<BudgetData | null>);
}
