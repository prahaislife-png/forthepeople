/**
 * Listing scraper orchestrator.
 * Uses Apify actors to scrape real estate listing pages from Czech sites.
 *
 * For single listing scraping: uses apify/website-content-crawler
 * For comparables search (SReality): uses bebich/sreality-scraper (takes CITY/AREA params)
 */

import { runActor } from "./apify";
import type { ListingDetails } from "./services-types";
import { detectSource } from "./listing-parsers/common";
import { parseSrealityActor, parseSrealityRawText, type SrealityScraperOutput } from "./listing-parsers/sreality";
import { parseBezrealitkyRawText } from "./listing-parsers/bezrealitky";

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
 * Uses Apify's website-content-crawler to fetch and render the page.
 */
export async function scrapeListing(url: string): Promise<ListingDetails> {
  const source = detectSource(url);

  // First, try the dedicated SReality scraper for SReality URLs
  if (source === "sreality") {
    try {
      return await scrapeSrealityDedicated(url);
    } catch {
      // Fall through to generic crawler
    }
  }

  // Generic approach: use website-content-crawler
  const results = await runActor<CrawlerOutput>("apify/website-content-crawler", {
    startUrls: [{ url }],
    maxCrawlPages: 1,
    crawlerType: "playwright:firefox",
    maxConcurrency: 1,
    proxyConfiguration: { useApifyProxy: true },
    // Only get text content, skip images
    saveHtml: false,
    saveMarkdown: false,
  });

  if (!results || results.length === 0) {
    throw new Error(`Failed to scrape listing: no results from crawler`);
  }

  const page = results[0];
  const text = page.text || "";

  // Parse based on detected source
  switch (source) {
    case "sreality":
      return parseSrealityRawText(text, url);
    case "bezrealitky":
      return parseBezrealitkyRawText(text, url);
    default:
      // Generic parser — try to extract what we can from any page
      return parseGenericListing(text, url, source);
  }
}

/**
 * Use the dedicated bebich/sreality-scraper for SReality listings.
 * This actor is designed specifically for SReality and returns structured data.
 * Note: it takes CITY/AREA for search, so we extract from the URL.
 */
async function scrapeSrealityDedicated(url: string): Promise<ListingDetails> {
  // The bebich/sreality-scraper is primarily for search results.
  // For a single listing, we use the website-content-crawler and parse.
  // But if the URL contains district/city info, we can get contextual data.

  // For now, use the generic crawler for single listings
  const results = await runActor<CrawlerOutput>("apify/website-content-crawler", {
    startUrls: [{ url }],
    maxCrawlPages: 1,
    crawlerType: "playwright:firefox",
    maxConcurrency: 1,
    proxyConfiguration: { useApifyProxy: true },
    saveHtml: false,
    saveMarkdown: false,
  });

  if (!results || results.length === 0) {
    throw new Error("Failed to scrape SReality listing");
  }

  return parseSrealityRawText(results[0].text || "", url);
}

/**
 * Scrape SReality search results for comparables using the dedicated actor.
 * Uses bebich/sreality-scraper which is specifically built for SReality search.
 *
 * Input: { CITY: ["Praha"], AREA: ["Praha 7"] }
 * Output: Array of listing summaries with prices, areas, etc.
 */
export async function scrapeComparables(districtId: number, rooms?: string): Promise<SrealityScraperOutput[]> {
  const area = `Praha ${districtId}`;

  try {
    const results = await runActor<SrealityScraperOutput>("bebich/sreality-scraper", {
      CITY: ["Praha"],
      AREA: [area],
      // Additional filters if possible
    });

    // Filter to matching room count if provided
    if (rooms && results.length > 0) {
      const filtered = results.filter(r => {
        const title = (r.title || "").toLowerCase();
        return title.includes(rooms.toLowerCase());
      });
      return filtered.length > 0 ? filtered : results.slice(0, 10);
    }

    return results.slice(0, 20);
  } catch (error) {
    console.error("Comparables scrape failed:", error);
    return [];
  }
}

/** Generic parser for non-specifically-supported sites */
function parseGenericListing(text: string, url: string, source: ListingDetails["source"]): ListingDetails {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let title = "";
  let priceTotal = 0;
  let areaM2 = 0;
  let rooms = "";
  let floor = 0;
  let totalFloors = 0;
  let description = "";
  let districtText = "";

  for (const line of lines) {
    // Price (largest number with Kč)
    if (line.match(/[\d\s]+(?:Kč|CZK)/i)) {
      const price = parseInt(line.replace(/[^\d]/g, ""), 10);
      if (price > 500000 && price > priceTotal) priceTotal = price;
    }

    // Area
    if (line.match(/\d+\s*m[²2]/)) {
      const match = line.match(/([\d,.\s]+)\s*m[²2]/);
      if (match) {
        const area = parseFloat(match[1].replace(",", ".").replace(/\s/g, ""));
        if (area > 10 && area < 500 && !areaM2) areaM2 = area;
      }
    }

    // Rooms
    if (line.match(/\d\+(?:kk|\d)/i) && !rooms) {
      const match = line.match(/(\d\+(?:kk|\d))/i);
      if (match) rooms = match[1].toLowerCase();
    }

    // District
    if (line.match(/[Pp]rah[ae]/i) && line.length < 100 && !districtText) {
      districtText = line;
    }

    // Title (first short descriptive line)
    if (!title && line.length > 10 && line.length < 150 && line.match(/byt|flat|apart/i)) {
      title = line;
    }
  }

  description = lines.slice(0, 40).join(" ");
  const districtId = districtText ? extractDistrictIdFromText(districtText) : 0;

  return {
    url,
    source,
    title: title || `Property listing`,
    priceTotal,
    pricePerM2: areaM2 > 0 ? Math.round(priceTotal / areaM2) : 0,
    areaM2,
    floor,
    totalFloors,
    condition: "good",
    buildingType: "other",
    district: districtText || "Praha",
    districtId,
    rooms,
    photos: [],
    photoCount: 0,
    description,
  };
}

function extractDistrictIdFromText(text: string): number {
  const match = text.match(/[Pp]rah[ae][\s\-]*(\d{1,2})/);
  return match ? parseInt(match[1]) : 0;
}
