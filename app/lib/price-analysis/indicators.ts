/**
 * All 18 price indicators computation.
 * Generates both free (4) and paid (14) indicators from listing + district data.
 */

import type { ListingDetails, PriceIndicator, PriceCheckResult, PriceVerdict } from "../services-types";
import { computeFairPrice, type DistrictContext, type HedonicResult } from "./hedonic-model";
import { generateRedFlags, type RedFlag } from "./red-flags";
import { estimateRenovation, type RenovationEstimate } from "./renovation-estimate";

export interface AnalysisContext {
  listing: ListingDetails;
  district: DistrictContext & {
    avgRentM2?: number;
    population?: number;
    schoolsPrimary?: number;
    schoolsKindergarten?: number;
    parksTotal?: number;
    energyHeatPriceGJ?: number;
  };
  comparables?: { title: string; pricePerM2: number; areaM2: number; address: string; url?: string; rooms?: string }[];
}

/**
 * Run the full analysis pipeline and generate the PriceCheckResult.
 */
export function runAnalysis(ctx: AnalysisContext, tier: "free" | "paid"): PriceCheckResult {
  const { listing, district } = ctx;

  // Step 1: Compute fair price via hedonic model
  const hedonic = computeFairPrice(listing, district);

  // Step 2: Determine verdict
  const priceDiff = listing.priceTotal - hedonic.fairPriceTotal;
  const priceDiffPct = listing.priceTotal > 0 ? (priceDiff / hedonic.fairPriceTotal) * 100 : 0;
  const verdict = getVerdict(priceDiffPct);

  // Step 3: Generate red flags
  const redFlags = generateRedFlags(listing, {
    noiseAvgDb: district.noiseAvgDb,
    airQualityAqi: district.airQualityAqi,
    crimePerCapita: district.crimePerCapita,
    cityAvgCrimePerCapita: district.cityAvgCrimePerCapita,
    districtAvgPriceM2: district.avgSaleM2,
  });

  // Step 4: Compute renovation estimate
  const renovation = estimateRenovation(listing);

  // Step 5: Compute investment yield
  const investmentYield = computeInvestmentYield(listing, district.avgRentM2);

  // Step 6: Compute total cost of ownership (5 years)
  const tco5yr = computeTotalCostOfOwnership(listing, renovation, district.energyHeatPriceGJ);

  // Step 7: Generate all 18 indicators
  const allIndicators = generateIndicators(listing, hedonic, district, redFlags, renovation, investmentYield, tco5yr);
  const freeIndicators = allIndicators.filter(i => i.tier === "free");
  const paidIndicators = allIndicators.filter(i => i.tier === "paid");

  // Step 8: Compute district averages from comparables or static data
  const districtAverages = computeDistrictAverages(district, ctx.comparables);

  // Step 9: Commute times (estimated from district transit score)
  const commuteTimes = estimateCommuteTimes(district.transitScore);

  // Step 10: Generate summary
  const summary = generateSummary(listing, verdict, priceDiffPct, hedonic, redFlags);

  return {
    id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    listing,
    verdict,
    verdictConfidence: hedonic.confidence,
    estimatedFairPrice: hedonic.fairPriceTotal,
    priceDifference: Math.round(priceDiff),
    priceDifferencePercent: Math.round(priceDiffPct * 10) / 10,
    indicators: tier === "paid" ? allIndicators : freeIndicators,
    freeIndicators,
    paidIndicators: tier === "paid" ? paidIndicators : paidIndicators.map(i => ({ ...i, rawValue: "🔒", explanation: "Unlock full report to see this indicator" })),
    comparables: tier === "paid" ? (ctx.comparables || []) : [],
    districtAverages,
    commuteTimes: tier === "paid" ? commuteTimes : [],
    redFlags: tier === "paid" ? redFlags : redFlags.slice(0, 1), // free: only top flag
    renovationEstimate: tier === "paid" ? renovation : undefined,
    investmentYield: tier === "paid" ? investmentYield : undefined,
    totalCostOfOwnership5yr: tier === "paid" ? tco5yr : undefined,
    summary,
    createdAt: new Date().toISOString(),
  };
}

function getVerdict(priceDiffPct: number): PriceVerdict {
  if (priceDiffPct > 10) return "overpriced";
  if (priceDiffPct < -8) return "underpriced";
  return "fair";
}

function generateIndicators(
  listing: ListingDetails,
  hedonic: HedonicResult,
  district: AnalysisContext["district"],
  redFlags: RedFlag[],
  renovation: RenovationEstimate,
  investmentYield: PriceCheckResult["investmentYield"],
  tco5yr: number
): PriceIndicator[] {
  const indicators: PriceIndicator[] = [];
  const priceDiffPct = listing.priceTotal > 0
    ? ((listing.priceTotal - hedonic.fairPriceTotal) / hedonic.fairPriceTotal) * 100
    : 0;

  // === FREE INDICATORS (1-4) ===

  // 1. Price vs District Average
  const vsAvgPct = district.avgSaleM2 > 0
    ? ((listing.pricePerM2 - district.avgSaleM2) / district.avgSaleM2) * 100
    : 0;
  indicators.push({
    id: "price_vs_average",
    name: "Price vs. District Average",
    nameCz: "Cena vs. průměr čtvrti",
    category: "price",
    tier: "free",
    value: Math.max(0, Math.min(100, 50 - vsAvgPct)),
    rawValue: `${vsAvgPct > 0 ? "+" : ""}${Math.round(vsAvgPct)}% vs. Praha ${listing.districtId} average`,
    impact: vsAvgPct > 10 ? "negative" : vsAvgPct < -5 ? "positive" : "neutral",
    weight: 0.25,
    explanation: `The listing price is ${Math.abs(Math.round(vsAvgPct))}% ${vsAvgPct > 0 ? "above" : "below"} the average price of ${district.avgSaleM2.toLocaleString()} Kč/m² in Praha ${listing.districtId}.`,
    explanationCz: `Cena inzerátu je ${Math.abs(Math.round(vsAvgPct))} % ${vsAvgPct > 0 ? "nad" : "pod"} průměrnou cenou ${district.avgSaleM2.toLocaleString()} Kč/m² v Praze ${listing.districtId}.`,
  });

  // 2. Overall Verdict
  const verdictScore = Math.max(0, Math.min(100, 50 - priceDiffPct * 2));
  indicators.push({
    id: "verdict",
    name: "Price Verdict",
    nameCz: "Cenový verdikt",
    category: "price",
    tier: "free",
    value: verdictScore,
    rawValue: priceDiffPct > 10 ? "Overpriced" : priceDiffPct < -8 ? "Underpriced (Bargain)" : "Fair Price",
    impact: priceDiffPct > 10 ? "negative" : priceDiffPct < -8 ? "positive" : "neutral",
    weight: 0.3,
    explanation: `Based on ${Object.values(hedonic.factors).filter(f => f !== 1.0).length} factors, the fair price estimate is ${hedonic.fairPriceTotal.toLocaleString()} Kč (confidence: ${hedonic.confidence}%).`,
    explanationCz: `Na základě ${Object.values(hedonic.factors).filter(f => f !== 1.0).length} faktorů je odhadovaná férová cena ${hedonic.fairPriceTotal.toLocaleString()} Kč (spolehlivost: ${hedonic.confidence} %).`,
  });

  // 3. Estimated Fair Price
  indicators.push({
    id: "fair_price",
    name: "Estimated Fair Price",
    nameCz: "Odhadovaná férová cena",
    category: "price",
    tier: "free",
    value: hedonic.confidence,
    rawValue: `${hedonic.fairPriceTotal.toLocaleString()} Kč (${hedonic.fairPricePerM2.toLocaleString()} Kč/m²)`,
    impact: "neutral",
    weight: 0.3,
    explanation: `Our hedonic model estimates this property should cost approximately ${hedonic.fairPriceTotal.toLocaleString()} Kč. The listed price is ${listing.priceTotal.toLocaleString()} Kč — a difference of ${Math.abs(Math.round(priceDiffPct))}%.`,
    explanationCz: `Náš hedonický model odhaduje, že by tato nemovitost měla stát přibližně ${hedonic.fairPriceTotal.toLocaleString()} Kč. Uvedená cena je ${listing.priceTotal.toLocaleString()} Kč — rozdíl ${Math.abs(Math.round(priceDiffPct))} %.`,
  });

  // 4. Top Red Flag (or "No issues found")
  const topFlag = redFlags[0];
  indicators.push({
    id: "top_red_flag",
    name: "Key Finding",
    nameCz: "Klíčové zjištění",
    category: "building",
    tier: "free",
    value: topFlag ? (topFlag.severity === "high" ? 20 : topFlag.severity === "medium" ? 50 : 75) : 90,
    rawValue: topFlag ? topFlag.description : "No significant issues found",
    impact: topFlag ? (topFlag.severity === "high" ? "negative" : "neutral") : "positive",
    weight: 0.15,
    explanation: topFlag
      ? `We found ${redFlags.length} potential issue${redFlags.length > 1 ? "s" : ""}. The most important: ${topFlag.description}`
      : "No significant red flags detected. The listing appears transparent and well-documented.",
    explanationCz: topFlag
      ? `Nalezli jsme ${redFlags.length} potenciální${redFlags.length > 1 ? "ch" : ""} problém${redFlags.length > 1 ? "ů" : ""}. Nejdůležitější: ${topFlag.descriptionCz}`
      : "Nebyly nalezeny žádné významné varovné signály.",
  });

  // === PAID INDICATORS (5-18) ===

  // 5. Comparable Listings
  indicators.push({
    id: "comparables",
    name: "Market Comparables",
    nameCz: "Srovnatelné nabídky",
    category: "market",
    tier: "paid",
    value: 50,
    rawValue: `Based on similar listings in Praha ${listing.districtId}`,
    impact: "neutral",
    weight: 0.2,
    explanation: "Comparison with similar properties currently listed in the same district and room configuration.",
    explanationCz: "Srovnání s podobnými nemovitostmi aktuálně nabízenými ve stejné čtvrti a dispozici.",
  });

  // 6. Noise Level Impact
  const noiseDb = district.noiseAvgDb || 58;
  indicators.push({
    id: "noise_impact",
    name: "Noise Level",
    nameCz: "Hladina hluku",
    category: "environment",
    tier: "paid",
    value: Math.max(0, Math.min(100, 100 - (noiseDb - 45) * 3)),
    rawValue: `${noiseDb} dB (district avg)`,
    impact: noiseDb > 65 ? "negative" : noiseDb < 55 ? "positive" : "neutral",
    weight: 0.06,
    explanation: `The district average noise level is ${noiseDb} dB. WHO recommends below 55 dB for residential areas. Factor: ${(hedonic.factors.noise * 100 - 100).toFixed(1)}% price impact.`,
    explanationCz: `Průměrná hladina hluku ve čtvrti je ${noiseDb} dB. WHO doporučuje pod 55 dB. Faktor: ${(hedonic.factors.noise * 100 - 100).toFixed(1)} % vliv na cenu.`,
  });

  // 7. Air Quality
  const aqi = district.airQualityAqi || 35;
  indicators.push({
    id: "air_quality",
    name: "Air Quality",
    nameCz: "Kvalita ovzduší",
    category: "environment",
    tier: "paid",
    value: Math.max(0, Math.min(100, 100 - aqi)),
    rawValue: `AQI ${aqi}`,
    impact: aqi > 60 ? "negative" : aqi < 30 ? "positive" : "neutral",
    weight: 0.05,
    explanation: `Air Quality Index (AQI) for this district is ${aqi}. Below 25 is excellent, 25-50 is good, above 50 is moderate.`,
    explanationCz: `Index kvality ovzduší (AQI) pro tuto čtvrť je ${aqi}. Pod 25 je vynikající, 25-50 dobrý, nad 50 středně kvalitní.`,
  });

  // 8. Crime Safety
  const crimeRatio = (district.crimePerCapita && district.cityAvgCrimePerCapita)
    ? district.crimePerCapita / district.cityAvgCrimePerCapita
    : 1.0;
  indicators.push({
    id: "crime_safety",
    name: "Safety Score",
    nameCz: "Skóre bezpečnosti",
    category: "location",
    tier: "paid",
    value: Math.max(0, Math.min(100, Math.round(100 - (crimeRatio - 0.5) * 80))),
    rawValue: crimeRatio < 0.9 ? "Below average crime" : crimeRatio > 1.2 ? "Above average crime" : "Average",
    impact: crimeRatio > 1.3 ? "negative" : crimeRatio < 0.8 ? "positive" : "neutral",
    weight: 0.07,
    explanation: `Crime rate in this district is ${Math.round(crimeRatio * 100)}% of the city average. Lower is better.`,
    explanationCz: `Míra kriminality v této čtvrti je ${Math.round(crimeRatio * 100)} % městského průměru. Nižší je lepší.`,
  });

  // 9. Transit Accessibility
  const transitScore = district.transitScore || 60;
  indicators.push({
    id: "transit",
    name: "Transit Accessibility",
    nameCz: "Dostupnost MHD",
    category: "location",
    tier: "paid",
    value: transitScore,
    rawValue: transitScore >= 80 ? "Excellent" : transitScore >= 60 ? "Good" : transitScore >= 40 ? "Average" : "Below average",
    impact: transitScore >= 75 ? "positive" : transitScore < 40 ? "negative" : "neutral",
    weight: 0.08,
    explanation: `Transit score: ${transitScore}/100. Based on metro/tram/bus connectivity in the district.`,
    explanationCz: `Skóre dostupnosti MHD: ${transitScore}/100. Na základě spojení metrem/tramvají/autobusem.`,
  });

  // 10. Green Space
  const parks = district.parksTotal || 5;
  indicators.push({
    id: "green_space",
    name: "Green Space",
    nameCz: "Zelené plochy",
    category: "location",
    tier: "paid",
    value: Math.min(100, parks * 8),
    rawValue: `${parks} parks in district`,
    impact: parks >= 8 ? "positive" : parks <= 3 ? "negative" : "neutral",
    weight: 0.04,
    explanation: `There are ${parks} parks and green spaces in this district. More green areas generally improve quality of life and property values.`,
    explanationCz: `V této čtvrti je ${parks} parků a zelených ploch. Více zelených ploch obecně zlepšuje kvalitu života.`,
  });

  // 11. School Density
  const schools = (district.schoolsPrimary || 0) + (district.schoolsKindergarten || 0);
  indicators.push({
    id: "schools",
    name: "Schools & Kindergartens",
    nameCz: "Školy a školky",
    category: "location",
    tier: "paid",
    value: Math.min(100, schools * 5),
    rawValue: `${schools} schools/kindergartens nearby`,
    impact: schools >= 15 ? "positive" : schools <= 5 ? "negative" : "neutral",
    weight: 0.04,
    explanation: `${schools} educational facilities (primary schools + kindergartens) in the district. Important for families.`,
    explanationCz: `${schools} vzdělávacích zařízení (ZŠ + MŠ) ve čtvrti. Důležité pro rodiny.`,
  });

  // 12. Floor Premium/Discount
  const floorImpact = (hedonic.factors.floor - 1) * 100;
  indicators.push({
    id: "floor_factor",
    name: "Floor Factor",
    nameCz: "Faktor podlaží",
    category: "building",
    tier: "paid",
    value: Math.round(50 + floorImpact * 10),
    rawValue: listing.floor > 0 ? `${listing.floor}/${listing.totalFloors || "?"} floor${listing.hasElevator ? " (elevator)" : listing.hasElevator === false ? " (no elevator)" : ""}` : "Unknown",
    impact: floorImpact > 0.02 ? "positive" : floorImpact < -0.02 ? "negative" : "neutral",
    weight: 0.05,
    explanation: `Floor ${listing.floor}${listing.totalFloors ? ` of ${listing.totalFloors}` : ""}. Price impact: ${floorImpact > 0 ? "+" : ""}${floorImpact.toFixed(1)}%.`,
    explanationCz: `${listing.floor}. patro${listing.totalFloors ? ` z ${listing.totalFloors}` : ""}. Vliv na cenu: ${floorImpact > 0 ? "+" : ""}${floorImpact.toFixed(1)} %.`,
  });

  // 13. Condition Adjustment
  const condImpact = (hedonic.factors.condition - 1) * 100;
  indicators.push({
    id: "condition_factor",
    name: "Condition Factor",
    nameCz: "Stav nemovitosti",
    category: "building",
    tier: "paid",
    value: Math.round(50 + condImpact * 2),
    rawValue: listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1).replace("_", " "),
    impact: condImpact > 5 ? "positive" : condImpact < -5 ? "negative" : "neutral",
    weight: 0.12,
    explanation: `Property condition: "${listing.condition}". Price impact: ${condImpact > 0 ? "+" : ""}${condImpact.toFixed(0)}% relative to average condition.`,
    explanationCz: `Stav nemovitosti: "${listing.condition}". Vliv na cenu: ${condImpact > 0 ? "+" : ""}${condImpact.toFixed(0)} % oproti průměrnému stavu.`,
  });

  // 14. Building Type
  const buildImpact = (hedonic.factors.buildingType - 1) * 100;
  indicators.push({
    id: "building_type",
    name: "Building Type",
    nameCz: "Typ budovy",
    category: "building",
    tier: "paid",
    value: Math.round(50 + buildImpact * 5),
    rawValue: listing.buildingType === "panel" ? "Panel (panelák)" : listing.buildingType === "brick" ? "Brick (cihla)" : "Other",
    impact: buildImpact > 2 ? "positive" : buildImpact < -2 ? "negative" : "neutral",
    weight: 0.06,
    explanation: `${listing.buildingType === "panel" ? "Panel buildings have ~6% lower value. " : listing.buildingType === "brick" ? "Brick buildings command ~4% premium. " : ""}Price impact: ${buildImpact > 0 ? "+" : ""}${buildImpact.toFixed(1)}%.`,
    explanationCz: `${listing.buildingType === "panel" ? "Panelové domy mají ~6% nižší hodnotu. " : listing.buildingType === "brick" ? "Cihlové domy mají ~4% prémii. " : ""}Vliv: ${buildImpact > 0 ? "+" : ""}${buildImpact.toFixed(1)} %.`,
  });

  // 15. Energy Cost Estimate
  const annualEnergy = district.energyHeatPriceGJ
    ? Math.round(district.energyHeatPriceGJ * listing.areaM2 * 0.15) // ~0.15 GJ/m²/year avg
    : Math.round(listing.areaM2 * 2500); // rough estimate 2500 Kč/m²/year
  indicators.push({
    id: "energy_cost",
    name: "Annual Energy Cost",
    nameCz: "Roční náklady na energie",
    category: "investment",
    tier: "paid",
    value: Math.max(0, Math.min(100, 100 - annualEnergy / 500)),
    rawValue: `~${annualEnergy.toLocaleString()} Kč/year`,
    impact: annualEnergy > 50000 ? "negative" : annualEnergy < 25000 ? "positive" : "neutral",
    weight: 0.04,
    explanation: `Estimated annual heating + energy costs based on district energy prices and apartment size (${listing.areaM2} m²).`,
    explanationCz: `Odhadované roční náklady na vytápění a energie na základě cen v čtvrti a velikosti bytu (${listing.areaM2} m²).`,
  });

  // 16. Renovation Estimate
  indicators.push({
    id: "renovation",
    name: "Renovation Estimate",
    nameCz: "Odhad rekonstrukce",
    category: "investment",
    tier: "paid",
    value: renovation.needed ? Math.max(0, 100 - Math.round(renovation.estimatedCostCZK / 10000)) : 90,
    rawValue: renovation.needed ? `~${renovation.estimatedCostCZK.toLocaleString()} Kč needed` : "No renovation needed",
    impact: renovation.estimatedCostCZK > 300000 ? "negative" : renovation.needed ? "neutral" : "positive",
    weight: 0.08,
    explanation: renovation.needed
      ? `Based on "${listing.condition}" condition, estimated renovation: ${renovation.estimatedCostCZK.toLocaleString()} Kč (${renovation.items.length} items).`
      : "Property is in good/new condition. No immediate renovation budget needed.",
    explanationCz: renovation.needed
      ? `Na základě stavu "${listing.condition}" odhadovaná rekonstrukce: ${renovation.estimatedCostCZK.toLocaleString()} Kč (${renovation.items.length} položek).`
      : "Nemovitost je v dobrém/novém stavu. Není potřeba rekonstrukce.",
  });

  // 17. Total Cost of Ownership (5 years)
  indicators.push({
    id: "tco_5yr",
    name: "5-Year Total Cost",
    nameCz: "Celkové náklady na 5 let",
    category: "investment",
    tier: "paid",
    value: Math.max(0, Math.min(100, Math.round(100 - (tco5yr - listing.priceTotal) / listing.priceTotal * 200))),
    rawValue: `~${tco5yr.toLocaleString()} Kč`,
    impact: "neutral",
    weight: 0.06,
    explanation: `Total projected cost over 5 years: purchase price + renovation + energy + property tax + maintenance. Budget ${(tco5yr - listing.priceTotal).toLocaleString()} Kč beyond purchase price.`,
    explanationCz: `Celkové předpokládané náklady za 5 let: kupní cena + rekonstrukce + energie + daně + údržba. Počítejte s ${(tco5yr - listing.priceTotal).toLocaleString()} Kč nad kupní cenou.`,
  });

  // 18. Investment Yield
  const grossYield = investmentYield?.grossYield || 0;
  indicators.push({
    id: "investment_yield",
    name: "Rental Investment Yield",
    nameCz: "Investiční výnos z pronájmu",
    category: "investment",
    tier: "paid",
    value: Math.min(100, Math.round(grossYield * 20)), // 5% yield = 100 score
    rawValue: `${grossYield.toFixed(1)}% gross yield`,
    impact: grossYield > 4 ? "positive" : grossYield < 2.5 ? "negative" : "neutral",
    weight: 0.06,
    explanation: investmentYield
      ? `If rented at district avg (${investmentYield.monthlyRentEstimate.toLocaleString()} Kč/month), gross yield is ${grossYield.toFixed(1)}%, net ~${investmentYield.netYield.toFixed(1)}% after expenses.`
      : "Unable to compute — missing rental data.",
    explanationCz: investmentYield
      ? `Při pronájmu za průměr čtvrti (${investmentYield.monthlyRentEstimate.toLocaleString()} Kč/měsíc) je hrubý výnos ${grossYield.toFixed(1)} %, čistý ~${investmentYield.netYield.toFixed(1)} % po nákladech.`
      : "Nelze vypočítat — chybí data o pronájmu.",
  });

  return indicators;
}

function computeInvestmentYield(
  listing: ListingDetails,
  avgRentM2?: number
): PriceCheckResult["investmentYield"] {
  if (!avgRentM2 || listing.priceTotal <= 0) return undefined;

  const monthlyRent = Math.round(avgRentM2 * listing.areaM2);
  const annualRent = monthlyRent * 12;
  const annualExpenses = Math.round(monthlyRent * 12 * 0.25); // ~25% for maintenance, vacancy, fees
  const grossYield = (annualRent / listing.priceTotal) * 100;
  const netYield = ((annualRent - annualExpenses) / listing.priceTotal) * 100;

  return {
    grossYield: Math.round(grossYield * 10) / 10,
    netYield: Math.round(netYield * 10) / 10,
    monthlyRentEstimate: monthlyRent,
    annualExpenses,
  };
}

function computeTotalCostOfOwnership(
  listing: ListingDetails,
  renovation: RenovationEstimate,
  energyPriceGJ?: number
): number {
  const annualEnergy = energyPriceGJ
    ? Math.round(energyPriceGJ * listing.areaM2 * 0.15)
    : Math.round(listing.areaM2 * 2500);

  const annualPropertyTax = Math.round(listing.areaM2 * 25); // ~25 Kč/m²/year
  const annualMaintenance = Math.round(listing.priceTotal * 0.01); // 1% of value
  const annualFees = Math.round(listing.areaM2 * 50 * 12); // ~50 Kč/m²/month common charges

  const fiveYearCosts = listing.priceTotal
    + renovation.estimatedCostCZK
    + (annualEnergy * 5)
    + (annualPropertyTax * 5)
    + (annualMaintenance * 5)
    + (annualFees * 5);

  return Math.round(fiveYearCosts);
}

function computeDistrictAverages(
  district: AnalysisContext["district"],
  comparables?: AnalysisContext["comparables"]
): PriceCheckResult["districtAverages"] {
  if (comparables && comparables.length >= 3) {
    const prices = comparables.map(c => c.pricePerM2).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    return {
      avgPriceM2: avg,
      medianPriceM2: median,
      priceRange: [prices[0], prices[prices.length - 1]],
    };
  }

  // Fallback to static district data
  const avg = district.avgSaleM2;
  return {
    avgPriceM2: avg,
    medianPriceM2: Math.round(avg * 0.95), // median typically slightly below avg
    priceRange: [Math.round(avg * 0.7), Math.round(avg * 1.4)],
  };
}

function estimateCommuteTimes(transitScore?: number): PriceCheckResult["commuteTimes"] {
  const baseMinutes = transitScore ? Math.round(25 - transitScore * 0.15) : 20;
  return [
    { destination: "Nearest metro station", minutes: Math.max(3, baseMinutes - 10), mode: "tram" },
    { destination: "City center (Můstek)", minutes: Math.max(8, baseMinutes), mode: "metro" },
    { destination: "Main train station", minutes: Math.max(10, baseMinutes + 5), mode: "metro" },
    { destination: "Airport (Václav Havel)", minutes: Math.max(25, 45 - (transitScore || 60) * 0.2), mode: "bus" },
  ];
}

function generateSummary(
  listing: ListingDetails,
  verdict: PriceVerdict,
  priceDiffPct: number,
  hedonic: HedonicResult,
  redFlags: RedFlag[]
): string {
  const diff = Math.abs(Math.round(priceDiffPct));
  const highFlags = redFlags.filter(f => f.severity === "high").length;

  let summary = "";

  if (verdict === "overpriced") {
    summary = `This ${listing.rooms} apartment in ${listing.district} appears to be overpriced by approximately ${diff}%. `;
    summary += `Our model estimates a fair price of ${hedonic.fairPriceTotal.toLocaleString()} Kč (${hedonic.fairPricePerM2.toLocaleString()} Kč/m²), compared to the listed ${listing.priceTotal.toLocaleString()} Kč. `;
    if (highFlags > 0) summary += `We also found ${highFlags} significant concern${highFlags > 1 ? "s" : ""} that may further reduce the value. `;
    summary += "We recommend negotiating the price down or looking at comparable listings.";
  } else if (verdict === "underpriced") {
    summary = `This ${listing.rooms} apartment in ${listing.district} appears to be a good deal — priced ${diff}% below our fair estimate. `;
    summary += `Our model suggests a fair price of ${hedonic.fairPriceTotal.toLocaleString()} Kč, while it's listed at ${listing.priceTotal.toLocaleString()} Kč. `;
    if (highFlags > 0) summary += `However, there ${highFlags > 1 ? "are" : "is"} ${highFlags} potential issue${highFlags > 1 ? "s" : ""} worth investigating before purchasing. `;
    else summary += "No major red flags detected — this could be a genuine opportunity. ";
    summary += "Act quickly if the property meets your needs.";
  } else {
    summary = `This ${listing.rooms} apartment in ${listing.district} is priced fairly — within ${diff}% of our estimated fair value. `;
    summary += `Our model suggests ${hedonic.fairPriceTotal.toLocaleString()} Kč as the fair price (listed at ${listing.priceTotal.toLocaleString()} Kč). `;
    if (highFlags > 0) summary += `Note: we found ${highFlags} concern${highFlags > 1 ? "s" : ""} worth considering. `;
    summary += "The price is reasonable for the current market conditions in this district.";
  }

  return summary;
}
