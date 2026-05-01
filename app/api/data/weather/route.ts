import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

interface WeatherData {
  temperature: number;
  windspeed: number;
  description: string;
}

const SOURCE = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL = 60 * 60 * 1000;

function weatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
}

export async function GET() {
  const cacheKey = "weather-prague";
  const cached = getCached<WeatherData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<WeatherData>);
  }

  try {
    const url = `${SOURCE}?latitude=50.08&longitude=14.42&current_weather=true&timezone=Europe/Prague`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

    const json = await res.json();
    const cw = json.current_weather;

    const data: WeatherData = {
      temperature: Math.round(cw.temperature),
      windspeed: Math.round(cw.windspeed),
      description: weatherCode(cw.weathercode),
    };

    setCache(cacheKey, data);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<WeatherData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<WeatherData | null>);
  }
}
