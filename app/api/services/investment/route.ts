import { NextRequest } from "next/server";
import type { InvestmentReport } from "@/app/lib/services-types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { districtId, address } = await request.json() as { districtId: number; address?: string };

    if (!districtId || districtId < 1 || districtId > 22) {
      return Response.json({ error: "Valid district ID (1-22) is required" }, { status: 400 });
    }

    const districtName = `Praha ${districtId}`;

    const mockResult: InvestmentReport = {
      id: crypto.randomUUID(),
      districtId,
      districtName,
      address: address || undefined,
      generatedAt: new Date().toISOString(),

      roiProjection: [
        { year: 2026, capitalGrowth: 4.2, rentalIncome: 4.8, totalReturn: 9.0, cumulativeReturn: 9.0 },
        { year: 2027, capitalGrowth: 3.8, rentalIncome: 4.9, totalReturn: 8.7, cumulativeReturn: 17.7 },
        { year: 2028, capitalGrowth: 5.1, rentalIncome: 5.0, totalReturn: 10.1, cumulativeReturn: 27.8 },
        { year: 2029, capitalGrowth: 4.5, rentalIncome: 5.2, totalReturn: 9.7, cumulativeReturn: 37.5 },
        { year: 2030, capitalGrowth: 4.0, rentalIncome: 5.3, totalReturn: 9.3, cumulativeReturn: 46.8 },
      ],

      rentalYield: {
        grossYield: 4.8,
        netYield: 3.6,
        avgMonthlyRent: 22500,
        estimatedExpenses: 5800,
        occupancyRate: 94,
      },

      priceTrend: [
        { year: 2020, avgPrice: 72000, predicted: false },
        { year: 2021, avgPrice: 78000, predicted: false },
        { year: 2022, avgPrice: 85000, predicted: false },
        { year: 2023, avgPrice: 82000, predicted: false },
        { year: 2024, avgPrice: 88000, predicted: false },
        { year: 2025, avgPrice: 92000, predicted: false },
        { year: 2026, avgPrice: 96000, predicted: true },
        { year: 2027, avgPrice: 100000, predicted: true },
        { year: 2028, avgPrice: 105000, predicted: true },
      ],

      developmentPlans: [
        {
          project: "New metro D line — Olbrachtova station",
          type: "infrastructure",
          status: "construction",
          completionYear: 2029,
          impact: "positive",
          description: "Direct metro connection will significantly improve transit access and property values in the southern part of the district.",
        },
        {
          project: "Smíchov City South — mixed-use development",
          type: "mixed",
          status: "approved",
          completionYear: 2028,
          impact: "positive",
          description: "500+ residential units, retail, and office space. Will bring new amenities and increase area attractiveness.",
        },
        {
          project: "Proposed rent control regulation",
          type: "residential",
          status: "planned",
          completionYear: 2027,
          impact: "negative",
          description: "Prague city council discussing rent caps for new leases. Could limit rental income growth if implemented.",
        },
      ],

      riskFactors: [
        {
          factor: "Interest rate sensitivity",
          severity: "medium",
          description: "CNB rate cuts expected in 2026-2027 may increase buyer demand but also inflate prices beyond fundamentals.",
          mitigation: "Lock in fixed-rate mortgage now while rates are still relatively low.",
        },
        {
          factor: "Regulatory risk",
          severity: "low",
          description: "Potential rent regulation discussions could cap rental income growth.",
          mitigation: "Focus on premium properties that would likely be exempt from price caps.",
        },
        {
          factor: "Supply increase",
          severity: "medium",
          description: "3,200 new units planned in the district by 2028. Could moderate price growth.",
          mitigation: "Invest in established micro-locations with limited new supply.",
        },
      ],

      comparisonVsAlternatives: [
        { instrument: `Real estate (${districtName})`, expectedReturn: 9.0, risk: "Medium", liquidity: "Low" },
        { instrument: "Czech govt bonds (10Y)", expectedReturn: 4.2, risk: "Very Low", liquidity: "High" },
        { instrument: "S&P 500 ETF (CZK-hedged)", expectedReturn: 8.5, risk: "High", liquidity: "High" },
        { instrument: "Prague REIT fund", expectedReturn: 6.8, risk: "Medium", liquidity: "Medium" },
        { instrument: "Savings account (best CZ)", expectedReturn: 3.8, risk: "None", liquidity: "Immediate" },
      ],

      summary: `Based on our analysis, ${districtName} represents a solid investment opportunity with expected 5-year cumulative returns of ~47% (capital growth + rental income). The district benefits from ongoing infrastructure improvements (metro D line) and new mixed-use developments that will increase livability and demand. Key risks include potential rent regulation and new supply, but these are manageable. The net rental yield of 3.6% outperforms Czech bonds while offering capital appreciation potential. We recommend a BUY position with a medium-term (3-5 year) investment horizon.`,
      recommendation: "buy",
    };

    await new Promise(resolve => setTimeout(resolve, 2000));

    return Response.json(mockResult);
  } catch {
    return Response.json({ error: "Report generation failed" }, { status: 500 });
  }
}
