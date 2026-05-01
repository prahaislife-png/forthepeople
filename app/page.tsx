"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { DISTRICTS, getDistrict, type District } from "./data/districts";
import { T, type Lang } from "./lib/translations";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("cs-CZ").format(n);
}

function fmtCZK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M Kč`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} tis. Kč`;
  return `${n} Kč`;
}

// ─── Live Data Hook ──────────────────────────────────────────────────────────

type LiveStatus = "live" | "demo" | "error";

interface LiveState<T> {
  status: LiveStatus;
  data: T | null;
  fetchedAt: string | null;
}

function useLiveData<T>(url: string | null): LiveState<T> {
  const [state, setState] = useState<LiveState<T>>({ status: "demo", data: null, fetchedAt: null });

  useEffect(() => {
    if (!url) { setState({ status: "demo", data: null, fetchedAt: null }); return; }
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const s = json.status === "live" ? "live" : json.status === "error" ? "error" : "demo";
        setState({ status: s, data: json.data, fetchedAt: json.fetchedAt });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", data: null, fetchedAt: null });
      });
    return () => { cancelled = true; };
  }, [url]);

  return state;
}

// ─── Live Ticker ─────────────────────────────────────────────────────────────

function LiveTicker({ lang, district, weather, air }: { lang: Lang; district: District; weather: { temperature: number; description: string } | null; air: { pm25: number; aqi: number } | null }) {
  const items = [
    weather ? `${weather.temperature}°C · ${weather.description}` : `Prague: —`,
    air ? `AQI ${air.aqi} · PM2.5 ${air.pm25} µg/m³` : `PM2.5: ${district.airQuality.pm25.toFixed(1)} µg/m³`,
    `${district.name}: ${lang === "en" ? "Budget surplus" : "Přebytek"} ${district.budget.surplus} M Kč`,
    `${fmt(district.population)} ${lang === "en" ? "residents" : "obyvatel"} · ${district.area} km²`,
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  });
  return (
    <div className="bg-red-700 text-white text-xs font-mono px-4 py-1.5 flex items-center gap-3 overflow-hidden">
      <span className="shrink-0 font-bold tracking-widest uppercase text-red-200">Live</span>
      <span className="truncate transition-all duration-500">{items[idx]}</span>
    </div>
  );
}

// ─── Module Card ─────────────────────────────────────────────────────────────

type BadgeVariant = "live" | "demo" | "error";

function ModuleCard({
  title,
  sub,
  badge,
  source,
  children,
}: {
  title: string;
  sub: string;
  badge: BadgeVariant;
  source?: string;
  children: React.ReactNode;
}) {
  const badgeStyle: Record<BadgeVariant, string> = {
    live: "bg-green-100 text-green-800",
    demo: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-800",
  };
  const badgeLabel: Record<BadgeVariant, string> = {
    live: "LIVE",
    demo: "DEMO",
    error: "ERROR",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${badgeStyle[badge]}`}>
            {badgeLabel[badge]}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 flex-1">{children}</div>
      {source && (
        <div className="px-4 pb-3">
          <a href={source} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-gray-400 hover:text-red-700 font-mono">
            ↗ {source.replace("https://", "")}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Scaffold placeholder ─────────────────────────────────────────────────────

function Scaffold({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-28 gap-2 text-gray-300">
      <span className="text-3xl">{icon}</span>
      <span className="text-xs font-mono text-gray-400">{label}</span>
    </div>
  );
}

// ─── Budget Module ────────────────────────────────────────────────────────────

function BudgetModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  const b = d.budget;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: t.revenue, value: b.totalRevenue, color: "text-green-700" },
          { label: t.expenditure, value: b.totalExpenditure, color: "text-red-700" },
          { label: t.surplus, value: b.surplus, color: "text-blue-700" },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</div>
            <div className="text-[10px] text-gray-500">{t.millionCzk}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={b.breakdown}
            dataKey="value"
            nameKey={lang === "en" ? "label" : "labelCz"}
            cx="50%" cy="50%"
            outerRadius={55} innerRadius={25}
            paddingAngle={2}
          >
            {b.breakdown.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [`${v} M Kč`, name]} contentStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-1">
        {b.breakdown.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-gray-600 truncate">{lang === "en" ? item.label : item.labelCz}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={b.yearlyTrend}>
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#dcfce7" strokeWidth={1.5} />
          <Area type="monotone" dataKey="expenditure" stroke="#c41e3a" fill="#fee2e2" strokeWidth={1.5} />
          <Tooltip contentStyle={{ fontSize: 10 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Contracts Module ─────────────────────────────────────────────────────────

function ContractsModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  if (!d.contracts.length) return <Scaffold icon="📄" label="No contracts data — integration pending" />;
  return (
    <div className="space-y-2">
      {d.contracts.map((c) => (
        <div key={c.id} className="border border-gray-100 rounded p-2.5 text-xs">
          <div className="flex items-start justify-between gap-1">
            <span className="font-medium text-gray-900 leading-tight">
              {lang === "en" ? c.subject : c.subjectCz}
            </span>
            <span className="font-mono text-red-700 font-bold shrink-0 ml-1">{fmtCZK(c.value)}</span>
          </div>
          <div className="text-gray-500 mt-1 flex items-center justify-between">
            <span>{c.supplier}</span>
            <span className="font-mono">{c.date}</span>
          </div>
        </div>
      ))}
      <a href="https://smlouvy.gov.cz" target="_blank" rel="noopener noreferrer"
        className="block text-center text-[11px] text-red-700 hover:underline font-medium pt-1">
        {t.viewAll}
      </a>
    </div>
  );
}

// ─── Air Quality Module ───────────────────────────────────────────────────────

function AirQualityModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  const aq = d.airQuality;
  const statusColor = {
    good: "bg-green-100 text-green-800",
    fair: "bg-yellow-100 text-yellow-800",
    poor: "bg-orange-100 text-orange-800",
    "very-poor": "bg-red-100 text-red-800",
  }[aq.status];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>
          AQI {aq.aqi} — {lang === "cs" ? aq.statusCz : aq.status.replace("-", " ")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "PM2.5", value: aq.pm25, unit: "µg/m³" },
          { label: "PM10",  value: aq.pm10, unit: "µg/m³" },
          { label: "NO₂",  value: aq.no2,  unit: "µg/m³" },
          { label: "O₃",   value: aq.o3,   unit: "µg/m³" },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 rounded p-2 text-center">
            <div className="text-sm font-bold font-mono text-gray-900">{m.value.toFixed(1)}</div>
            <div className="text-[9px] text-gray-400">{m.unit}</div>
            <div className="text-[10px] text-gray-600">{m.label}</div>
          </div>
        ))}
      </div>
      {aq.hourlyPm25.length > 0 && (
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={aq.hourlyPm25}>
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
            <Area type="monotone" dataKey="value" stroke="#c41e3a" fill="#fee2e2" strokeWidth={1.5} />
            <Tooltip contentStyle={{ fontSize: 10 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Transit Module ───────────────────────────────────────────────────────────

function TransitModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  const alerts = d.transitAlerts;
  const typeIcon: Record<string, string> = { metro: "🚇", tram: "🚋", bus: "🚌" };
  const severityStyle: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    disruption: "bg-red-50 border-red-200 text-red-800",
  };
  if (!alerts.length)
    return <div className="text-sm text-green-700 font-medium py-4 text-center">✓ {t.noAlerts}</div>;
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div key={a.id} className={`border rounded p-2.5 text-xs ${severityStyle[a.severity]}`}>
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <span>{typeIcon[a.type]}</span>
            <span>{a.type.toUpperCase()} {a.line}</span>
          </div>
          <p className="leading-snug">{lang === "cs" ? a.messageCz : a.message}</p>
          {a.until !== "ongoing" && (
            <div className="text-[10px] mt-1 opacity-70">Until: {a.until}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Permits Module ───────────────────────────────────────────────────────────

function PermitsModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  if (!d.permits.length) return <Scaffold icon="🏗" label="Building permits — integration pending" />;
  const statusColor: Record<string, string> = {
    approved: "text-green-700",
    pending: "text-amber-700",
    rejected: "text-red-700",
  };
  return (
    <div className="space-y-2">
      {d.permits.map((p) => (
        <div key={p.id} className="border border-gray-100 rounded p-2.5 text-xs">
          <div className="flex justify-between items-start gap-1 mb-1">
            <span className="font-medium text-gray-900 leading-tight">{p.address}</span>
            <span className={`font-bold shrink-0 ${statusColor[p.status]}`}>
              {lang === "cs" ? p.statusCz : p.status}
            </span>
          </div>
          <div className="text-gray-500">{lang === "cs" ? p.typeCz : p.type}</div>
          <div className="text-gray-400 font-mono mt-0.5">{p.investor} · {p.submitted}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Crime Module ─────────────────────────────────────────────────────────────

function CrimeModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  const c = d.crime;
  const changeColor = c.change < 0 ? "text-green-700" : "text-red-700";
  const changeLabel = c.change < 0 ? `↓ ${Math.abs(c.change).toFixed(1)}%` : `↑ ${c.change.toFixed(1)}%`;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-xl font-bold font-mono text-gray-900">{fmt(c.total2023)}</div>
          <div className="text-[10px] text-gray-500">{t.totalCrimes}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className={`text-xl font-bold font-mono ${changeColor}`}>{changeLabel}</div>
          <div className="text-[10px] text-gray-500">{t.vsLastYear}</div>
        </div>
      </div>
      {c.categories.length > 0 && (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={c.categories} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey={lang === "en" ? "label" : "labelCz"} tick={{ fontSize: 9 }} width={90} />
            <Bar dataKey="count" fill="#c41e3a" radius={[0, 3, 3, 0]} />
            <Tooltip contentStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Parking Module ───────────────────────────────────────────────────────────

function ParkingModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  const p = d.parking;
  return (
    <div className="space-y-2 text-sm">
      <div className="bg-gray-50 rounded p-2.5">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{t.zone}</div>
        <div className="font-medium text-gray-900">{p.zone}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-base font-bold font-mono text-red-700">{fmt(p.residentRate)} Kč</div>
          <div className="text-[10px] text-gray-500">{t.residentRate}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-base font-bold font-mono text-gray-700">{p.visitorRate} Kč</div>
          <div className="text-[10px] text-gray-500">{t.visitorRate}</div>
        </div>
      </div>
      <a href={p.permitUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {t.applyPermit}
      </a>
    </div>
  );
}

// ─── Schools Module ───────────────────────────────────────────────────────────

function SchoolsModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  const s = d.schools;
  const items = [
    { label: t.primary, value: s.primary, icon: "🏫" },
    { label: t.secondary, value: s.secondary, icon: "🎓" },
    { label: t.kindergarten, value: s.kindergarten, icon: "🌱" },
    { label: t.universities, value: s.universities, icon: "🏛" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 rounded p-2.5 text-center">
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className="text-lg font-bold font-mono text-gray-900">{item.value}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── EU Funds Module ──────────────────────────────────────────────────────────

function EUFundsModule({ d, lang, t }: { d: District; lang: Lang; t: typeof T["en"] }) {
  if (!d.euFunds.length) return <Scaffold icon="🇪🇺" label="EU funds data — integration pending" />;
  const statusColor: Record<string, string> = {
    completed: "text-green-700 bg-green-50",
    ongoing: "text-blue-700 bg-blue-50",
    planned: "text-gray-600 bg-gray-50",
  };
  return (
    <div className="space-y-2">
      {d.euFunds.map((f, i) => (
        <div key={i} className="border border-gray-100 rounded p-2.5 text-xs">
          <div className="flex justify-between items-start gap-1 mb-1">
            <span className="font-medium text-gray-900 leading-tight">
              {lang === "cs" ? f.projectCz : f.project}
            </span>
            <span className="font-bold font-mono text-blue-700 shrink-0">{f.amount} M Kč</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{f.fund}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{f.year}</span>
            <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor[f.status]}`}>
              {lang === "cs" ? f.statusCz : f.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tenders Module ───────────────────────────────────────────────────────────

function TendersModule({ d, lang }: { d: District; lang: Lang }) {
  if (!d.tenders.length) return <div className="text-xs text-gray-400 text-center py-6">No tender data</div>;
  const statusColor: Record<string, string> = {
    open: "text-green-700 bg-green-50",
    closed: "text-gray-600 bg-gray-50",
    awarded: "text-blue-700 bg-blue-50",
  };
  return (
    <div className="space-y-2">
      {d.tenders.map((t) => (
        <div key={t.id} className="border border-gray-100 rounded p-2.5 text-xs">
          <div className="flex justify-between items-start gap-1 mb-1">
            <span className="font-medium text-gray-900 leading-tight">{lang === "cs" ? t.titleCz : t.title}</span>
            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 ${statusColor[t.status]}`}>
              {lang === "cs" ? t.statusCz : t.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>{lang === "cs" ? t.typeCz : t.type}</span>
            <span className="font-mono text-red-700 font-bold">{fmtCZK(t.estimatedValue)}</span>
          </div>
          <div className="text-gray-400 font-mono mt-0.5">{lang === "en" ? "Deadline" : "Uzávěrka"}: {t.deadline}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Property Tax Module ──────────────────────────────────────────────────────

function PropertyTaxModule({ d, lang }: { d: District; lang: Lang }) {
  const p = d.propertyTax;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: lang === "en" ? "Property tax rate" : "Daň z nemovitosti", value: `${p.propertyTaxRate} Kč/m²` },
          { label: lang === "en" ? "Waste fee / person" : "Poplatek za odpad", value: `${fmt(p.wasteFeeCZK)} Kč/rok` },
          { label: lang === "en" ? "Dog fee (1st dog)" : "Poplatek ze psa", value: `${fmt(p.dogFee)} Kč/rok` },
          { label: lang === "en" ? "Payment deadline" : "Splatnost", value: p.paymentDeadline },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-gray-500 text-[10px] leading-tight mb-0.5">{item.label}</div>
            <div className="font-bold font-mono text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 rounded p-2 text-[10px] text-amber-800 leading-snug">
        {lang === "en" ? p.shortTermRentalTax : "Místní poplatek se vztahuje na krátkodobé pronájmy (Airbnb); hostitel musí být registrován u MČ"}
      </div>
    </div>
  );
}

// ─── Noise Maps Module ────────────────────────────────────────────────────────

function NoiseMapsModule({ d, lang }: { d: District; lang: Lang }) {
  const n = d.noiseMaps;
  const sources = lang === "cs" ? n.mainSourcesCz : n.mainSources;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{n.dayAvgDb}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Day avg (dB)" : "Den průměr (dB)"}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{n.nightAvgDb}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Night avg (dB)" : "Noc průměr (dB)"}</div>
        </div>
      </div>
      <div className="bg-red-50 rounded p-2 text-xs">
        <div className="text-red-700 font-bold mb-1">{n.exceedanceAreas}% {lang === "en" ? "area exceeds EU limits" : "plochy překračuje limity EU"}</div>
        <div className="text-gray-600 text-[10px]">{lang === "en" ? "Main sources:" : "Hlavní zdroje:"}</div>
        <ul className="mt-0.5 space-y-0.5">
          {sources.map((s, i) => <li key={i} className="text-[10px] text-gray-700">• {s}</li>)}
        </ul>
      </div>
      <a href={n.mapUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {lang === "en" ? "View interactive noise map →" : "Zobrazit interaktivní hlukovou mapu →"}
      </a>
    </div>
  );
}

// ─── Water Module ─────────────────────────────────────────────────────────────

function WaterModule({ d, lang }: { d: District; lang: Lang }) {
  const w = d.water;
  const ratingColor = { excellent: "text-green-700 bg-green-50", good: "text-blue-700 bg-blue-50", acceptable: "text-amber-700 bg-amber-50" }[w.rating];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${ratingColor}`}>
          {lang === "cs" ? w.ratingCz : w.rating}
        </span>
        <span className="text-xs text-gray-500">{lang === "en" ? "Last test" : "Poslední kontrola"}: {w.lastInspection}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: lang === "en" ? "Hardness" : "Tvrdost", value: lang === "cs" ? w.hardnessCz : w.hardness },
          { label: "pH", value: w.ph.toString() },
          { label: lang === "en" ? "Nitrates" : "Dusičnany", value: `${w.nitrates} mg/l` },
          { label: lang === "en" ? "Supplier" : "Dodavatel", value: "PVK a.s." },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-[10px] text-gray-500">{item.label}</div>
            <div className="text-xs font-medium text-gray-900 truncate">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Waste Module ─────────────────────────────────────────────────────────────

function WasteModule({ d, lang }: { d: District; lang: Lang }) {
  const w = d.waste;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-green-50 rounded p-2">
          <div className="text-lg font-bold font-mono text-green-700">{w.recyclingRate}%</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Recycling rate" : "Míra třídění"}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-lg font-bold font-mono text-gray-900">{w.recyclingPoints}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Recycling points" : "Sběrná místa"}</div>
        </div>
      </div>
      <div className="space-y-1">
        {w.collectionDays.slice(0, 3).map((c, i) => (
          <div key={i} className="flex justify-between text-xs border-b border-gray-50 pb-1">
            <span className="text-gray-700">{lang === "cs" ? c.typeCz : c.type}</span>
            <span className="text-gray-500 font-mono text-[10px]">{c.day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px] text-center">
        <div className="bg-gray-50 rounded p-1.5">
          <div className="font-bold font-mono">{fmt(w.annualFeeAdult)} Kč</div>
          <div className="text-gray-500">{lang === "en" ? "Adult / year" : "Dospělý / rok"}</div>
        </div>
        <div className="bg-gray-50 rounded p-1.5">
          <div className="font-bold font-mono">{fmt(w.annualFeeChild)} Kč</div>
          <div className="text-gray-500">{lang === "en" ? "Child / year" : "Dítě / rok"}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Green Space Module ───────────────────────────────────────────────────────

function GreenSpaceModule({ d, lang }: { d: District; lang: Lang }) {
  const g = d.greenSpace;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-green-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-green-700">{g.totalHa}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Total hectares" : "Celkem hektarů"}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{g.treesPlanted2023}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Trees planted 2023" : "Stromů 2023"}</div>
        </div>
      </div>
      {g.parks.length > 0 && (
        <div className="space-y-1">
          {g.parks.map((p, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-gray-700">{lang === "cs" ? p.nameCz : p.name}</span>
              <span className="text-gray-500 font-mono">{p.ha} ha</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-[10px] text-gray-500 bg-gray-50 rounded p-1.5">
        {lang === "en" ? "Maintenance budget" : "Rozpočet na údržbu"}: <span className="font-bold">{g.maintenanceBudget} M Kč</span>
      </div>
    </div>
  );
}

// ─── Energy Module ────────────────────────────────────────────────────────────

function EnergyModule({ d, lang }: { d: District; lang: Lang }) {
  const e = d.energy;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: lang === "en" ? "Heat price" : "Cena tepla", value: `${fmt(e.heatPriceGJ)} Kč/GJ` },
          { label: lang === "en" ? "Avg heat bill" : "Průměrná roční platba", value: `${fmt(e.avgAnnualHeatBill)} Kč` },
          { label: lang === "en" ? "Solar panels" : "Solární panely", value: `${e.solarPanelsInstalled} ${lang === "en" ? "buildings" : "budov"}` },
          { label: lang === "en" ? "Renewable share" : "Podíl OZE", value: `${e.renewableShare}%` },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-[10px] text-gray-500 leading-tight">{item.label}</div>
            <div className="font-bold font-mono text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-500 border-t pt-1.5">
        <span className="font-medium">{lang === "en" ? "District heating" : "Centrální vytápění"}: </span>{e.heatingSupplier} · {e.heatingZone}
      </div>
    </div>
  );
}

// ─── Sports Module ────────────────────────────────────────────────────────────

function SportsModule({ d, lang }: { d: District; lang: Lang }) {
  const s = d.sports;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: lang === "en" ? "Pools" : "Bazény", value: s.pools, icon: "🏊" },
          { label: lang === "en" ? "Playgrounds" : "Hřiště", value: s.playgrounds, icon: "⛹️" },
          { label: lang === "en" ? "Facilities" : "Sportoviště", value: s.facilities.length || "—", icon: "🏟️" },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-lg">{item.icon}</div>
            <div className="text-lg font-bold font-mono text-gray-900">{item.value}</div>
            <div className="text-[10px] text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
      {s.facilities.length > 0 && (
        <div className="space-y-1">
          {s.facilities.slice(0, 3).map((f, i) => (
            <div key={i} className="flex justify-between items-center text-xs border-b border-gray-50 pb-1">
              <div>
                <span className="text-gray-800 font-medium">{f.name}</span>
                <span className="text-gray-400 ml-1">· {lang === "cs" ? f.typeCz : f.type}</span>
              </div>
              {f.free && <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 rounded">FREE</span>}
            </div>
          ))}
        </div>
      )}
      <a href={s.sportsUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {lang === "en" ? "All sports facilities →" : "Všechna sportoviště →"}
      </a>
    </div>
  );
}

// ─── Culture Module ───────────────────────────────────────────────────────────

function CultureModule({ d, lang }: { d: District; lang: Lang }) {
  const c = d.culture;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{c.venues}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Cultural venues" : "Kulturní prostory"}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{c.libraries}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Libraries" : "Knihovny"}</div>
        </div>
      </div>
      {c.events.length > 0 && (
        <div className="space-y-1.5">
          {c.events.slice(0, 3).map((e, i) => (
            <div key={i} className="border border-gray-100 rounded p-2 text-xs">
              <div className="flex justify-between items-start gap-1">
                <span className="font-medium text-gray-900 leading-tight">{lang === "cs" ? e.titleCz : e.title}</span>
                {e.free && <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 rounded shrink-0">FREE</span>}
              </div>
              <div className="text-gray-500 text-[10px] mt-0.5">{e.date} · {e.venue}</div>
            </div>
          ))}
        </div>
      )}
      <a href={c.cultureUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {lang === "en" ? "All events →" : "Všechny akce →"}
      </a>
    </div>
  );
}

// ─── Health Module ────────────────────────────────────────────────────────────

function HealthModule({ d, lang }: { d: District; lang: Lang }) {
  const h = d.health;
  const items = [
    { label: lang === "en" ? "GPs" : "Praktičtí lékaři", value: h.gps, icon: "🩺" },
    { label: lang === "en" ? "Specialists" : "Specialisté", value: h.specialists, icon: "👨‍⚕️" },
    { label: lang === "en" ? "Pharmacies" : "Lékárny", value: h.pharmacies, icon: "💊" },
    { label: lang === "en" ? "Social centers" : "Soc. centra", value: h.socialCenters, icon: "🤝" },
  ];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2 text-center">
            <div className="text-lg">{item.icon}</div>
            <div className="text-lg font-bold font-mono text-gray-900">{item.value}</div>
            <div className="text-[10px] text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 rounded p-2 text-xs flex items-center gap-2">
        <span className="text-red-700 font-bold text-lg">☎</span>
        <div>
          <div className="font-bold text-red-700">{h.emergencyLine}</div>
          <div className="text-[10px] text-gray-600">{lang === "en" ? "Medical emergency" : "Záchranná služba"}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Family Module ────────────────────────────────────────────────────────────

function FamilyModule({ d, lang }: { d: District; lang: Lang }) {
  const f = d.family;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: lang === "en" ? "Childcare spots" : "Místa v MŠ", value: fmt(f.childCareSpots) },
          { label: lang === "en" ? "Waitlist (months)" : "Čekací lhůta (měsíce)", value: f.waitlistMonths.toString() },
          { label: lang === "en" ? "Family centers" : "Rodinná centra", value: f.familyCenters.toString() },
          { label: lang === "en" ? "Subsidy 2024" : "Příspěvek 2024", value: `${fmt(f.subsidy2024)} Kč/měsíc` },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-[10px] text-gray-500 leading-tight">{item.label}</div>
            <div className="font-bold font-mono text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
      <a href={f.familyUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {lang === "en" ? "Family services →" : "Rodinné služby →"}
      </a>
    </div>
  );
}

// ─── Seniors Module ───────────────────────────────────────────────────────────

function SeniorsModule({ d, lang }: { d: District; lang: Lang }) {
  const s = d.seniors;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: lang === "en" ? "Home care recipients" : "Příjemci péče", value: fmt(s.homeCareBeneficiaries) },
          { label: lang === "en" ? "Senior centers" : "Senior centra", value: s.seniorCenters.toString() },
          { label: lang === "en" ? "Meals / day" : "Obědů denně", value: fmt(s.mealServicePerDay) },
          { label: lang === "en" ? "Service discount" : "Sleva na služby", value: `${s.seniorPassDiscount}%` },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-[10px] text-gray-500 leading-tight">{item.label}</div>
            <div className="font-bold font-mono text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
      {s.emergencyButton && (
        <div className="bg-red-50 border border-red-100 rounded p-2 text-[10px] text-red-700">
          ✅ {lang === "en" ? "Emergency button service available" : "Tísňové tlačítko k dispozici"}
        </div>
      )}
      <a href={s.seniorsUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {lang === "en" ? "Senior services →" : "Seniorské služby →"}
      </a>
    </div>
  );
}

// ─── Elections Module ─────────────────────────────────────────────────────────

function ElectionsModule({ d, lang }: { d: District; lang: Lang }) {
  const e = d.elections;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-lg font-bold font-mono text-gray-900">{e.turnout}%</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Voter turnout" : "Volební účast"}</div>
          <div className="text-[10px] text-gray-400">{e.lastElection}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-lg font-bold font-mono text-gray-900">{e.seats}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Council seats" : "Mandátů"}</div>
        </div>
      </div>
      <div className="space-y-1">
        {e.coalitions.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-gray-700 flex-1 truncate">{c.name}</span>
            <span className="font-bold font-mono text-gray-900">{c.seats}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-500 text-center border-t pt-1.5">
        {lang === "en" ? "Next election" : "Příští volby"}: <span className="font-bold">{e.nextElection}</span>
      </div>
    </div>
  );
}

// ─── InfoZadost Module ────────────────────────────────────────────────────────

function InfoZadostModule({ d, lang }: { d: District; lang: Lang }) {
  const iz = d.infoZadost;
  const topics = lang === "cs" ? iz.recentTopicsCz : iz.recentTopics;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{fmt(iz.requestsReceived2023)}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Requests in 2023" : "Žádostí v 2023"}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{iz.avgResponseDays}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Avg. response (days)" : "Průměrná odpověď (dny)"}</div>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 font-medium">{lang === "en" ? "Popular topics:" : "Nejčastější témata:"}</div>
      <ul className="space-y-0.5">
        {topics.map((topic, i) => <li key={i} className="text-[10px] text-gray-700">• {topic}</li>)}
      </ul>
      <a href={iz.onlineFormUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium mt-1">
        {lang === "en" ? "Submit a request (§106) →" : "Podat infožádost (§106) →"}
      </a>
    </div>
  );
}

// ─── Housing Module ───────────────────────────────────────────────────────────

function HousingModule({ d, lang }: { d: District; lang: Lang }) {
  const h = d.housing;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        {[
          { label: lang === "en" ? "Avg rent/m²" : "Průměrný nájem/m²", value: `${fmt(h.avgRentM2)} Kč` },
          { label: lang === "en" ? "Avg sale/m²" : "Průměrná cena/m²", value: `${(h.avgSaleM2 / 1000).toFixed(0)} tis. Kč` },
          { label: lang === "en" ? "Municipal units" : "Obecní byty", value: fmt(h.municipalUnits) },
          { label: lang === "en" ? "Vacancy rate" : "Neobsazenost", value: `${h.vacancyRate}%` },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className="text-sm font-bold font-mono text-gray-900">{item.value}</div>
            <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={h.rentTrend}>
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <Area type="monotone" dataKey="avgRent" stroke="#c41e3a" fill="#fee2e2" strokeWidth={1.5} />
          <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v) => [`${v} Kč/m²`, lang === "en" ? "Avg rent" : "Nájem"]} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="text-[10px] text-gray-500 text-center">
        {lang === "en" ? "New construction 2024" : "Nová výstavba 2024"}: <span className="font-bold">{h.newConstructionUnits} {lang === "en" ? "units" : "bytů"}</span>
      </div>
    </div>
  );
}

// ─── Employment Module ────────────────────────────────────────────────────────

function EmploymentModule({ d, lang }: { d: District; lang: Lang }) {
  const e = d.employment;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-green-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-green-700">{e.unemploymentRate}%</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Unemployment rate" : "Nezaměstnanost"}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xl font-bold font-mono text-gray-900">{fmt(e.avgSalaryCZK)}</div>
          <div className="text-[10px] text-gray-500">{lang === "en" ? "Avg salary (Kč)" : "Průměrná mzda (Kč)"}</div>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 font-medium">{lang === "en" ? "Top employers:" : "Největší zaměstnavatelé:"}</div>
      <ul className="space-y-0.5">
        {e.topEmployers.slice(0, 4).map((emp, i) => <li key={i} className="text-[10px] text-gray-700">• {emp}</li>)}
      </ul>
      <a href={e.laborOfficeUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium mt-1">
        {lang === "en" ? "Job listings (ÚP ČR) →" : "Pracovní nabídky (ÚP ČR) →"}
      </a>
    </div>
  );
}

// ─── Business Module ──────────────────────────────────────────────────────────

function BusinessModule({ d, lang }: { d: District; lang: Lang }) {
  const b = d.business;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { label: lang === "en" ? "Registered" : "Registrovaných", value: fmt(b.registeredCompanies) },
          { label: lang === "en" ? "New 2023" : "Nových 2023", value: fmt(b.newIn2023), color: "text-green-700" },
          { label: lang === "en" ? "Dissolved" : "Zaniklo", value: fmt(b.dissolutions2023), color: "text-red-700" },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded p-2">
            <div className={`text-sm font-bold font-mono ${item.color ?? "text-gray-900"}`}>{item.value}</div>
            <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      {b.topSectors.length > 0 && (
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={b.topSectors} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey={lang === "en" ? "label" : "labelCz"} tick={{ fontSize: 9 }} width={80} />
            <Bar dataKey="count" fill="#c41e3a" radius={[0, 3, 3, 0]} />
            <Tooltip contentStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      )}
      <a href={b.aresUrl} target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-red-700 hover:underline font-medium">
        {lang === "en" ? "Search ARES registry →" : "Vyhledat v ARES →"}
      </a>
    </div>
  );
}

// ─── District Selector ────────────────────────────────────────────────────────

function DistrictSelector({ current, onChange }: { current: number; onChange: (id: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...DISTRICTS].sort((a, b) => a.id - b.id).map((d) => (
        <button
          key={d.id}
          onClick={() => onChange(d.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
            d.id === current
              ? "bg-red-700 text-white border-red-700"
              : "bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-700"
          }`}
        >
          {d.id}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [districtId, setDistrictId] = useState(7);

  const d = getDistrict(districtId);
  const t = T[lang];

  // Live data fetching
  const liveWeather = useLiveData<{ temperature: number; windspeed: number; description: string }>("/api/data/weather");
  const liveAir = useLiveData<{ pm25: number; pm10: number; no2: number; o3: number; aqi: number; status: string; hourly: { hour: string; pm25: number }[] }>("/api/data/air");
  const liveTransit = useLiveData<{ title: string; link: string; pubDate: string; category: string; description: string }[]>("/api/data/transit");
  const liveContracts = useLiveData<{ id: string; supplier: string; subject: string; value: number; date: string; url: string }[]>(
    `/api/data/contracts?district=${districtId}`
  );
  const liveBusiness = useLiveData<{ ico: string; name: string; legalForm: string; address: string; czNace: string[]; registeredSince: string }>(
    `/api/data/business?district=${districtId}`
  );
  const liveHealth = useLiveData<{ pharmacies: number; gps: number; specialists: number; hospitals: number; total: number; facilities: { name: string; type: string; address: string }[] }>(
    `/api/data/health?district=${districtId}`
  );
  const liveParks = useLiveData<{ total: number; parks: { name: string; description: string }[] }>(
    `/api/data/parks?district=${districtId}`
  );
  const liveSports = useLiveData<{ playgrounds: number; facilities: { name: string; address: string }[] }>(
    `/api/data/sports?district=${districtId}`
  );
  const liveLibraries = useLiveData<{ total: number; libraries: { name: string; address: string; web?: string }[] }>(
    `/api/data/libraries?district=${districtId}`
  );
  const liveWaste = useLiveData<{ stations: number; containers: number; types: Record<string, number>; nextPickup?: string; monitoredContainers: number }>(
    `/api/data/waste?district=${districtId}`
  );
  const liveCityHall = useLiveData<{ name: string; address: string; phone?: string; email?: string; web?: string; services: string[]; openingHours: { day: string; hours: string }[] }>(
    `/api/data/cityhall?district=${districtId}`
  );

  const airBadge: BadgeVariant = liveAir.status === "live" ? "live" : liveAir.status === "error" ? "error" : "demo";
  const transitBadge: BadgeVariant = liveTransit.status === "live" ? "live" : liveTransit.status === "error" ? "error" : "demo";
  const contractsBadge: BadgeVariant = liveContracts.status === "live" && liveContracts.data && liveContracts.data.length > 0 ? "live" : liveContracts.status === "error" ? "error" : "demo";
  const businessBadge: BadgeVariant = liveBusiness.status === "live" ? "live" : liveBusiness.status === "error" ? "error" : "demo";
  const healthBadge: BadgeVariant = liveHealth.status === "live" ? "live" : "demo";
  const parksBadge: BadgeVariant = liveParks.status === "live" ? "live" : "demo";
  const sportsBadge: BadgeVariant = liveSports.status === "live" ? "live" : "demo";
  const librariesBadge: BadgeVariant = liveLibraries.status === "live" ? "live" : "demo";
  const wasteBadge: BadgeVariant = liveWaste.status === "live" ? "live" : "demo";
  const cityHallBadge: BadgeVariant = liveCityHall.status === "live" ? "live" : "demo";

  const categories = [
    {
      label: lang === "en" ? "Money & Budget" : "Finance a rozpočet",
      modules: [
        <ModuleCard key="budget" title={t.budget} sub={t.budgetSub} badge="demo" source="https://mhmp.cz">
          <BudgetModule d={d} lang={lang} t={t} />
        </ModuleCard>,
        <ModuleCard key="contracts" title={t.contracts} sub={t.contractsSub} badge={contractsBadge} source="https://smlouvy.gov.cz">
          {contractsBadge === "live" && liveContracts.data ? (
            <div className="space-y-2">
              {liveContracts.data.slice(0, 5).map((c) => (
                <div key={c.id} className="border border-gray-100 rounded p-2.5 text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-medium text-gray-900 leading-tight">{c.subject}</span>
                    <span className="font-mono text-red-700 font-bold shrink-0 ml-1">{fmtCZK(c.value)}</span>
                  </div>
                  <div className="text-gray-500 mt-1 flex items-center justify-between">
                    <span>{c.supplier}</span>
                    <span className="font-mono">{c.date}</span>
                  </div>
                </div>
              ))}
              {liveContracts.fetchedAt && (
                <div className="text-[9px] text-gray-400 text-center font-mono">
                  Live from Registr smluv · {new Date(liveContracts.fetchedAt).toLocaleTimeString("cs-CZ")}
                </div>
              )}
            </div>
          ) : (
            <ContractsModule d={d} lang={lang} t={t} />
          )}
        </ModuleCard>,
        <ModuleCard key="tenders" title={t.tenderTitle} sub={t.tenderSub} badge="demo" source="https://vestnikverejnychzakazek.cz">
          <TendersModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="eu" title={t.euFunds} sub={t.euFundsSub} badge="demo" source="https://dotaceeu.cz">
          <EUFundsModule d={d} lang={lang} t={t} />
        </ModuleCard>,
        <ModuleCard key="propertytax" title={t.propertyTaxTitle} sub={t.propertyTaxSub} badge="demo" source="https://financnisprava.cz">
          <PropertyTaxModule d={d} lang={lang} />
        </ModuleCard>,
      ],
    },
    {
      label: lang === "en" ? "Environment & Daily Life" : "Životní prostředí",
      modules: [
        <ModuleCard key="air" title={t.airQuality} sub={t.airQualitySub} badge={airBadge} source="https://open-meteo.com">
          {airBadge === "live" && liveAir.data ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  liveAir.data.status === "good" ? "bg-green-100 text-green-800" :
                  liveAir.data.status === "fair" ? "bg-yellow-100 text-yellow-800" :
                  liveAir.data.status === "poor" ? "bg-orange-100 text-orange-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  AQI {liveAir.data.aqi} — {liveAir.data.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "PM2.5", value: liveAir.data.pm25, unit: "µg/m³" },
                  { label: "PM10",  value: liveAir.data.pm10, unit: "µg/m³" },
                  { label: "NO₂",  value: liveAir.data.no2,  unit: "µg/m³" },
                  { label: "O₃",   value: liveAir.data.o3,   unit: "µg/m³" },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded p-2 text-center">
                    <div className="text-sm font-bold font-mono text-gray-900">{m.value}</div>
                    <div className="text-[9px] text-gray-400">{m.unit}</div>
                    <div className="text-[10px] text-gray-600">{m.label}</div>
                  </div>
                ))}
              </div>
              {liveAir.data.hourly.length > 0 && (
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={liveAir.data.hourly.filter((_, i) => i % 3 === 0)}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                    <Area type="monotone" dataKey="pm25" stroke="#c41e3a" fill="#fee2e2" strokeWidth={1.5} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="text-[9px] text-gray-400 text-center font-mono">
                Live from Open-Meteo · {liveAir.fetchedAt ? new Date(liveAir.fetchedAt).toLocaleTimeString("cs-CZ") : ""}
              </div>
            </div>
          ) : (
            <AirQualityModule d={d} lang={lang} t={t} />
          )}
        </ModuleCard>,
        <ModuleCard key="noise" title={t.noiseMapsTitle} sub={t.noiseMapsub} badge="demo" source="https://www.geoportalpraha.cz">
          <NoiseMapsModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="water" title={t.waterTitle} sub={t.waterSub} badge="demo" source="https://pvk.cz">
          <WaterModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="waste" title={t.wasteTitle} sub={t.wasteSub} badge={wasteBadge} source="https://api.golemio.cz">
          {wasteBadge === "live" && liveWaste.data ? (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="font-bold text-lg font-mono text-gray-900">{liveWaste.data.stations}</div>
                  <div className="text-[10px] text-gray-500">{lang === "en" ? "Waste stations" : "Stanovišť"}</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="font-bold text-lg font-mono text-gray-900">{liveWaste.data.containers}</div>
                  <div className="text-[10px] text-gray-500">{lang === "en" ? "Containers" : "Kontejnerů"}</div>
                </div>
              </div>
              <div className="space-y-1">
                {Object.entries(liveWaste.data.types).slice(0, 5).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-[11px]">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-mono text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
              {liveWaste.data.nextPickup && (
                <div className="text-[10px] text-green-700 font-medium">{lang === "en" ? "Next pickup" : "Další svoz"}: {liveWaste.data.nextPickup}</div>
              )}
            </div>
          ) : (
            <WasteModule d={d} lang={lang} />
          )}
        </ModuleCard>,
        <ModuleCard key="green" title={t.greenSpaceTitle} sub={t.greenSpaceSub} badge={parksBadge} source="https://api.golemio.cz">
          {parksBadge === "live" && liveParks.data ? (
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-bold text-2xl font-mono text-green-700">{liveParks.data.total}</div>
                <div className="text-[10px] text-gray-500">{lang === "en" ? "Parks & gardens" : "Parky a zahrady"}</div>
              </div>
              <div className="space-y-1.5">
                {liveParks.data.parks.slice(0, 4).map((p) => (
                  <div key={p.name} className="border-b border-gray-50 pb-1">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.description && <div className="text-[10px] text-gray-500 leading-tight">{p.description.slice(0, 80)}...</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <GreenSpaceModule d={d} lang={lang} />
          )}
        </ModuleCard>,
        <ModuleCard key="energy" title={t.energyTitle} sub={t.energySub} badge="demo" source="https://teplarenska.cz">
          <EnergyModule d={d} lang={lang} />
        </ModuleCard>,
      ],
    },
    {
      label: lang === "en" ? "Transport & Safety" : "Doprava a bezpečnost",
      modules: [
        <ModuleCard key="transit" title={t.transit} sub={t.transitSub} badge={transitBadge} source="https://pid.cz">
          {transitBadge === "live" && liveTransit.data ? (
            <div className="space-y-2">
              {liveTransit.data.slice(0, 4).map((item, i) => (
                <div key={i} className="border border-blue-100 bg-blue-50 rounded p-2.5 text-xs">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-900 hover:underline leading-tight block">
                    {item.title}
                  </a>
                  <div className="text-blue-700 text-[10px] mt-1">{item.category} · {new Date(item.pubDate).toLocaleDateString("cs-CZ")}</div>
                  {item.description && <p className="text-gray-600 text-[10px] mt-0.5 line-clamp-2">{item.description}</p>}
                </div>
              ))}
              {liveTransit.fetchedAt && (
                <div className="text-[9px] text-gray-400 text-center font-mono">
                  Live from PID · {new Date(liveTransit.fetchedAt).toLocaleTimeString("cs-CZ")}
                </div>
              )}
            </div>
          ) : (
            <TransitModule d={d} lang={lang} t={t} />
          )}
        </ModuleCard>,
        <ModuleCard key="parking" title={t.parking} sub={t.parkingSub} badge="demo" source="https://parkovanivpraze.cz">
          <ParkingModule d={d} lang={lang} t={t} />
        </ModuleCard>,
        <ModuleCard key="crime" title={t.crime} sub={t.crimeSub} badge="demo" source="https://mapakriminality.cz">
          <CrimeModule d={d} lang={lang} t={t} />
        </ModuleCard>,
        <ModuleCard key="permits" title={t.permits} sub={t.permitsSub} badge="demo" source="https://iprpraha.cz">
          <PermitsModule d={d} lang={lang} t={t} />
        </ModuleCard>,
      ],
    },
    {
      label: lang === "en" ? "Education & Community" : "Vzdělávání a komunita",
      modules: [
        <ModuleCard key="schools" title={t.schools} sub={t.schoolsSub} badge="demo" source="https://msmt.cz">
          <SchoolsModule d={d} lang={lang} t={t} />
        </ModuleCard>,
        <ModuleCard key="sports" title={t.sportsTitle} sub={t.sportsSub} badge={sportsBadge} source="https://api.golemio.cz">
          {sportsBadge === "live" && liveSports.data ? (
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-bold text-2xl font-mono text-blue-700">{liveSports.data.playgrounds}</div>
                <div className="text-[10px] text-gray-500">{lang === "en" ? "Playgrounds & sports facilities" : "Hřišť a sportovišť"}</div>
              </div>
              <div className="space-y-1">
                {liveSports.data.facilities.slice(0, 5).map((f) => (
                  <div key={f.name} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-gray-400 shrink-0">▸</span>
                    <span className="text-gray-700">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SportsModule d={d} lang={lang} />
          )}
        </ModuleCard>,
        <ModuleCard key="culture" title={t.cultureTitle} sub={t.cultureSub} badge={librariesBadge} source="https://api.golemio.cz">
          {librariesBadge === "live" && liveLibraries.data ? (
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-bold text-2xl font-mono text-purple-700">{liveLibraries.data.total}</div>
                <div className="text-[10px] text-gray-500">{lang === "en" ? "Libraries in district" : "Knihoven v obvodu"}</div>
              </div>
              <div className="space-y-1.5">
                {liveLibraries.data.libraries.slice(0, 5).map((lib) => (
                  <div key={lib.name} className="flex items-start justify-between text-[11px] border-b border-gray-50 pb-1">
                    <span className="text-gray-700">{lib.name}</span>
                    {lib.web && <a href={lib.web} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline text-[10px] shrink-0 ml-1">→</a>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <CultureModule d={d} lang={lang} />
          )}
        </ModuleCard>,
        <ModuleCard key="health" title={t.healthTitle} sub={t.healthSub} badge={healthBadge} source="https://api.golemio.cz">
          {healthBadge === "live" && liveHealth.data ? (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-bold text-lg font-mono">{liveHealth.data.pharmacies}</div>
                  <div className="text-[10px] text-gray-500">{lang === "en" ? "Pharmacies" : "Lékárny"}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-bold text-lg font-mono">{liveHealth.data.total - liveHealth.data.pharmacies}</div>
                  <div className="text-[10px] text-gray-500">{lang === "en" ? "Clinics" : "Ordinace"}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-bold text-lg font-mono">{liveHealth.data.total}</div>
                  <div className="text-[10px] text-gray-500">{lang === "en" ? "Total" : "Celkem"}</div>
                </div>
              </div>
              <div className="space-y-1">
                {liveHealth.data.facilities.slice(0, 4).map((f) => (
                  <div key={f.name + f.address} className="flex items-start justify-between text-[11px]">
                    <span className="text-gray-700 truncate">{f.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-1">{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <HealthModule d={d} lang={lang} />
          )}
        </ModuleCard>,
        <ModuleCard key="family" title={t.familyTitle} sub={t.familySub} badge="demo" source="https://praha7.cz">
          <FamilyModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="senior" title={t.seniorTitle} sub={t.seniorSub} badge="demo" source="https://mpsv.cz">
          <SeniorsModule d={d} lang={lang} />
        </ModuleCard>,
      ],
    },
    {
      label: lang === "en" ? "Civic & Accountability" : "Občanská práva",
      modules: [
        <ModuleCard key="leadership" title={t.leadershipTitle} sub={t.leadershipSub} badge="demo">
          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 rounded p-2.5">
              <div className="text-xs text-gray-500 mb-1">{t.mayor}</div>
              <div className="font-semibold text-gray-900">{d.mayor}</div>
              <div className="text-xs text-red-700 mt-0.5">{d.mayorParty}</div>
            </div>
            <a href={d.website} target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-red-700 hover:underline">
              {lang === "en" ? "Visit MČ website →" : "Stránky MČ →"}
            </a>
          </div>
        </ModuleCard>,
        <ModuleCard key="elections" title={t.electionTitle} sub={t.electionSub} badge="demo" source="https://volby.cz">
          <ElectionsModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="infozadost" title={t.infoZadostTitle} sub={t.infoZadostSub} badge="demo" source="https://infoprovsechny.cz">
          <InfoZadostModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="citizen" title={t.citizenTitle} sub={t.citizenSub} badge="demo" source="https://praha.eu">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded p-2 text-center">
                <div className="text-xl font-bold font-mono text-blue-700">3</div>
                <div className="text-[10px] text-gray-500">{lang === "en" ? "Active proposals" : "Aktivní návrhy"}</div>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xl font-bold font-mono text-gray-900">2 M</div>
                <div className="text-[10px] text-gray-500">{lang === "en" ? "Participatory budget" : "Participativní rozpočet"}</div>
              </div>
            </div>
            <div className="space-y-1">
              {(lang === "en"
                ? ["Letná park benches & lighting", "New playground Holešovice nábřeží", "Bike racks at tram stops"]
                : ["Lavičky a osvětlení Letná", "Nové hřiště nábřeží Holešovice", "Stojany na kola u tramvají"]
              ).map((item, i) => <div key={i} className="text-[10px] text-gray-700">• {item}</div>)}
            </div>
            <a href="https://www.praha7.cz/participativni-rozpocet" target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-red-700 hover:underline font-medium">
              {lang === "en" ? "Vote on proposals →" : "Hlasovat o návrzích →"}
            </a>
          </div>
        </ModuleCard>,
        <ModuleCard key="disability" title={t.disabilityTitle} sub={t.disabilitySub} badge="demo" source="https://iprpraha.cz">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: lang === "en" ? "Accessible routes" : "Přístupné trasy", value: "47 km", icon: "🦽" },
                { label: lang === "en" ? "ZTP parking spots" : "Parkoviště ZTP", value: "82", icon: "🅿️" },
                { label: lang === "en" ? "Accessible tram stops" : "Bezbariér. zastávky", value: "14 / 19", icon: "🚋" },
                { label: lang === "en" ? "Adapted playgrounds" : "Přístupná hřiště", value: "4", icon: "🛝" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded p-2">
                  <div className="text-lg">{item.icon}</div>
                  <div className="font-bold font-mono text-gray-900">{item.value}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{item.label}</div>
                </div>
              ))}
            </div>
            <a href="https://www.geoportalpraha.cz/cs/mapy/bezbarierova-mapa" target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-red-700 hover:underline font-medium">
              {lang === "en" ? "Barrier-free map →" : "Mapa bezbariérovosti →"}
            </a>
          </div>
        </ModuleCard>,
        <ModuleCard key="opendata" title={t.openDataTitle} sub={t.openDataSub} badge="demo" source="https://opendata.gov.cz">
          <div className="space-y-2 text-xs">
            <div className="space-y-1.5">
              {(lang === "en"
                ? [
                    { name: "Budget datasets (2020–2024)", format: "CSV / JSON" },
                    { name: "Building permits register", format: "XML" },
                    { name: "Municipal property list", format: "CSV" },
                    { name: "Green space & tree registry", format: "GeoJSON" },
                  ]
                : [
                    { name: "Rozpočtová data (2020–2024)", format: "CSV / JSON" },
                    { name: "Registr stavebních povolení", format: "XML" },
                    { name: "Soupis obecního majetku", format: "CSV" },
                    { name: "Registr zeleně a stromů", format: "GeoJSON" },
                  ]
              ).map((ds, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-1">
                  <span className="text-gray-700">{ds.name}</span>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 rounded">{ds.format}</span>
                </div>
              ))}
            </div>
            <a href="https://opendata.gov.cz/katalog" target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-red-700 hover:underline font-medium">
              {lang === "en" ? "Open Data Catalogue →" : "Katalog otevřených dat →"}
            </a>
          </div>
        </ModuleCard>,
      ],
    },
    {
      label: lang === "en" ? "Maps & Data" : "Mapy a data",
      modules: [
        <ModuleCard key="maps" title={t.mapsTitle} sub={t.mapsSub} badge="demo" source="https://iprpraha.cz">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {(lang === "en"
                ? ["Zoning & land use", "Building permits map", "Noise map (2022)", "Green & blue infrastructure", "Traffic intensity", "Barrier-free routes"]
                : ["Územní plán", "Mapa stavebních povolení", "Hluková mapa (2022)", "Zeleň a modrá infrastruktura", "Intenzita dopravy", "Bezbariérové trasy"]
              ).map((layer, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-700">
                  <span className="text-gray-400">▤</span>{layer}
                </div>
              ))}
            </div>
            <a href="https://www.geoportalpraha.cz" target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-red-700 hover:underline font-medium">
              {lang === "en" ? "Open Geoportal Praha →" : "Otevřít Geoportál Praha →"}
            </a>
          </div>
        </ModuleCard>,
        <ModuleCard key="demographics" title={t.demographicsTitle} sub={t.demographicsSub} badge="demo">
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: t.population, value: fmt(d.population), unit: "" },
              { label: t.area, value: d.area.toString(), unit: "km²" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded p-2.5">
                <div className="text-lg font-bold font-mono text-gray-900">{item.value}</div>
                {item.unit && <div className="text-[10px] text-gray-400">{item.unit}</div>}
                <div className="text-[10px] text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </ModuleCard>,
        <ModuleCard key="housing" title={t.housingTitle} sub={t.housingSub} badge="demo" source="https://mhmp.cz">
          <HousingModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="unemployment" title={t.unemploymentTitle} sub={t.unemploymentSub} badge="demo" source="https://uradprace.cz">
          <EmploymentModule d={d} lang={lang} />
        </ModuleCard>,
        <ModuleCard key="business" title={t.businessTitle} sub={t.businessSub} badge={businessBadge} source="https://ares.gov.cz">
          {businessBadge === "live" && liveBusiness.data ? (
            <div className="space-y-2">
              <div className="bg-gray-50 rounded p-2.5 text-xs">
                <div className="text-[10px] text-gray-500 mb-0.5">{lang === "en" ? "Official registry entry (ARES)" : "Záznam v ARES"}</div>
                <div className="font-semibold text-gray-900">{liveBusiness.data.name}</div>
                <div className="text-gray-500 mt-0.5 font-mono text-[10px]">IČO: {liveBusiness.data.ico}</div>
                <div className="text-gray-500 text-[10px] mt-0.5">{liveBusiness.data.address}</div>
              </div>
              <BusinessModule d={d} lang={lang} />
              {liveBusiness.fetchedAt && (
                <div className="text-[9px] text-gray-400 text-center font-mono">
                  Live from ARES · {new Date(liveBusiness.fetchedAt).toLocaleTimeString("cs-CZ")}
                </div>
              )}
            </div>
          ) : (
            <BusinessModule d={d} lang={lang} />
          )}
        </ModuleCard>,
        <ModuleCard key="cityhall" title={t.cityHallTitle} sub={t.cityHallSub} badge={cityHallBadge} source="https://api.golemio.cz">
          {cityHallBadge === "live" && liveCityHall.data ? (
            <div className="text-sm space-y-1.5">
              {liveCityHall.data.address && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{lang === "en" ? "Address" : "Adresa"}</span>
                  <span className="text-gray-700 text-right text-[11px] ml-2">{liveCityHall.data.address}</span>
                </div>
              )}
              {liveCityHall.data.phone && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{lang === "en" ? "Phone" : "Telefon"}</span>
                  <span className="text-gray-700 font-mono">{liveCityHall.data.phone}</span>
                </div>
              )}
              {liveCityHall.data.email && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-700 text-[11px]">{liveCityHall.data.email}</span>
                </div>
              )}
              {liveCityHall.data.web && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Web</span>
                  <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline font-medium">{liveCityHall.data.web}</a>
                </div>
              )}
              {liveCityHall.data.services.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-[10px] text-gray-500 mb-1">{lang === "en" ? "Services" : "Služby"}:</div>
                  <div className="space-y-0.5">
                    {liveCityHall.data.services.slice(0, 4).map((s) => (
                      <div key={s} className="text-[11px] text-gray-600">• {s}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{lang === "en" ? "Website" : "Web"}</span>
                <a href={d.website} target="_blank" rel="noopener noreferrer"
                  className="text-red-700 hover:underline font-medium truncate ml-2">
                  {d.website.replace("https://", "")}
                </a>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{lang === "en" ? "Office hours" : "Úřední hodiny"}</span>
                <span className="text-gray-700">Mon/Wed 8–18, Fri 8–12</span>
              </div>
            </div>
          )}
        </ModuleCard>,
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-gray-900">ForThePeople</span>
                <span className="text-lg font-bold text-red-700">.cz</span>
              </div>
              <div className="text-[10px] text-gray-500 -mt-0.5 hidden sm:block">{t.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/sources" className="text-xs font-medium text-gray-500 hover:text-red-700 transition-colors hidden sm:block">
              {lang === "en" ? "Sources" : "Zdroje"}
            </a>
            <button
              onClick={() => setLang(lang === "en" ? "cs" : "en")}
              className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-full hover:border-red-400 transition-colors"
            >
              {lang === "en" ? "🇨🇿 Česky" : "🇬🇧 English"}
            </button>
          </div>
        </div>
      </header>

      <LiveTicker lang={lang} district={d} weather={liveWeather.data} air={liveAir.data} />

      {/* District Hero */}
      <div className="bg-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="text-red-300 text-xs font-mono uppercase tracking-widest mb-1">
                Praha — Hlavní město
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {lang === "en" ? d.name : d.nameCz}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-red-200 text-sm">
                <span>👤 {fmt(d.population)}</span>
                <span>📐 {d.area} km²</span>
                <span>🏛 {d.mayor}</span>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <div className="text-red-300 text-xs mb-2 font-mono">{t.districtSelector}</div>
              <DistrictSelector current={districtId} onChange={setDistrictId} />
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800">
        ⚠️ {t.disclaimer}
      </div>

      {/* Module Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {categories.map((cat) => (
          <section key={cat.label}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.modules}
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <div className="text-sm font-bold text-gray-900">ForThePeople.cz</div>
          <div className="text-xs text-gray-500">
            {lang === "en"
              ? "Open civic transparency for Prague's 22 districts. Inspired by forthepeople.in."
              : "Otevřená transparentnost pro 22 pražských MČ. Inspirováno forthepeople.in."}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            Data sources: MHMP · smlouvy.gov.cz · ČHMÚ · PID · IPR Praha · mapakriminality.cz · ARES · dotaceeu.cz
          </div>
          <div className="mt-2">
            <a href="/sources" className="text-xs text-red-700 hover:underline font-medium">
              {lang === "en" ? "View all data sources & status →" : "Zobrazit všechny zdroje dat a stav →"}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
