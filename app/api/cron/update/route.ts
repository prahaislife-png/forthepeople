import { NextRequest } from "next/server";
import { persistData } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";
import { DISTRICT_ICOS } from "@/app/lib/district-icos";
import { runActor } from "@/app/lib/apify";

const CRON_SECRET = process.env.CRON_SECRET;

interface UpdateResult {
  districtId: number;
  section: string;
  status: "ok" | "error";
  error?: string;
}

async function updateGolemioSection(
  districtId: number,
  section: string,
  endpoint: string,
  transform: (data: GolemioFeatureCollection<Record<string, unknown>>) => unknown
): Promise<UpdateResult> {
  const coords = DISTRICT_COORDS[districtId];
  if (!coords) return { districtId, section, status: "error", error: "No coords" };

  try {
    const result = await golemioFetch<GolemioFeatureCollection<Record<string, unknown>>>(
      endpoint,
      { latlng: `${coords.lat},${coords.lng}`, range: "3000", limit: "200" }
    );
    const data = transform(result);
    await persistData(districtId, section, data, `https://api.golemio.cz/v2${endpoint}`);
    return { districtId, section, status: "ok" };
  } catch (e) {
    return { districtId, section, status: "error", error: e instanceof Error ? e.message : "Unknown" };
  }
}

async function updateContracts(districtId: number): Promise<UpdateResult> {
  const ico = DISTRICT_ICOS[districtId];
  if (!ico) return { districtId, section: "contracts", status: "error", error: "No ICO" };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3001"}/api/data/contracts?district=${districtId}`, {
      signal: AbortSignal.timeout(60000),
    });
    const json = await res.json();
    if (json.status === "live" && json.data) {
      await persistData(districtId, "contracts", json.data, "https://data.smlouvy.gov.cz");
      return { districtId, section: "contracts", status: "ok" };
    }
    return { districtId, section: "contracts", status: "error", error: json.error || "No data" };
  } catch (e) {
    return { districtId, section: "contracts", status: "error", error: e instanceof Error ? e.message : "Unknown" };
  }
}

async function updateBusiness(districtId: number): Promise<UpdateResult> {
  const ico = DISTRICT_ICOS[districtId];
  if (!ico) return { districtId, section: "business", status: "error", error: "No ICO" };

  try {
    const res = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`ARES ${res.status}`);
    const json = await res.json();
    const data = {
      ico: json.ico ?? ico,
      name: json.obchodniJmeno ?? "",
      legalForm: json.pravniForma ?? "",
      address: json.sidlo?.textovaAdresa ?? "",
      czNace: json.czNace2008 ?? json.czNace ?? [],
      registeredSince: json.datumVzniku ?? "",
    };
    await persistData(districtId, "business", data, "https://ares.gov.cz");
    return { districtId, section: "business", status: "ok" };
  } catch (e) {
    return { districtId, section: "business", status: "error", error: e instanceof Error ? e.message : "Unknown" };
  }
}

async function updateApifySections(): Promise<UpdateResult[]> {
  const results: UpdateResult[] = [];
  const CRAWLER_ACTOR = "apify/website-content-crawler";

  interface CrawlResult {
    url?: string;
    text?: string;
    metadata?: { title?: string };
  }

  const sections: Array<{
    section: string;
    urls: string[];
    source: string;
    transform: (items: CrawlResult[]) => unknown;
    districtId?: number;
  }> = [
    {
      section: "budget",
      urls: ["https://monitor.statnipokladna.cz/ucetni-jednotka/00063754/prehled?rad=t&obdobi=2312"],
      source: "https://monitor.statnipokladna.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        const numbers = text.match(/[\d\s]+[,.][\d\s]+/g) || [];
        return {
          source: "Monitor státní pokladny",
          period: "2023",
          revenue: numbers[0]?.trim() || "Data available",
          expenses: numbers[1]?.trim() || "Data available",
          rawTextLength: text.length,
          lastScraped: new Date().toISOString(),
        };
      },
    },
    {
      section: "crime",
      urls: ["https://kriminalita.policie.cz/"],
      source: "https://mapakriminality.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        return {
          source: "Policie ČR - Mapa kriminality",
          summary: text.slice(0, 500),
          lastScraped: new Date().toISOString(),
        };
      },
    },
    {
      section: "housing",
      urls: ["https://www.czso.cz/csu/czso/ceny_bytu"],
      source: "https://www.czso.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        return {
          source: "ČSÚ - Ceny bytů",
          summary: text.slice(0, 500),
          lastScraped: new Date().toISOString(),
        };
      },
    },
    {
      section: "schools",
      urls: ["https://rejstriky.msmt.cz/rejskol/"],
      source: "https://rejstriky.msmt.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        return {
          source: "MŠMT - Rejstřík škol",
          summary: text.slice(0, 500),
          lastScraped: new Date().toISOString(),
        };
      },
    },
    {
      section: "employment",
      urls: ["https://www.czso.cz/csu/czso/zamestnanost_nezamestnanost_prace"],
      source: "https://www.czso.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        return {
          source: "ČSÚ - Zaměstnanost",
          summary: text.slice(0, 500),
          lastScraped: new Date().toISOString(),
        };
      },
    },
    {
      section: "tenders",
      urls: ["https://www.vestnikverejnychzakazek.cz/SearchForm/Search"],
      source: "https://vestnikverejnychzakazek.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        return {
          source: "Věstník veřejných zakázek",
          summary: text.slice(0, 500),
          lastScraped: new Date().toISOString(),
        };
      },
    },
    {
      section: "elections",
      urls: ["https://volby.cz/pls/kv2022/kv1111?xjazyk=CZ&xid=1&xv=23&xnumnuts=1100"],
      source: "https://volby.cz",
      transform: (items) => {
        const text = items.map((i) => i.text || "").join("\n");
        return {
          source: "ČSÚ - volby.cz",
          type: "Komunální volby 2022",
          summary: text.slice(0, 500),
          lastScraped: new Date().toISOString(),
        };
      },
    },
  ];

  for (const { section, urls, source, transform } of sections) {
    try {
      const items = await runActor<CrawlResult>(CRAWLER_ACTOR, {
        startUrls: urls.map((url) => ({ url })),
        maxCrawlPages: 1,
        maxCrawlDepth: 0,
      });
      const data = transform(items);
      // Store for all districts (Prague-wide data)
      const districtIds = Object.keys(DISTRICT_COORDS).map(Number);
      for (const districtId of districtIds) {
        await persistData(districtId, section, data, source);
      }
      results.push({ districtId: 0, section, status: "ok" });
    } catch (e) {
      results.push({ districtId: 0, section, status: "error", error: e instanceof Error ? e.message : "Unknown" });
    }
  }

  return results;
}

async function updateOneDistrict(id: number): Promise<UpdateResult[]> {
  const results: UpdateResult[] = [];

  const golemioSections: Array<{
    section: string;
    endpoint: string;
    transform: (data: GolemioFeatureCollection<Record<string, unknown>>) => unknown;
  }> = [
    {
      section: "health",
      endpoint: "/medicalinstitutions",
      transform: (r) => {
        const groups: Record<string, number> = {};
        const facilities: Array<{ name: string; type: string; address: string }> = [];
        for (const f of r.features) {
          const g = (f.properties.type as { group?: string })?.group || "other";
          groups[g] = (groups[g] || 0) + 1;
          if (facilities.length < 5) facilities.push({ name: String(f.properties.name || ""), type: String((f.properties.type as { description?: string })?.description || ""), address: String((f.properties.address as { address_formatted?: string })?.address_formatted || "") });
        }
        return { pharmacies: groups["pharmacies"] || 0, gps: groups["general_practitioners"] || 0, specialists: groups["specialists"] || 0, hospitals: groups["hospitals"] || 0, total: r.features.length, facilities };
      },
    },
    {
      section: "parks",
      endpoint: "/gardens",
      transform: (r) => ({
        total: r.features.length,
        parks: r.features.map((f) => ({ name: String(f.properties.name || ""), description: String(f.properties.description || "").replace(/<[^>]+>/g, "").slice(0, 150) })),
      }),
    },
    {
      section: "sports",
      endpoint: "/playgrounds",
      transform: (r) => ({
        playgrounds: r.features.length,
        facilities: r.features.slice(0, 10).map((f) => ({ name: String(f.properties.name || ""), address: String((f.properties.address as { address_formatted?: string })?.address_formatted || "") })),
      }),
    },
    {
      section: "libraries",
      endpoint: "/municipallibraries",
      transform: (r) => ({
        total: r.features.length,
        libraries: r.features.map((f) => ({ name: String(f.properties.name || ""), address: String((f.properties.address as { address_formatted?: string })?.address_formatted || ""), web: String(f.properties.web || "") })),
      }),
    },
    {
      section: "waste",
      endpoint: "/sortedwastestations",
      transform: (r) => {
        const types: Record<string, number> = {};
        let containers = 0;
        let monitored = 0;
        for (const f of r.features) {
          for (const c of (f.properties.containers as Array<{ trash_type?: { description: string }; last_measurement?: unknown }>) || []) {
            containers++;
            types[c.trash_type?.description || "?"] = (types[c.trash_type?.description || "?"] || 0) + 1;
            if (c.last_measurement) monitored++;
          }
        }
        return { stations: r.features.length, containers, types, monitoredContainers: monitored };
      },
    },
    {
      section: "cityhall",
      endpoint: "/municipalauthorities",
      transform: (r) => {
        if (r.features.length === 0) return null;
        const f = r.features[0];
        return {
          name: String(f.properties.name || ""),
          address: String((f.properties.address as { address_formatted?: string })?.address_formatted || ""),
          phone: String(f.properties.telephone || ""),
          email: String(f.properties.email || ""),
          web: String(f.properties.web || ""),
        };
      },
    },
  ];

  // Sequential Golemio calls to avoid 429 rate limits
  for (const { section, endpoint, transform } of golemioSections) {
    results.push(await updateGolemioSection(id, section, endpoint, transform));
    await new Promise((r) => setTimeout(r, 500));
  }

  // ARES doesn't have rate limit issues
  results.push(await updateBusiness(id));

  return results;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: UpdateResult[] = [];
  const districtIds = Object.keys(DISTRICT_COORDS).map(Number);

  // Process 1 district at a time, sequentially, to respect Golemio rate limits
  for (const id of districtIds) {
    const districtResults = await updateOneDistrict(id);
    results.push(...districtResults);

    // 2s pause between districts
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Run Apify scrapers if ?apify=1 is passed (or on a schedule — triggered separately)
  const runApify = request.nextUrl.searchParams.get("apify") === "1";
  if (runApify) {
    const apifyResults = await updateApifySections();
    results.push(...apifyResults);
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error").length;

  return Response.json({
    message: `Cron complete: ${ok} ok, ${errors} errors${runApify ? " (with Apify)" : ""}`,
    totalDistricts: districtIds.length,
    results: results.slice(0, 80),
  });
}
