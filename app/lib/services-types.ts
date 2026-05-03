// === Price Fairness Check ===

export type IndicatorTier = "free" | "paid";
export type IndicatorCategory = "price" | "environment" | "location" | "building" | "market" | "investment";

export interface PriceIndicator {
  id: string;
  name: string;
  nameCz: string;
  category: IndicatorCategory;
  tier: IndicatorTier;
  value: number;              // normalized 0-100 score
  rawValue: string;           // human-readable value (e.g., "12% above average")
  impact: "positive" | "neutral" | "negative";
  weight: number;             // how much this factor affects fair price (0-1)
  explanation: string;
  explanationCz: string;
}

export interface ListingDetails {
  url: string;
  source: "sreality" | "bezrealitky" | "flatzone" | "idnes" | "other";
  title: string;
  priceTotal: number;
  pricePerM2: number;
  areaM2: number;
  floor: number;
  totalFloors: number;
  condition: "new" | "renovated" | "good" | "original" | "to_renovate";
  buildingType: "panel" | "brick" | "other";
  district: string;
  districtId: number;
  rooms: string;
  photos: string[];
  photoCount: number;
  description: string;
  address?: string;
  hasElevator?: boolean;
  yearBuilt?: number;
  energyClass?: string;
  ownership?: "personal" | "cooperative" | "other";
}

export type PriceVerdict = "fair" | "overpriced" | "underpriced";

export interface PriceCheckResult {
  id: string;
  listing: ListingDetails;
  verdict: PriceVerdict;
  verdictConfidence: number;
  estimatedFairPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  indicators: PriceIndicator[];
  freeIndicators: PriceIndicator[];
  paidIndicators: PriceIndicator[];
  comparables: {
    title: string;
    pricePerM2: number;
    areaM2: number;
    address: string;
    url?: string;
    rooms?: string;
    soldDate?: string;
  }[];
  districtAverages: {
    avgPriceM2: number;
    medianPriceM2: number;
    priceRange: [number, number];
  };
  commuteTimes: {
    destination: string;
    minutes: number;
    mode: "metro" | "tram" | "bus" | "car";
  }[];
  redFlags: {
    severity: "low" | "medium" | "high";
    category: string;
    description: string;
    descriptionCz: string;
  }[];
  renovationEstimate?: {
    needed: boolean;
    estimatedCostCZK: number;
    items: { item: string; itemCz: string; cost: number }[];
  };
  investmentYield?: {
    grossYield: number;
    netYield: number;
    monthlyRentEstimate: number;
    annualExpenses: number;
  };
  totalCostOfOwnership5yr?: number;
  summary: string;
  createdAt: string;
}

// === Investment Analysis Report ===

export interface InvestmentReport {
  id: string;
  districtId: number;
  districtName: string;
  address?: string;
  generatedAt: string;

  roiProjection: {
    year: number;
    capitalGrowth: number;
    rentalIncome: number;
    totalReturn: number;
    cumulativeReturn: number;
  }[];

  rentalYield: {
    grossYield: number;
    netYield: number;
    avgMonthlyRent: number;
    estimatedExpenses: number;
    occupancyRate: number;
  };

  priceTrend: {
    year: number;
    avgPrice: number;
    predicted: boolean;
  }[];

  developmentPlans: {
    project: string;
    type: "residential" | "commercial" | "infrastructure" | "mixed";
    status: "planned" | "approved" | "construction";
    completionYear: number;
    impact: "positive" | "neutral" | "negative";
    description: string;
  }[];

  riskFactors: {
    factor: string;
    severity: "low" | "medium" | "high";
    description: string;
    mitigation: string;
  }[];

  comparisonVsAlternatives: {
    instrument: string;
    expectedReturn: number;
    risk: string;
    liquidity: string;
  }[];

  summary: string;
  recommendation: "strong_buy" | "buy" | "hold" | "caution";
}

// === Monthly Market Updates ===

export interface MarketUpdatePreferences {
  email: string;
  districts: number[];
  priceThresholds: {
    districtId: number;
    maxPriceM2?: number;
    minPriceM2?: number;
  }[];
  categories: ("price" | "supply" | "development" | "regulation")[];
  frequency: "weekly" | "monthly";
}

export interface MarketUpdate {
  id: string;
  month: string;
  districtId: number;
  districtName: string;
  priceChanges: {
    metric: string;
    previousValue: number;
    currentValue: number;
    changePercent: number;
  }[];
  topMovers: {
    area: string;
    change: number;
    direction: "up" | "down";
  }[];
  newsDigest: {
    title: string;
    source: string;
    date: string;
    summary: string;
    impact: "positive" | "negative" | "neutral";
  }[];
  alerts: {
    type: "price_threshold" | "new_development" | "market_shift";
    message: string;
    severity: "info" | "warning" | "critical";
  }[];
  narrative: string;
}
