import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

interface AirData {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  aqi: number;
  status: "good" | "fair" | "poor" | "very-poor";
  hourly: { hour: string; pm25: number }[];
}

const SOURCE = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getAqiStatus(aqi: number): AirData["status"] {
  if (aqi <= 25) return "good";
  if (aqi <= 50) return "fair";
  if (aqi <= 75) return "poor";
  return "very-poor";
}

export async function GET() {
  const cacheKey = "air-prague";
  const cached = getCached<AirData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<AirData>);
  }

  try {
    const url = `${SOURCE}?latitude=50.1&longitude=14.44&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,european_aqi&timezone=Europe/Prague&forecast_days=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

    const json = await res.json();
    const h = json.hourly;
    const now = new Date();
    const currentHour = now.getHours();

    const pm25 = h.pm2_5[currentHour] ?? h.pm2_5[0];
    const pm10 = h.pm10[currentHour] ?? h.pm10[0];
    const no2 = h.nitrogen_dioxide[currentHour] ?? h.nitrogen_dioxide[0];
    const o3 = h.ozone[currentHour] ?? h.ozone[0];
    const aqi = h.european_aqi[currentHour] ?? h.european_aqi[0];

    const hourly = h.time.slice(0, 24).map((t: string, i: number) => ({
      hour: t.split("T")[1]?.slice(0, 5) ?? `${i}:00`,
      pm25: h.pm2_5[i] ?? 0,
    }));

    const data: AirData = {
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      no2: Math.round(no2 * 10) / 10,
      o3: Math.round(o3 * 10) / 10,
      aqi: Math.round(aqi),
      status: getAqiStatus(aqi),
      hourly,
    };

    setCache(cacheKey, data);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<AirData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<AirData | null>);
  }
}
