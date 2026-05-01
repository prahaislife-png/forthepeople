import { NextRequest } from "next/server";
import { getCached, setCache, getPersistedData, persistData, type LiveResponse } from "@/app/lib/cache";

export interface ElectionsData {
  source: string;
  lastElection?: string;
  turnout?: number;
  seats?: number;
  parties?: Array<{ name: string; votes: number; seats: number; pct: number }>;
  summary?: string;
  lastScraped?: string;
}

const SOURCE = "https://www.volby.cz/opendata/kv2022/xml/kv2022_Praha.xml";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function parseElectionsXml(xml: string, districtId: number): ElectionsData | null {
  const districtMatch = xml.match(new RegExp(`<OBEC CIS_OBEC="\\d+"[^>]*NAZ_OBEC="Praha ${districtId}"[^>]*>([\\s\\S]*?)</OBEC>`));
  if (!districtMatch) return null;

  const block = districtMatch[1];
  const turnout = parseFloat(block.match(/UCAST_PROC="([\d.]+)"/)?.[1] || "0");
  const seats = parseInt(block.match(/MANDATY_CELKEM="(\d+)"/)?.[1] || "35");

  const parties: ElectionsData["parties"] = [];
  const partyRegex = /<STRANA[^>]*NAZEV="([^"]+)"[^>]*HLASY="(\d+)"[^>]*PROC_HLASU="([\d.]+)"[^>]*MANDATY="(\d+)"[^>]*/g;
  let m;
  while ((m = partyRegex.exec(block)) !== null) {
    parties.push({ name: m[1], votes: parseInt(m[2]), pct: parseFloat(m[3]), seats: parseInt(m[4]) });
  }

  if (parties.length === 0) return null;
  parties.sort((a, b) => b.votes - a.votes);

  return { source: SOURCE, lastElection: "Komunální 2022", turnout, seats, parties: parties.slice(0, 8) };
}

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `elections-${districtId}`;

  const cached = getCached<ElectionsData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ElectionsData>);
  }

  const persisted = await getPersistedData<ElectionsData>(districtId, "elections");
  if (persisted) {
    setCache(cacheKey, persisted.data);
    return Response.json({ status: "live", data: persisted.data, source: SOURCE, fetchedAt: persisted.fetchedAt } satisfies LiveResponse<ElectionsData>);
  }

  try {
    const res = await fetch(SOURCE, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`volby.cz returned ${res.status}`);
    const xml = await res.text();
    const data = parseElectionsXml(xml, districtId);
    if (!data) throw new Error("Could not parse election data for this district");

    setCache(cacheKey, data);
    await persistData(districtId, "elections", data, SOURCE);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ElectionsData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<ElectionsData | null>);
  }
}
