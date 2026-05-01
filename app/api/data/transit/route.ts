import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface TransitItem {
  title: string;
  link: string;
  pubDate: string;
  category: string;
  description: string;
}

const SOURCE = "https://pid.cz/feed/";
const CACHE_TTL = 10 * 60 * 1000;

function parseRss(xml: string): TransitItem[] {
  const items: TransitItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").replace(/&#8211;/g, "–").replace(/&#8230;/g, "…").trim() ?? "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const category = block.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/)?.[1]?.trim() ?? "";
    const description = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
      ?.replace(/<[^>]+>/g, "").trim().slice(0, 200) ?? "";

    if (title) items.push({ title, link, pubDate, category, description });
  }

  return items;
}

export async function GET() {
  const cacheKey = "pid-transit";
  const cached = getCached<TransitItem[]>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<TransitItem[]>);
  }

  try {
    const res = await fetch(SOURCE, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`PID feed returned ${res.status}`);

    const xml = await res.text();
    const items = parseRss(xml);
    setCache(cacheKey, items);

    return Response.json({ status: "live", data: items, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<TransitItem[]>);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ status: "error", data: [], source: SOURCE, fetchedAt: new Date().toISOString(), error: msg } satisfies LiveResponse<TransitItem[]>);
  }
}
