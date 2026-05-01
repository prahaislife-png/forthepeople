import { NextRequest } from "next/server";
import { persistData } from "@/app/lib/cache";
import { golemioFetch, type GolemioFeatureCollection } from "@/app/lib/golemio";
import { DISTRICT_COORDS } from "@/app/lib/district-coords";
import { DISTRICT_ICOS } from "@/app/lib/district-icos";

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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: UpdateResult[] = [];
  const districtIds = Object.keys(DISTRICT_COORDS).map(Number);

  // Process districts in batches of 4 to avoid rate limiting
  for (let i = 0; i < districtIds.length; i += 4) {
    const batch = districtIds.slice(i, i + 4);

    const batchResults = await Promise.allSettled(
      batch.flatMap((id) => [
        updateGolemioSection(id, "health", "/medicalinstitutions", (r) => {
          const groups: Record<string, number> = {};
          const facilities: Array<{ name: string; type: string; address: string }> = [];
          for (const f of r.features) {
            const g = (f.properties.type as { group?: string })?.group || "other";
            groups[g] = (groups[g] || 0) + 1;
            if (facilities.length < 5) facilities.push({ name: String(f.properties.name || ""), type: String((f.properties.type as { description?: string })?.description || ""), address: String((f.properties.address as { address_formatted?: string })?.address_formatted || "") });
          }
          return { pharmacies: groups["pharmacies"] || 0, gps: groups["general_practitioners"] || 0, specialists: groups["specialists"] || 0, hospitals: groups["hospitals"] || 0, total: r.features.length, facilities };
        }),
        updateGolemioSection(id, "parks", "/gardens", (r) => ({
          total: r.features.length,
          parks: r.features.map((f) => ({ name: String(f.properties.name || ""), description: String(f.properties.description || "").replace(/<[^>]+>/g, "").slice(0, 150) })),
        })),
        updateGolemioSection(id, "sports", "/playgrounds", (r) => ({
          playgrounds: r.features.length,
          facilities: r.features.slice(0, 10).map((f) => ({ name: String(f.properties.name || ""), address: String((f.properties.address as { address_formatted?: string })?.address_formatted || "") })),
        })),
        updateGolemioSection(id, "libraries", "/municipallibraries", (r) => ({
          total: r.features.length,
          libraries: r.features.map((f) => ({ name: String(f.properties.name || ""), address: String((f.properties.address as { address_formatted?: string })?.address_formatted || ""), web: String(f.properties.web || "") })),
        })),
        updateGolemioSection(id, "waste", "/sortedwastestations", (r) => {
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
        }),
        updateBusiness(id),
      ])
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(r.value);
      else results.push({ districtId: batch[0], section: "unknown", status: "error", error: String(r.reason) });
    }

    // Small delay between batches
    if (i + 4 < districtIds.length) await new Promise((r) => setTimeout(r, 1000));
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error").length;

  return Response.json({
    message: `Cron complete: ${ok} ok, ${errors} errors`,
    totalDistricts: districtIds.length,
    results: results.slice(0, 50),
  });
}
