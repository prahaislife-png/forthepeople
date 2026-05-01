import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";
import { DISTRICT_ICOS } from "@/app/lib/district-icos";

export interface ContractItem {
  id: string;
  supplier: string;
  subject: string;
  value: number;
  date: string;
  url: string;
}

const SOURCE = "https://data.smlouvy.gov.cz";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function buildDumpUrl(): string {
  const now = new Date();
  return `${SOURCE}/dump_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}.xml`;
}

function fallbackDumpUrl(): string {
  const d = new Date(Date.now() - 86400000);
  return `${SOURCE}/dump_${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}_${String(d.getDate()).padStart(2, "0")}.xml`;
}

function parseContracts(xml: string, ico: string): ContractItem[] {
  const contracts: ContractItem[] = [];
  const recordRegex = /<zaznam>([\s\S]*?)<\/zaznam>/g;
  let match;

  while ((match = recordRegex.exec(xml)) !== null) {
    const record = match[1];
    if (!record.includes(`<ico>${ico}</ico>`)) continue;

    const id = record.match(/<idSmlouvy>(\d+)<\/idSmlouvy>/)?.[1] ?? "";
    const subject = record.match(/<predmet>([\s\S]*?)<\/predmet>/)?.[1]?.trim() ?? "";
    const valueStr = record.match(/<hodnotaBezDph>([\d.]+)<\/hodnotaBezDph>/)?.[1];
    const date = record.match(/<datumUzavreni>([\d-]+)<\/datumUzavreni>/)?.[1] ?? "";
    const supplier = record.match(/<smluvniStrana>[\s\S]*?<nazev>([\s\S]*?)<\/nazev>/)?.[1]?.trim() ?? "";
    const odkaz = record.match(/<odkaz>(https:\/\/smlouvy\.gov\.cz\/smlouva\/\d+)<\/odkaz>/)?.[1] ?? "";

    if (subject && valueStr) {
      contracts.push({
        id: `RS-${id}`,
        supplier: supplier || "N/A",
        subject,
        value: Math.round(parseFloat(valueStr)),
        date,
        url: odkaz || "https://smlouvy.gov.cz",
      });
    }
  }

  return contracts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
}

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const ico = DISTRICT_ICOS[districtId];
  if (!ico) {
    return Response.json({ status: "error", data: [], source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<ContractItem[]>);
  }

  const cacheKey = `contracts-${districtId}`;
  const cached = getCached<ContractItem[]>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ContractItem[]>);
  }

  try {
    let res = await fetch(buildDumpUrl(), { signal: AbortSignal.timeout(30000) });
    if (!res.ok) res = await fetch(fallbackDumpUrl(), { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Dump unavailable (${res.status})`);

    const xml = await res.text();
    const contracts = parseContracts(xml, ico);
    setCache(cacheKey, contracts);

    return Response.json({ status: "live", data: contracts, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ContractItem[]>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: [], source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<ContractItem[]>);
  }
}
