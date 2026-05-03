/**
 * Listing scraper orchestrator.
 * Multi-layer approach:
 *   1. Parse URL pattern (instant — extract district + rooms from URL structure)
 *   2. Direct HTTP fetch + HTML meta/OG tag parsing (fast — 2-5 sec)
 *   3. Apify actor scraping (slow — 10-30 sec, requires token)
 *
 * For comparables search: uses bebich/sreality-scraper actor if available.
 */

import { runActor } from "./apify";
import type { ListingDetails } from "./services-types";
import { detectSource, extractDistrictId, parseRooms } from "./listing-parsers/common";
import { parseSrealityRawText, type SrealityScraperOutput } from "./listing-parsers/sreality";
import { parseBezrealitkyRawText } from "./listing-parsers/bezrealitky";
import { getDistrict } from "../data/districts";

/** Output from apify/website-content-crawler */
interface CrawlerOutput {
  url: string;
  text: string;
  title?: string;
  html?: string;
  loadedUrl?: string;
}

/**
 * Scrape a single listing URL and extract structured property data.
 * Uses a multi-layer fallback approach for maximum reliability.
 */
export async function scrapeListing(url: string): Promise<ListingDetails> {
  const source = detectSource(url);

  // Layer 1: Parse URL pattern (always works — extracts district + rooms)
  const urlParsed = parseUrlPattern(url, source);

  // Layer 2: Direct HTTP fetch + HTML parsing (works for most sites without JS rendering)
  try {
    const httpResult = await fetchAndParseHTML(url, source);
    if (httpResult && httpResult.priceTotal > 0 && httpResult.areaM2 > 0) {
      // Merge URL-parsed data with HTTP-fetched data (HTTP takes priority where available)
      return mergeListingData(httpResult, urlParsed);
    }
  } catch (e) {
    console.warn("Direct HTTP fetch failed, trying Apify:", e);
  }

  // Layer 3: Apify scraping (if token is configured)
  const hasApifyToken = !!process.env.APIFY_API_TOKEN;
  if (hasApifyToken) {
    try {
      const results = await runActor<CrawlerOutput>("apify/website-content-crawler", {
        startUrls: [{ url }],
        maxCrawlPages: 1,
        crawlerType: "playwright:firefox",
        maxConcurrency: 1,
        proxyConfiguration: { useApifyProxy: true },
        saveHtml: false,
        saveMarkdown: false,
      });

      if (results && results.length > 0) {
        const text = results[0].text || "";
        let parsed: ListingDetails;
        if (source === "sreality") parsed = parseSrealityRawText(text, url);
        else if (source === "bezrealitky") parsed = parseBezrealitkyRawText(text, url);
        else parsed = parseFromRawText(text, url, source);

        if (parsed.priceTotal > 0 && parsed.areaM2 > 0) {
          return mergeListingData(parsed, urlParsed);
        }
      }
    } catch (e) {
      console.warn("Apify scraping failed:", e);
    }
  }

  // Layer 4: Use URL-parsed data + district averages as fallback
  // This always works and produces a usable (though less accurate) result
  // Default to Praha 5 if no district detected
  if (!urlParsed.districtId) {
    urlParsed.districtId = 5;
    urlParsed.district = "Praha 5";
  }
  return enrichWithDistrictDefaults(urlParsed);
}

/**
 * Parse the URL pattern to extract what we can without any network calls.
 * SReality URLs: /detail/prodej/byt/2+kk/praha-cerny-most-generala-janouska/1234
 * Bezrealitky: /nemovitosti-byty-domy/12345-prodej-bytu-2kk-54m2-praha
 */
function parseUrlPattern(url: string, source: ListingDetails["source"]): ListingDetails {
  const urlLower = url.toLowerCase();
  const pathParts = new URL(url).pathname.split("/").filter(Boolean);

  let rooms = "";
  let districtId = 0;
  let district = "";
  let title = "";
  let areaM2 = 0;

  if (source === "sreality") {
    // Pattern: /detail/prodej/byt/2+kk/praha-cerny-most-generala-janouska/hash
    // pathParts: ["detail", "prodej", "byt", "2+kk", "praha-cerny-most-...", "hash"]
    if (pathParts.length >= 5) {
      rooms = parseRooms(decodeURIComponent(pathParts[3] || "")); // "2+kk"
      const location = decodeURIComponent(pathParts[4] || "").replace(/-/g, " "); // "praha cerny most generala janouska"
      districtId = extractDistrictId(location);
      district = `Praha ${districtId || ""}`.trim();
      title = `${rooms} flat, ${district}`;
    }
  } else if (source === "bezrealitky") {
    // Try to extract from the URL slug
    const roomMatch = urlLower.match(/(\d\+(?:kk|\d))/);
    if (roomMatch) rooms = roomMatch[1];
    const areaMatch = urlLower.match(/(\d+)\s*m2/);
    if (areaMatch) areaM2 = parseInt(areaMatch[1]);
    districtId = extractDistrictId(urlLower.replace(/-/g, " "));
    district = `Praha ${districtId || ""}`.trim();
    title = `${rooms} flat, ${district}`;
  } else {
    // Generic: try to find rooms and district in URL
    const roomMatch = urlLower.match(/(\d\+(?:kk|\d))/);
    if (roomMatch) rooms = roomMatch[1];
    districtId = extractDistrictId(urlLower.replace(/-/g, " "));
    district = districtId ? `Praha ${districtId}` : "Praha";
  }

  return {
    url,
    source,
    title: title || "Property listing",
    priceTotal: 0,
    pricePerM2: 0,
    areaM2,
    floor: 0,
    totalFloors: 0,
    condition: "good",
    buildingType: "other",
    district,
    districtId,
    rooms,
    photos: [],
    photoCount: 0,
    description: "",
  };
}

/**
 * Fetch the page via direct HTTP and parse Open Graph tags, JSON-LD, and meta tags.
 * Most Czech real estate sites include price/area in meta tags even without JS rendering.
 */
async function fetchAndParseHTML(url: string, source: ListingDetails["source"]): Promise<ListingDetails | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "cs,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseHTMLContent(html, url, source);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse HTML content for listing data using multiple strategies:
 * 1. JSON-LD structured data (most reliable)
 * 2. Open Graph meta tags
 * 3. Regular meta tags and page content patterns
 */
function parseHTMLContent(html: string, url: string, source: ListingDetails["source"]): ListingDetails | null {
  let priceTotal = 0;
  let areaM2 = 0;
  let rooms = "";
  let title = "";
  let description = "";
  let district = "";
  let districtId = 0;
  let floor = 0;
  let totalFloors = 0;
  let condition: ListingDetails["condition"] = "good";
  let buildingType: ListingDetails["buildingType"] = "other";
  let photoCount = 0;

  // Strategy 1: JSON-LD structured data
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      const jsonContent = match.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim();
      try {
        const data = JSON.parse(jsonContent);
        if (data["@type"] === "Product" || data["@type"] === "RealEstateListing" || data["@type"] === "Residence") {
          if (data.offers?.price) priceTotal = parseInt(String(data.offers.price).replace(/[^\d]/g, ""));
          if (data.offers?.priceCurrency === "CZK" && data.offers?.price) priceTotal = parseInt(String(data.offers.price).replace(/[^\d]/g, ""));
          if (data.name) title = data.name;
          if (data.description) description = data.description;
          if (data.image) {
            const images = Array.isArray(data.image) ? data.image : [data.image];
            photoCount = images.length;
          }
        }
        if (data.price || data.totalPrice) {
          priceTotal = parseInt(String(data.price || data.totalPrice).replace(/[^\d]/g, ""));
        }
      } catch {
        // Invalid JSON-LD, continue
      }
    }
  }

  // Strategy 2: Open Graph meta tags
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogPrice = extractMeta(html, "product:price:amount") || extractMeta(html, "og:price:amount");

  if (ogTitle && !title) title = ogTitle;
  if (ogDescription && !description) description = ogDescription;
  if (ogPrice && !priceTotal) priceTotal = parseInt(ogPrice.replace(/[^\d]/g, ""));

  // Count og:image tags for photo count
  const ogImages = html.match(/property="og:image"/gi);
  if (ogImages && ogImages.length > photoCount) photoCount = ogImages.length;

  // Strategy 3: Page title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && !title) title = titleMatch[1].replace(/&[^;]+;/g, " ").trim();

  // Strategy 4: SReality-specific patterns in page source
  if (source === "sreality") {
    // SReality has __NEXT_DATA__ or similar state objects with listing data
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const props = nextData?.props?.pageProps;
        if (props?.estate) {
          const estate = props.estate;
          if (estate.price_czk?.value_raw) priceTotal = estate.price_czk.value_raw;
          if (estate.usable_area) areaM2 = estate.usable_area;
          if (estate.category_sub_cb) rooms = estate.category_sub_cb; // might need mapping
          if (estate.locality?.value) district = estate.locality.value;
        }
      } catch {
        // Continue with other strategies
      }
    }

    // SReality often has price in the page text
    const priceMatch = html.match(/(?:"price"|"totalPrice"|Celková cena)[:\s]*["\s]*(\d[\d\s]*\d)/i);
    if (priceMatch && !priceTotal) {
      priceTotal = parseInt(priceMatch[1].replace(/\s/g, ""));
    }

    // Area
    const areaMatch = html.match(/(?:"usable_area"|Užitná plocha)[:\s]*["\s]*(\d+)/i);
    if (areaMatch && !areaM2) areaM2 = parseInt(areaMatch[1]);
  }

  // Bezrealitky specific
  if (source === "bezrealitky") {
    const priceMatch = html.match(/(?:price|cena)["\s:]*(\d[\d\s]*\d)\s*(?:Kč|CZK|,-)/i);
    if (priceMatch && !priceTotal) priceTotal = parseInt(priceMatch[1].replace(/\s/g, ""));
    const areaMatch = html.match(/(\d+)\s*m[²2]/);
    if (areaMatch && !areaM2) areaM2 = parseInt(areaMatch[1]);
  }

  // Extract from title / description text
  const allText = `${title} ${description}`.toLowerCase();

  // Rooms from title/description
  if (!rooms) {
    const roomMatch = allText.match(/(\d\+(?:kk|\d))/);
    if (roomMatch) rooms = roomMatch[1];
  }

  // Area from text if not found yet
  if (!areaM2) {
    const areaMatch = allText.match(/(\d+)\s*m[²2]/);
    if (areaMatch) areaM2 = parseInt(areaMatch[1]);
  }

  // Price from description text
  if (!priceTotal) {
    const priceMatches = `${title} ${description}`.match(/(\d[\d\s]{3,10})\s*(?:Kč|CZK|,-)/g);
    if (priceMatches) {
      for (const pm of priceMatches) {
        const val = parseInt(pm.replace(/[^\d]/g, ""));
        if (val > 500000 && val > priceTotal) priceTotal = val;
      }
    }
  }

  // District from text
  districtId = extractDistrictId(allText.replace(/-/g, " "));
  district = districtId ? `Praha ${districtId}` : "Praha";

  // Floor
  const floorMatch = allText.match(/(\d+)\.\s*(?:patro|np|podlaží)/);
  if (floorMatch) floor = parseInt(floorMatch[1]);
  const totalFloorMatch = allText.match(/(?:z|\/)\s*(\d+)\s*(?:pater|podlaží|NP)/i);
  if (totalFloorMatch) totalFloors = parseInt(totalFloorMatch[1]);

  // Condition
  if (allText.includes("novostavba") || allText.includes("nový byt")) condition = "new";
  else if (allText.includes("po rekonstrukci") || allText.includes("rekonstruovan")) condition = "renovated";
  else if (allText.includes("před rekonstrukcí") || allText.includes("k rekonstrukci")) condition = "to_renovate";
  else if (allText.includes("původní stav")) condition = "original";

  // Building type
  if (allText.includes("panel") || allText.includes("panelový")) buildingType = "panel";
  else if (allText.includes("cihla") || allText.includes("cihlový")) buildingType = "brick";

  // If we got at least price OR area, return the result
  if (priceTotal > 0 || areaM2 > 0) {
    return {
      url,
      source,
      title: title || `Property in Praha ${districtId}`,
      priceTotal,
      pricePerM2: (priceTotal && areaM2) ? Math.round(priceTotal / areaM2) : 0,
      areaM2,
      floor,
      totalFloors,
      condition,
      buildingType,
      district,
      districtId,
      rooms,
      photos: [],
      photoCount,
      description: description.slice(0, 500),
    };
  }

  return null;
}

/** Extract meta tag content by property or name */
function extractMeta(html: string, name: string): string | null {
  const propMatch = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*?)["']`, "i"));
  if (propMatch) return propMatch[1];

  const propMatch2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*property=["']${name}["']`, "i"));
  if (propMatch2) return propMatch2[1];

  const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`, "i"));
  if (nameMatch) return nameMatch[1];

  return null;
}

/**
 * When we only have URL-parsed data (no network data available),
 * enrich with district defaults so the analysis can still run.
 */
function enrichWithDistrictDefaults(partial: ListingDetails): ListingDetails {
  const d = getDistrict(partial.districtId);

  // Use district average price to estimate if we have area
  const avgPriceM2 = d.housing.avgSaleM2;
  const estimatedArea = partial.areaM2 || getTypicalArea(partial.rooms);
  const estimatedPrice = partial.priceTotal || Math.round(avgPriceM2 * estimatedArea);

  return {
    ...partial,
    priceTotal: estimatedPrice,
    pricePerM2: estimatedArea > 0 ? Math.round(estimatedPrice / estimatedArea) : avgPriceM2,
    areaM2: estimatedArea,
    district: partial.district || d.name,
    title: partial.title || `${partial.rooms || "Apartment"} in ${d.name}`,
    description: `Property listing in ${d.name}, Praha ${partial.districtId}. Estimated from district averages.`,
  };
}

/** Get typical area for a room configuration */
function getTypicalArea(rooms: string): number {
  switch (rooms) {
    case "1+kk": return 30;
    case "1+1": return 38;
    case "2+kk": return 50;
    case "2+1": return 58;
    case "3+kk": return 72;
    case "3+1": return 80;
    case "4+kk": return 95;
    case "4+1": return 105;
    case "5+kk": case "5+1": return 120;
    default: return 55;
  }
}

/** Merge two ListingDetails objects, preferring non-zero/non-empty values from primary */
function mergeListingData(primary: ListingDetails, fallback: ListingDetails): ListingDetails {
  return {
    url: primary.url,
    source: primary.source,
    title: primary.title || fallback.title,
    priceTotal: primary.priceTotal || fallback.priceTotal,
    pricePerM2: primary.pricePerM2 || fallback.pricePerM2,
    areaM2: primary.areaM2 || fallback.areaM2,
    floor: primary.floor || fallback.floor,
    totalFloors: primary.totalFloors || fallback.totalFloors,
    condition: primary.condition !== "good" ? primary.condition : fallback.condition,
    buildingType: primary.buildingType !== "other" ? primary.buildingType : fallback.buildingType,
    district: primary.district || fallback.district,
    districtId: primary.districtId || fallback.districtId,
    rooms: primary.rooms || fallback.rooms,
    photos: primary.photos.length > 0 ? primary.photos : fallback.photos,
    photoCount: primary.photoCount || fallback.photoCount,
    description: primary.description || fallback.description,
    hasElevator: primary.hasElevator ?? fallback.hasElevator,
    yearBuilt: primary.yearBuilt ?? fallback.yearBuilt,
    energyClass: primary.energyClass ?? fallback.energyClass,
    ownership: primary.ownership ?? fallback.ownership,
    address: primary.address || fallback.address,
  };
}

/** Parse raw text content (from Apify crawler) */
function parseFromRawText(text: string, url: string, source: ListingDetails["source"]): ListingDetails {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let title = "";
  let priceTotal = 0;
  let areaM2 = 0;
  let rooms = "";
  let districtText = "";

  for (const line of lines) {
    if (line.match(/[\d\s]+(?:Kč|CZK)/i)) {
      const price = parseInt(line.replace(/[^\d]/g, ""), 10);
      if (price > 500000 && price > priceTotal) priceTotal = price;
    }
    if (line.match(/\d+\s*m[²2]/) && !areaM2) {
      const match = line.match(/([\d,.\s]+)\s*m[²2]/);
      if (match) areaM2 = parseFloat(match[1].replace(",", ".").replace(/\s/g, ""));
    }
    if (line.match(/\d\+(?:kk|\d)/i) && !rooms) {
      const match = line.match(/(\d\+(?:kk|\d))/i);
      if (match) rooms = match[1].toLowerCase();
    }
    if (line.match(/[Pp]rah[ae]/i) && line.length < 100 && !districtText) {
      districtText = line;
    }
    if (!title && line.length > 10 && line.length < 150 && line.match(/byt|flat|apart/i)) {
      title = line;
    }
  }

  const districtId = extractDistrictId(districtText || url.replace(/-/g, " "));

  return {
    url,
    source,
    title: title || "Property listing",
    priceTotal,
    pricePerM2: areaM2 > 0 ? Math.round(priceTotal / areaM2) : 0,
    areaM2,
    floor: 0,
    totalFloors: 0,
    condition: "good",
    buildingType: "other",
    district: districtText || `Praha ${districtId}`,
    districtId,
    rooms,
    photos: [],
    photoCount: 0,
    description: lines.slice(0, 40).join(" "),
  };
}

/**
 * Scrape SReality search results for comparables using the dedicated actor.
 * Falls back to empty array if Apify is not configured.
 */
export async function scrapeComparables(districtId: number, rooms?: string): Promise<SrealityScraperOutput[]> {
  if (!process.env.APIFY_API_TOKEN) return [];

  const area = `Praha ${districtId}`;

  try {
    const results = await runActor<SrealityScraperOutput>("bebich/sreality-scraper", {
      CITY: ["Praha"],
      AREA: [area],
    });

    if (rooms && results.length > 0) {
      const filtered = results.filter((r: SrealityScraperOutput) => {
        const rTitle = (r.title || "").toLowerCase();
        return rTitle.includes(rooms.toLowerCase());
      });
      return filtered.length > 0 ? filtered : results.slice(0, 10);
    }

    return results.slice(0, 20);
  } catch (error) {
    console.error("Comparables scrape failed:", error);
    return [];
  }
}
