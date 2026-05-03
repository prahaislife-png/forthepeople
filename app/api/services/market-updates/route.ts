import { NextRequest } from "next/server";
import type { MarketUpdate } from "@/app/lib/services-types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, districts, frequency, categories } = await request.json() as {
      email: string;
      districts: number[];
      frequency: string;
      categories: string[];
    };

    if (!email || !districts || districts.length === 0) {
      return Response.json({ error: "Email and at least one district are required" }, { status: 400 });
    }

    const districtId = districts[0];
    const districtName = `Praha ${districtId}`;

    const sampleUpdate: MarketUpdate = {
      id: crypto.randomUUID(),
      month: "2026-05",
      districtId,
      districtName,
      priceChanges: [
        { metric: "Avg rent/m²", previousValue: 376, currentValue: 385, changePercent: 2.4 },
        { metric: "Avg sale price/m²", previousValue: 94300, currentValue: 96000, changePercent: 1.8 },
        { metric: "Active rental listings", previousValue: 189, currentValue: 165, changePercent: -12.7 },
        { metric: "Active sale listings", previousValue: 342, currentValue: 318, changePercent: -7.0 },
        { metric: "Avg days on market", previousValue: 34, currentValue: 28, changePercent: -17.6 },
      ],
      topMovers: [
        { area: "Smíchov center", change: 4.2, direction: "up" },
        { area: "Barrandov", change: -1.8, direction: "down" },
        { area: "Košíře", change: 3.1, direction: "up" },
        { area: "Hlubočepy", change: 2.5, direction: "up" },
      ],
      newsDigest: [
        {
          title: "Metro D construction on schedule — Olbrachtova station foundations complete",
          source: "E15.cz",
          date: "2026-04-28",
          summary: "The new metro D line is progressing as planned with the first station foundations completed. Expected to significantly boost property values in southern Prague 5.",
          impact: "positive",
        },
        {
          title: "CNB holds rates at 3.75% — signals possible cut in Q3",
          source: "ČNB",
          date: "2026-04-25",
          summary: "The Czech National Bank maintained the repo rate but board members hinted at a 0.25% reduction in the summer, which could stimulate mortgage demand.",
          impact: "positive",
        },
        {
          title: "Prague approves stricter Airbnb regulations for central districts",
          source: "iDNES Reality",
          date: "2026-04-20",
          summary: "New registration requirements for short-term rentals. May push some units back to long-term rental market, potentially moderating rent increases.",
          impact: "neutral",
        },
        {
          title: "Smíchov City phase 2 breaks ground — 400 new apartments by 2028",
          source: "HN.cz",
          date: "2026-04-15",
          summary: "Major mixed-use development adds significant new supply. Premium segment (100,000+ Kč/m²) targeting young professionals.",
          impact: "neutral",
        },
      ],
      alerts: [
        {
          type: "market_shift",
          message: `Rental supply in ${districtName} dropped 12.7% month-over-month — market tightening accelerating`,
          severity: "warning",
        },
        {
          type: "new_development",
          message: "New 400-unit development approved in Smíchov — may moderate price growth by 2028",
          severity: "info",
        },
      ],
      narrative: `The ${districtName} property market continued to strengthen in May 2026, with rental prices rising 2.4% month-over-month to an average of 385 Kč/m². The most significant trend is the sharp decline in available rental listings (-12.7%), indicating strong tenant demand outpacing supply. Sale prices remain on an upward trajectory (+1.8%) with properties selling faster (28 days avg, down from 34). The Smíchov area leads gains driven by metro D construction progress and the Smíchov City development adding amenities. Key risks: the Airbnb regulation change may temporarily increase rental supply, and the new 400-unit development could moderate premium segment pricing by 2028. Overall outlook for investors: positive in the short term (12-18 months) with rental yield opportunities in the 3.5-4.5% range.`,
    };

    await new Promise(resolve => setTimeout(resolve, 1000));

    return Response.json({ confirmed: true, sampleUpdate });
  } catch {
    return Response.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
