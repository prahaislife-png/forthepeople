import { NextResponse } from "next/server";
import { getDistrict } from "@/app/data/districts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = Number(searchParams.get("district")) || 7;
  const d = getDistrict(districtId);

  interface TimelineItem {
    id: string;
    timestamp: string;
    icon: string;
    title: string;
    description: string;
  }

  const items: TimelineItem[] = [];

  // Contracts by date
  for (const c of d.contracts) {
    items.push({
      id: `contract-${c.id}`,
      timestamp: c.date,
      icon: "contract",
      title: `New contract: ${c.subject}`,
      description: `${c.supplier} — ${Math.round(c.value / 1000)}k CZK`,
    });
  }

  // Transit alerts
  for (const a of d.transitAlerts) {
    items.push({
      id: `transit-${a.id}`,
      timestamp: a.until,
      icon: "transit",
      title: `${a.type.toUpperCase()} ${a.line}: ${a.severity}`,
      description: a.message,
    });
  }

  // Building permits
  for (const p of d.permits) {
    items.push({
      id: `permit-${p.id}`,
      timestamp: p.submitted,
      icon: "permit",
      title: `Building permit: ${p.type}`,
      description: `${p.address} — ${p.status}`,
    });
  }

  // Tenders
  for (const t of d.tenders) {
    items.push({
      id: `tender-${t.id}`,
      timestamp: t.deadline,
      icon: "tender",
      title: `Tender: ${t.title}`,
      description: `Est. ${Math.round(t.estimatedValue / 1000)}k CZK — ${t.status}`,
    });
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json(items.slice(0, 20));
}
