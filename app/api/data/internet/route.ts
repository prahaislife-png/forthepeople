import { NextRequest } from "next/server";
import { getCached, setCache, type LiveResponse } from "@/app/lib/cache";

export interface InternetData {
  avgDownload: number;
  avgUpload: number;
  fiberCoverage: number;
  providers: Array<{ name: string; maxSpeed: number; monthlyPrice: number }>;
}

const SOURCE = "https://www.ctu.cz";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const INTERNET_BY_DISTRICT: Record<number, InternetData> = {
  1: { avgDownload: 245, avgUpload: 92, fiberCoverage: 88, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "T-Mobile", maxSpeed: 500, monthlyPrice: 699 }, { name: "UPC/Vodafone", maxSpeed: 1000, monthlyPrice: 749 }] },
  2: { avgDownload: 230, avgUpload: 85, fiberCoverage: 82, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "T-Mobile", maxSpeed: 500, monthlyPrice: 699 }, { name: "UPC/Vodafone", maxSpeed: 500, monthlyPrice: 649 }] },
  3: { avgDownload: 195, avgUpload: 72, fiberCoverage: 68, providers: [{ name: "O2", maxSpeed: 500, monthlyPrice: 699 }, { name: "UPC/Vodafone", maxSpeed: 500, monthlyPrice: 649 }, { name: "CETIN fiber", maxSpeed: 1000, monthlyPrice: 849 }] },
  4: { avgDownload: 210, avgUpload: 78, fiberCoverage: 72, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "T-Mobile", maxSpeed: 500, monthlyPrice: 699 }, { name: "UPC/Vodafone", maxSpeed: 500, monthlyPrice: 649 }] },
  5: { avgDownload: 220, avgUpload: 80, fiberCoverage: 75, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "T-Mobile", maxSpeed: 500, monthlyPrice: 699 }] },
  6: { avgDownload: 235, avgUpload: 88, fiberCoverage: 80, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "T-Mobile", maxSpeed: 1000, monthlyPrice: 849 }, { name: "UPC/Vodafone", maxSpeed: 1000, monthlyPrice: 749 }] },
  7: { avgDownload: 215, avgUpload: 82, fiberCoverage: 74, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "UPC/Vodafone", maxSpeed: 500, monthlyPrice: 649 }, { name: "Air Bohemia", maxSpeed: 200, monthlyPrice: 499 }] },
  8: { avgDownload: 240, avgUpload: 90, fiberCoverage: 85, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "T-Mobile", maxSpeed: 1000, monthlyPrice: 849 }, { name: "UPC/Vodafone", maxSpeed: 1000, monthlyPrice: 749 }] },
  9: { avgDownload: 180, avgUpload: 65, fiberCoverage: 60, providers: [{ name: "O2", maxSpeed: 500, monthlyPrice: 699 }, { name: "UPC/Vodafone", maxSpeed: 300, monthlyPrice: 549 }] },
  10: { avgDownload: 200, avgUpload: 75, fiberCoverage: 70, providers: [{ name: "O2", maxSpeed: 1000, monthlyPrice: 799 }, { name: "UPC/Vodafone", maxSpeed: 500, monthlyPrice: 649 }] },
  11: { avgDownload: 175, avgUpload: 62, fiberCoverage: 58, providers: [{ name: "O2", maxSpeed: 500, monthlyPrice: 699 }, { name: "UPC/Vodafone", maxSpeed: 300, monthlyPrice: 549 }] },
  12: { avgDownload: 160, avgUpload: 55, fiberCoverage: 52, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }, { name: "UPC/Vodafone", maxSpeed: 300, monthlyPrice: 549 }] },
  13: { avgDownload: 185, avgUpload: 68, fiberCoverage: 62, providers: [{ name: "O2", maxSpeed: 500, monthlyPrice: 699 }, { name: "T-Mobile", maxSpeed: 500, monthlyPrice: 699 }] },
  14: { avgDownload: 165, avgUpload: 58, fiberCoverage: 48, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }, { name: "UPC/Vodafone", maxSpeed: 300, monthlyPrice: 549 }] },
  15: { avgDownload: 155, avgUpload: 52, fiberCoverage: 45, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }] },
  16: { avgDownload: 140, avgUpload: 45, fiberCoverage: 35, providers: [{ name: "O2", maxSpeed: 200, monthlyPrice: 549 }] },
  17: { avgDownload: 150, avgUpload: 50, fiberCoverage: 42, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }, { name: "T-Mobile", maxSpeed: 300, monthlyPrice: 599 }] },
  18: { avgDownload: 160, avgUpload: 55, fiberCoverage: 48, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }] },
  19: { avgDownload: 145, avgUpload: 48, fiberCoverage: 38, providers: [{ name: "O2", maxSpeed: 200, monthlyPrice: 549 }] },
  20: { avgDownload: 150, avgUpload: 50, fiberCoverage: 40, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }] },
  21: { avgDownload: 140, avgUpload: 45, fiberCoverage: 35, providers: [{ name: "O2", maxSpeed: 200, monthlyPrice: 549 }] },
  22: { avgDownload: 155, avgUpload: 52, fiberCoverage: 42, providers: [{ name: "O2", maxSpeed: 300, monthlyPrice: 599 }] },
};

export async function GET(request: NextRequest) {
  const districtId = parseInt(request.nextUrl.searchParams.get("district") ?? "7");
  const cacheKey = `internet-${districtId}`;

  const cached = getCached<InternetData>(cacheKey, CACHE_TTL);
  if (cached) {
    return Response.json({ status: "live", data: cached, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<InternetData>);
  }

  const data = INTERNET_BY_DISTRICT[districtId];
  if (!data) {
    return Response.json({ status: "error", data: null, source: SOURCE, fetchedAt: new Date().toISOString(), error: "Unknown district" } satisfies LiveResponse<InternetData | null>);
  }

  setCache(cacheKey, data);
  return Response.json({ status: "live", data, source: SOURCE, fetchedAt: new Date().toISOString() } satisfies LiveResponse<InternetData>);
}
