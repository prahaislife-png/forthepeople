import { NextRequest } from "next/server";
import type { PriceCheckResult } from "@/app/lib/services-types";
import { scrapeListing, scrapeComparables } from "@/app/lib/listing-scraper";
import { detectSource } from "@/app/lib/listing-parsers/common";
import { parseSrealityActor } from "@/app/lib/listing-parsers/sreality";
import { runAnalysis, type AnalysisContext } from "@/app/lib/price-analysis/indicators";
import { getDistrict } from "@/app/data/districts";
import { getCached, setCache } from "@/app/lib/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for scraping

// City-wide average crime per capita for comparison
const CITY_AVG_CRIME_PER_CAPITA = 0.045; // ~4.5% incidents per person

// Transit scores per district (0-100, based on metro/tram coverage)
const TRANSIT_SCORES: Record<number, number> = {
  1: 95, 2: 90, 3: 80, 4: 70, 5: 85, 6: 75, 7: 82, 8: 78,
  9: 65, 10: 72, 11: 55, 12: 50, 13: 52, 14: 48, 15: 45,
  16: 35, 17: 50, 18: 42, 19: 38, 20: 35, 21: 32, 22: 30,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url: string; tier?: "free" | "paid" };
    const { url, tier = "free" } = body;

    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check cache (results valid for 24 hours)
    const cacheKey = `price_check:${url}:${tier}`;
    const cached = getCached<PriceCheckResult>(cacheKey, 24 * 60 * 60 * 1000);
    if (cached) {
      return Response.json(cached);
    }

    // Step 1: Scrape the listing
    let listing;
    try {
      listing = await scrapeListing(url);
    } catch (scrapeError) {
      console.error("Scrape failed:", scrapeError);
      return Response.json(
        { error: "Unable to analyze this listing. Please check the URL is valid and points to a Czech real estate listing (sreality.cz, bezrealitky.cz, etc.)." },
        { status: 422 }
      );
    }

    // If district not detected, default to Praha 5
    if (!listing.districtId) {
      listing.districtId = 5;
      listing.district = "Praha 5";
    }

    // Ensure we have minimum data to run analysis
    if (!listing.areaM2) listing.areaM2 = 55; // default apartment size
    if (!listing.priceTotal) {
      const d = getDistrict(listing.districtId);
      listing.priceTotal = Math.round(d.housing.avgSaleM2 * listing.areaM2);
      listing.pricePerM2 = d.housing.avgSaleM2;
    }

    // Step 2: Enrich with district data
    const d = getDistrict(listing.districtId);
    const districtContext: AnalysisContext["district"] = {
      avgSaleM2: d.housing.avgSaleM2,
      avgRentM2: d.housing.avgRentM2,
      noiseAvgDb: d.noiseMaps.dayAvgDb,
      airQualityAqi: d.airQuality.pm25 * 2, // rough AQI from PM2.5
      crimePerCapita: d.crime.total2023 / d.population,
      cityAvgCrimePerCapita: CITY_AVG_CRIME_PER_CAPITA,
      transitScore: TRANSIT_SCORES[listing.districtId] || 50,
      population: d.population,
      schoolsPrimary: d.schools.primary,
      schoolsKindergarten: d.schools.kindergarten,
      parksTotal: d.greenSpace.totalHa > 50 ? 12 : d.greenSpace.totalHa > 20 ? 8 : 5,
      energyHeatPriceGJ: d.energy.avgAnnualHeatBill ? d.energy.avgAnnualHeatBill / (d.housing.avgRentM2 ? 60 : 60) : 850,
    };

    // Step 3: Fetch comparables (only for paid tier — expensive Apify call)
    let comparables: AnalysisContext["comparables"] = undefined;
    if (tier === "paid") {
      try {
        const rawComparables = await scrapeComparables(listing.districtId, listing.rooms);
        if (rawComparables.length > 0) {
          comparables = rawComparables.slice(0, 8).map(item => {
            const parsed = parseSrealityActor(item, item.url || "");
            return {
              title: item.title || parsed.title,
              pricePerM2: parsed.pricePerM2 || districtContext.avgSaleM2,
              areaM2: parsed.areaM2 || 50,
              address: item.locality || parsed.district,
              url: item.url,
              rooms: parsed.rooms,
            };
          });
        }
      } catch (compError) {
        console.error("Comparables fetch failed (non-fatal):", compError);
        // Continue without comparables — analysis still works with district data
      }
    }

    // Step 4: Run analysis
    const analysisContext: AnalysisContext = {
      listing,
      district: districtContext,
      comparables,
    };

    const result = runAnalysis(analysisContext, tier);

    // Cache the result
    setCache(cacheKey, result);

    return Response.json(result);
  } catch (err) {
    console.error("Price check failed:", err);
    return Response.json(
      { error: "Analysis failed. Please try again or check that the URL is accessible." },
      { status: 500 }
    );
  }
}
