import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, type LiveResponse } from "@/app/lib/cache";

export interface TenderItem {
  id: string;
  title: string;
  estimatedValue: number;
  deadline: string;
  status: string;
  url: string;
}

const SOURCE = "https://www.vestnikverejnychzakazek.cz";
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `tenders-${districtId}`;

  const cached = getCached<TenderItem[]>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<TenderItem[]>);
  }

  const persisted = await getPersistedData<TenderItem[]>(districtId, "tenders");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<TenderItem[]>);
  }

  return Response.json({ status: "error", data: [], source: SOURCE, fetchedAt: new Date().toISOString(), error: "Awaiting initial data sync" } satisfies LiveResponse<TenderItem[]>);
}
