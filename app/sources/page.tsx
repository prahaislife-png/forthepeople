"use client";

import { useState, useEffect } from "react";

type SourceStatus = "live" | "demo" | "error";

interface DataSource {
  section: string;
  sectionCz: string;
  source: string;
  sourceUrl: string;
  status: SourceStatus;
  apiRoute: string | null;
  lastChecked: string | null;
  notes: string;
  notesCz: string;
}

const SOURCES: DataSource[] = [
  {
    section: "Public Contracts",
    sectionCz: "Veřejné smlouvy",
    source: "Registr smluv (ISRS)",
    sourceUrl: "https://data.smlouvy.gov.cz",
    status: "live",
    apiRoute: "/api/data/contracts?district=7",
    lastChecked: null,
    notes: "Daily XML dump files parsed server-side. Filtered by district ICO. Cached 6 hours.",
    notesCz: "Denní XML dump soubory parsované na serveru. Filtrace dle IČO MČ. Cache 6 hodin.",
  },
  {
    section: "Business Registry",
    sectionCz: "Obchodní rejstřík",
    source: "ARES (MF ČR)",
    sourceUrl: "https://ares.gov.cz",
    status: "live",
    apiRoute: "/api/data/business?district=7",
    lastChecked: null,
    notes: "REST API — GET by ICO. Returns entity details, legal form, CZ-NACE codes. No auth required. Cached 24h.",
    notesCz: "REST API — GET dle IČO. Vrací údaje o subjektu, právní formu, CZ-NACE. Bez autentizace. Cache 24h.",
  },
  {
    section: "Transit Alerts",
    sectionCz: "Dopravní informace",
    source: "PID (Pražská integrovaná doprava)",
    sourceUrl: "https://pid.cz/feed/",
    status: "live",
    apiRoute: "/api/data/transit",
    lastChecked: null,
    notes: "WordPress RSS feed with traffic news. Parsed server-side. Cached 10 min. General Prague-wide, not district-specific.",
    notesCz: "WordPress RSS feed s dopravními novinkami. Parsováno na serveru. Cache 10 min. Celopražské, ne specifické pro MČ.",
  },
  {
    section: "Air Quality",
    sectionCz: "Kvalita ovzduší",
    source: "Open-Meteo Air Quality API",
    sourceUrl: "https://air-quality-api.open-meteo.com",
    status: "live",
    apiRoute: "/api/data/air",
    lastChecked: null,
    notes: "Free API, no key required. Returns PM2.5, PM10, NO2, O3, European AQI for Prague coordinates. Cached 1 hour.",
    notesCz: "Bezplatné API bez klíče. Vrací PM2.5, PM10, NO2, O3, evropský AQI pro souřadnice Prahy. Cache 1 hodina.",
  },
  {
    section: "Weather",
    sectionCz: "Počasí",
    source: "Open-Meteo Forecast API",
    sourceUrl: "https://api.open-meteo.com",
    status: "live",
    apiRoute: "/api/data/weather",
    lastChecked: null,
    notes: "Free API, no key required. Current temperature, wind speed, weather code for Prague. Cached 1 hour.",
    notesCz: "Bezplatné API bez klíče. Aktuální teplota, vítr, kód počasí pro Prahu. Cache 1 hodina.",
  },
  {
    section: "Budget",
    sectionCz: "Rozpočet",
    source: "Monitor státní pokladny (MF ČR)",
    sourceUrl: "https://monitor.statnipokladna.cz",
    status: "live",
    apiRoute: "/api/data/budget?district=7",
    lastChecked: null,
    notes: "Data scraped via Apify from Monitor. Updated every 6 hours via cron. Stored in Supabase.",
    notesCz: "Data získávána přes Apify z Monitoru. Aktualizace každých 6 hodin. Uloženo v Supabase.",
  },
  {
    section: "Health & Medical",
    sectionCz: "Zdravotnictví",
    source: "Golemio (OICT Praha)",
    sourceUrl: "https://api.golemio.cz",
    status: "live",
    apiRoute: "/api/data/health?district=7",
    lastChecked: null,
    notes: "Golemio medicalinstitutions endpoint. Returns pharmacies, clinics, hospitals by district coordinates. Free API key.",
    notesCz: "Golemio endpoint medicalinstitutions. Vrací lékárny, ordinace, nemocnice dle souřadnic MČ. Bezplatný API klíč.",
  },
  {
    section: "Parks & Green Space",
    sectionCz: "Parky a zeleň",
    source: "Golemio (OICT Praha)",
    sourceUrl: "https://api.golemio.cz",
    status: "live",
    apiRoute: "/api/data/parks?district=7",
    lastChecked: null,
    notes: "Golemio gardens endpoint. Returns named parks with descriptions per district. Free API key.",
    notesCz: "Golemio endpoint gardens. Vrací pojmenované parky s popisky dle MČ. Bezplatný API klíč.",
  },
  {
    section: "Sports & Playgrounds",
    sectionCz: "Sport a hřiště",
    source: "Golemio (OICT Praha)",
    sourceUrl: "https://api.golemio.cz",
    status: "live",
    apiRoute: "/api/data/sports?district=7",
    lastChecked: null,
    notes: "Golemio playgrounds endpoint. Returns playgrounds and sports facilities per district. Free API key.",
    notesCz: "Golemio endpoint playgrounds. Vrací hřiště a sportoviště dle MČ. Bezplatný API klíč.",
  },
  {
    section: "Libraries",
    sectionCz: "Knihovny",
    source: "Golemio (OICT Praha)",
    sourceUrl: "https://api.golemio.cz",
    status: "live",
    apiRoute: "/api/data/libraries?district=7",
    lastChecked: null,
    notes: "Golemio municipallibraries endpoint. Returns library names, addresses, websites. Free API key.",
    notesCz: "Golemio endpoint municipallibraries. Vrací názvy, adresy, weby knihoven. Bezplatný API klíč.",
  },
  {
    section: "Waste & Recycling",
    sectionCz: "Odpady a recyklace",
    source: "Golemio (OICT Praha)",
    sourceUrl: "https://api.golemio.cz",
    status: "live",
    apiRoute: "/api/data/waste?district=7",
    lastChecked: null,
    notes: "Golemio sortedwastestations endpoint. Returns container counts, types, fill levels, next pickup dates. Free API key.",
    notesCz: "Golemio endpoint sortedwastestations. Vrací počty kontejnerů, typy, naplnění, další svozy. Bezplatný API klíč.",
  },
  {
    section: "City Hall",
    sectionCz: "Radnice",
    source: "Golemio (OICT Praha)",
    sourceUrl: "https://api.golemio.cz",
    status: "live",
    apiRoute: "/api/data/cityhall?district=7",
    lastChecked: null,
    notes: "Golemio municipalauthorities endpoint. Returns office address, phone, email, services offered. Free API key.",
    notesCz: "Golemio endpoint municipalauthorities. Vrací adresu, telefon, email, nabízené služby. Bezplatný API klíč.",
  },
  {
    section: "Elections",
    sectionCz: "Volby",
    source: "ČSÚ (volby.cz)",
    sourceUrl: "https://volby.cz",
    status: "live",
    apiRoute: "/api/data/elections?district=7",
    lastChecked: null,
    notes: "XML exports from volby.cz parsed server-side. Municipal elections 2022 results by district.",
    notesCz: "XML exporty z volby.cz parsované na serveru. Výsledky komunálních voleb 2022 dle MČ.",
  },
  {
    section: "Crime Statistics",
    sectionCz: "Kriminalita",
    source: "Mapa kriminality (Policie ČR)",
    sourceUrl: "https://mapakriminality.cz",
    status: "live",
    apiRoute: "/api/data/crime?district=7",
    lastChecked: null,
    notes: "Scraped via Apify actor from mapakriminality.cz. Updated weekly via cron.",
    notesCz: "Získáváno přes Apify actor z mapakriminality.cz. Aktualizace týdně.",
  },
  {
    section: "Housing & Rent",
    sectionCz: "Bydlení a nájemné",
    source: "Sreality / ČSÚ",
    sourceUrl: "https://www.sreality.cz",
    status: "live",
    apiRoute: "/api/data/housing?district=7",
    lastChecked: null,
    notes: "Market data scraped via Apify. ČSÚ statistics for official indices. Updated daily.",
    notesCz: "Tržní data přes Apify. Statistiky ČSÚ pro oficiální indexy. Denní aktualizace.",
  },
  {
    section: "Schools",
    sectionCz: "Školy",
    source: "MŠMT Rejstřík škol",
    sourceUrl: "https://rejstriky.msmt.cz",
    status: "live",
    apiRoute: "/api/data/schools?district=7",
    lastChecked: null,
    notes: "School registry scraped via Apify. Counts by type per district. Updated weekly.",
    notesCz: "Rejstřík škol přes Apify. Počty dle typu a MČ. Týdenní aktualizace.",
  },
  {
    section: "Tenders",
    sectionCz: "Veřejné zakázky",
    source: "Věstník veřejných zakázek",
    sourceUrl: "https://vestnikverejnychzakazek.cz",
    status: "live",
    apiRoute: "/api/data/tenders?district=7",
    lastChecked: null,
    notes: "Scraped via Apify. Active tenders for district. Updated every 6 hours.",
    notesCz: "Získáváno přes Apify. Aktivní zakázky pro MČ. Aktualizace každých 6 hodin.",
  },
  {
    section: "Employment",
    sectionCz: "Zaměstnanost",
    source: "ÚP ČR / ČSÚ",
    sourceUrl: "https://www.uradprace.cz",
    status: "live",
    apiRoute: "/api/data/employment?district=7",
    lastChecked: null,
    notes: "Employment data scraped from ÚP and ČSÚ via Apify. Updated weekly.",
    notesCz: "Data o zaměstnanosti z ÚP a ČSÚ přes Apify. Týdenní aktualizace.",
  },
];

function StatusBadge({ status }: { status: SourceStatus }) {
  const styles: Record<SourceStatus, string> = {
    live: "bg-green-100 text-green-800 border-green-200",
    demo: "bg-amber-100 text-amber-800 border-amber-200",
    error: "bg-red-100 text-red-800 border-red-200",
  };
  const labels: Record<SourceStatus, string> = {
    live: "LIVE",
    demo: "DEMO",
    error: "ERROR",
  };
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function SourcesPage() {
  const [checks, setChecks] = useState<Record<string, { status: SourceStatus; fetchedAt: string; error?: string }>>({});
  const [loading, setLoading] = useState(false);

  async function runChecks() {
    setLoading(true);
    const routes = SOURCES.filter((s) => s.apiRoute);
    const results: typeof checks = {};

    await Promise.allSettled(
      routes.map(async (s) => {
        try {
          const res = await fetch(s.apiRoute!);
          const json = await res.json();
          results[s.section] = { status: json.status, fetchedAt: json.fetchedAt, error: json.error };
        } catch {
          results[s.section] = { status: "error", fetchedAt: new Date().toISOString(), error: "Fetch failed" };
        }
      })
    );

    setChecks(results);
    setLoading(false);
  }

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-gray-900">ForThePeople</span>
              <span className="text-lg font-bold text-red-700">.cz</span>
            </a>
            <span className="text-xs text-gray-400 font-mono">/ sources</span>
          </div>
          <button
            onClick={runChecks}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-full hover:border-red-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Checking..." : "Re-check all"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Sources & Status</h1>
          <p className="text-sm text-gray-600">
            Each section on ForThePeople.cz pulls data from Czech government open-data portals.
            This page shows the current integration status of each source.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {(["live", "demo", "error"] as SourceStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <StatusBadge status={s} />
                <span className="text-[10px] text-gray-500">
                  {s === "live" && "— fetching real data from source automatically"}
                  {s === "demo" && "— showing realistic but hardcoded data"}
                  {s === "error" && "— source unreachable or returning errors"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {SOURCES.map((src) => {
            const check = checks[src.section];
            const effectiveStatus = check?.status ?? src.status;
            return (
              <div key={src.section} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{src.section}</h3>
                    <p className="text-xs text-gray-500">{src.sectionCz}</p>
                  </div>
                  <StatusBadge status={effectiveStatus} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
                  <div>
                    <span className="text-gray-500">Source: </span>
                    <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline">
                      {src.source}
                    </a>
                  </div>
                  {src.apiRoute && (
                    <div>
                      <span className="text-gray-500">Route: </span>
                      <code className="text-gray-700 bg-gray-100 px-1 rounded text-[10px]">{src.apiRoute}</code>
                    </div>
                  )}
                  {check?.fetchedAt && (
                    <div>
                      <span className="text-gray-500">Last checked: </span>
                      <span className="font-mono text-gray-700">{new Date(check.fetchedAt).toLocaleString("cs-CZ")}</span>
                    </div>
                  )}
                  {check?.error && (
                    <div className="sm:col-span-2">
                      <span className="text-red-600 font-mono text-[10px]">Error: {check.error}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-gray-600 bg-gray-50 rounded p-2">
                  {src.notes}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-500">
          <a href="/" className="text-red-700 hover:underline">← Back to dashboard</a>
        </div>
      </footer>
    </div>
  );
}
