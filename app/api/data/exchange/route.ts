import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface ExchangeData {
  date: string;
  rates: Array<{ code: string; country: string; amount: number; rate: number }>;
  eur: number;
  usd: number;
  gbp: number;
}

const SOURCE = "https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt";
const CACHE_TTL = 4 * 60 * 60 * 1000;

function parseRates(text: string): ExchangeData | null {
  const lines = text.trim().split("\n");
  if (lines.length < 3) return null;

  const dateLine = lines[0];
  const dateMatch = dateLine.match(/(\d{1,2}\s\w+\s\d{4})/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

  const rates: ExchangeData["rates"] = [];
  let eur = 0, usd = 0, gbp = 0;

  for (let i = 2; i < lines.length; i++) {
    const parts = lines[i].split("|");
    if (parts.length < 5) continue;
    const country = parts[0].trim();
    const amount = parseInt(parts[2].trim()) || 1;
    const code = parts[3].trim();
    const rate = parseFloat(parts[4].trim());
    if (isNaN(rate)) continue;

    rates.push({ code, country, amount, rate });
    if (code === "EUR") eur = rate / amount;
    if (code === "USD") usd = rate / amount;
    if (code === "GBP") gbp = rate / amount;
  }

  if (rates.length === 0) return null;
  return { date, rates, eur, usd, gbp };
}

export async function GET() {
  const cacheKey = "exchange-rates";
  const cached = getCached<ExchangeData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ExchangeData>);
  }

  try {
    const res = await fetch(SOURCE, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`CNB returned ${res.status}`);
    const text = await res.text();
    const data = parseRates(text);
    if (!data) throw new Error("Could not parse CNB rates");

    setCache(cacheKey, data);
    return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<ExchangeData>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<ExchangeData | null>);
  }
}
