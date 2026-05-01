"use client";

import { useState, useEffect } from "react";
import { DISTRICTS, getDistrict } from "./data/districts";

interface LiveState<T> {
  status: "live" | "loading" | "error";
  data: T | null;
  fetchedAt: string | null;
  source?: string;
}

function useLiveData<T>(url: string | null): LiveState<T> {
  const [state, setState] = useState<LiveState<T>>({ status: "loading", data: null, fetchedAt: null });
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setState({ status: json.status === "live" ? "live" : "error", data: json.data, fetchedAt: json.fetchedAt, source: json.source });
      })
      .catch(() => { if (!cancelled) setState({ status: "error", data: null, fetchedAt: null }); });
    return () => { cancelled = true; };
  }, [url]);
  return state;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtCZK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M CZK`;
  if (n >= 1_000) return `${Math.round(n / 1000)}k CZK`;
  return `${n} CZK`;
}

export default function Page() {
  const [districtId, setDistrictId] = useState(7);
  const [showPanel, setShowPanel] = useState(false);
  const d = getDistrict(districtId);

  const liveWeather = useLiveData<{ temperature: number; windspeed: number; description: string }>("/api/data/weather");
  const liveAir = useLiveData<{ pm25: number; pm10: number; no2: number; o3: number; aqi: number; status: string }>("/api/data/air");
  const liveTransit = useLiveData<{ title: string; link: string; pubDate: string; description: string }[]>("/api/data/transit");
  const liveContracts = useLiveData<{ id: string; supplier: string; subject: string; value: number; date: string }[]>(`/api/data/contracts?district=${districtId}`);
  const liveHealth = useLiveData<{ pharmacies: number; gps: number; specialists: number; hospitals: number; total: number; facilities: { name: string; type: string; address: string }[] }>(`/api/data/health?district=${districtId}`);
  const liveWaste = useLiveData<{ stations: number; containers: number; types: Record<string, number>; monitoredContainers: number }>(`/api/data/waste?district=${districtId}`);
  const liveParks = useLiveData<{ total: number; parks: { name: string; description: string }[] }>(`/api/data/parks?district=${districtId}`);
  const liveSports = useLiveData<{ playgrounds: number; facilities: { name: string; address: string }[] }>(`/api/data/sports?district=${districtId}`);
  const liveLibraries = useLiveData<{ total: number; libraries: { name: string; address: string; web?: string }[] }>(`/api/data/libraries?district=${districtId}`);
  const liveBusiness = useLiveData<{ ico: string; name: string; legalForm: string; address: string }>(`/api/data/business?district=${districtId}`);
  const liveCityHall = useLiveData<{ name: string; address: string; phone?: string; email?: string; web?: string }>(`/api/data/cityhall?district=${districtId}`);
  const liveBudget = useLiveData<{ source: string; year?: number; totalRevenue?: number; totalExpenditure?: number; surplus?: number; summary?: string }>(`/api/data/budget?district=${districtId}`);
  const liveCrime = useLiveData<{ source: string; total?: number; change?: number; summary?: string }>(`/api/data/crime?district=${districtId}`);
  const liveElections = useLiveData<{ source: string; lastElection?: string; turnout?: number; seats?: number; parties?: { name: string; votes: number; seats: number; pct: number }[]; summary?: string }>(`/api/data/elections?district=${districtId}`);
  const liveHousing = useLiveData<{ source: string; avgRentM2?: number; avgSaleM2?: number; municipalUnits?: number; vacancyRate?: number; summary?: string }>(`/api/data/housing?district=${districtId}`);
  const liveEmployment = useLiveData<{ source: string; unemploymentRate?: number; jobseekers?: number; avgSalary?: number; topEmployers?: string[]; summary?: string }>(`/api/data/employment?district=${districtId}`);
  const liveSchools = useLiveData<{ source: string; primary?: number; secondary?: number; kindergarten?: number; universities?: number; total?: number; summary?: string }>(`/api/data/schools?district=${districtId}`);
  const liveTenders = useLiveData<{ source: string; id?: string; title?: string; estimatedValue?: number; status?: string }[]>(`/api/data/tenders?district=${districtId}`);
  const liveEnergy = useLiveData<{ heatPriceGJ: number; electricityPriceKWh: number; gasPrice: number; renewableShare: number }>(`/api/data/energy?district=${districtId}`);
  const liveWater = useLiveData<{ hardness: string; ph: number; nitrates: number; chlorine: number; rating: string; lastTest: string }>(`/api/data/water?district=${districtId}`);

  const allFetchedAts = [liveWeather, liveAir, liveTransit, liveContracts, liveHealth, liveWaste, liveParks, liveSports, liveLibraries, liveBusiness, liveCityHall, liveBudget, liveCrime, liveElections, liveHousing, liveEmployment, liveSchools, liveTenders, liveEnergy, liveWater]
    .map((s) => s.fetchedAt).filter(Boolean) as string[];
  const latestUpdate = allFetchedAts.length > 0 ? allFetchedAts.sort().reverse()[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">FP</span>
                </div>
                <span className="text-sm font-bold text-slate-900">ForThePeople<span className="text-indigo-600">.cz</span></span>
              </a>
              <span className="hidden sm:inline text-xs text-slate-400">|</span>
              <span className="hidden sm:inline text-xs text-slate-500 font-medium">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {latestUpdate && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Updated {timeAgo(latestUpdate)}
                </div>
              )}
              <a href="/sources" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium px-2 py-1">
                Sources
              </a>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="lg:hidden text-xs font-semibold text-white bg-indigo-600 px-3 py-1.5 rounded-lg"
              >
                Praha {districtId}
              </button>
            </div>
          </div>
        </header>

        {/* Hero - Compact */}
        <div className="bg-indigo-600 px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white">{d.name}</h1>
          <p className="text-indigo-200 text-sm mt-1">
            {new Intl.NumberFormat("en").format(d.population)} residents · {d.area} km² · Prague, Czech Republic
          </p>
        </div>

        {/* Stats Row */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {liveWeather.data && (
              <span className="text-slate-700"><span className="text-slate-400">Weather</span> <strong>{liveWeather.data.temperature}°C</strong> {liveWeather.data.description}</span>
            )}
            {liveAir.data && (
              <span className="text-slate-700"><span className="text-slate-400">Air</span> <strong className={liveAir.data.aqi < 50 ? "text-green-600" : liveAir.data.aqi < 100 ? "text-amber-600" : "text-red-600"}>AQI {liveAir.data.aqi}</strong> PM2.5 {liveAir.data.pm25}ug/m3</span>
            )}
            {liveTransit.data && (
              <span className="text-slate-700"><span className="text-slate-400">Transit</span> <strong className="text-indigo-600">{liveTransit.data.length} active alerts</strong></span>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <main className="px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">

            {/* Contracts */}
            <Tile title="Public Contracts" status={liveContracts.status} source={liveContracts.source}>
              {liveContracts.data && liveContracts.data.length > 0 ? (
                <>
                  <div className="text-2xl font-black text-slate-900">{liveContracts.data.length}</div>
                  <div className="text-[11px] text-slate-500 mb-2">recent contracts</div>
                  {liveContracts.data.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex justify-between text-[11px] py-0.5">
                      <span className="text-slate-600 truncate flex-1 mr-2">{c.subject}</span>
                      <span className="text-indigo-600 font-semibold shrink-0">{fmtCZK(c.value)}</span>
                    </div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Health */}
            <Tile title="Health & Medical" status={liveHealth.status} source={liveHealth.source}>
              {liveHealth.data ? (
                <>
                  <div className="text-2xl font-black text-slate-900">{liveHealth.data.total}</div>
                  <div className="text-[11px] text-slate-500 mb-2">facilities nearby</div>
                  <div className="flex gap-3 text-[11px]">
                    <span><strong>{liveHealth.data.pharmacies}</strong> pharmacies</span>
                    <span><strong>{liveHealth.data.gps}</strong> GPs</span>
                    <span><strong>{liveHealth.data.specialists}</strong> specialists</span>
                  </div>
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Transit */}
            <Tile title="Transit Alerts" status={liveTransit.status} source={liveTransit.source}>
              {liveTransit.data && liveTransit.data.length > 0 ? (
                <div className="space-y-1.5">
                  {liveTransit.data.slice(0, 3).map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-slate-600 hover:text-indigo-600 truncate">
                      {item.title}
                    </a>
                  ))}
                </div>
              ) : <Skeleton />}
            </Tile>

            {/* Waste */}
            <Tile title="Waste & Recycling" status={liveWaste.status} source={liveWaste.source}>
              {liveWaste.data ? (
                <>
                  <div className="flex gap-4 mb-1">
                    <div><span className="text-2xl font-black text-slate-900">{liveWaste.data.stations}</span><span className="text-[11px] text-slate-500 ml-1">stations</span></div>
                    <div><span className="text-2xl font-black text-slate-900">{liveWaste.data.containers}</span><span className="text-[11px] text-slate-500 ml-1">bins</span></div>
                  </div>
                  <div className="text-[11px] text-slate-500">{liveWaste.data.monitoredContainers} smart-monitored</div>
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Parks */}
            <Tile title="Parks & Green Spaces" status={liveParks.status} source={liveParks.source}>
              {liveParks.data ? (
                <>
                  <div className="text-2xl font-black text-slate-900">{liveParks.data.total}</div>
                  <div className="text-[11px] text-slate-500 mb-2">parks & gardens</div>
                  {liveParks.data.parks.slice(0, 3).map((p) => (
                    <div key={p.name} className="text-[11px] text-slate-600 truncate">{p.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Sports */}
            <Tile title="Sports & Recreation" status={liveSports.status} source={liveSports.source}>
              {liveSports.data ? (
                <>
                  <div className="text-2xl font-black text-slate-900">{liveSports.data.playgrounds}</div>
                  <div className="text-[11px] text-slate-500 mb-2">playgrounds & facilities</div>
                  {liveSports.data.facilities.slice(0, 2).map((f) => (
                    <div key={f.name} className="text-[11px] text-slate-600 truncate">{f.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Libraries */}
            <Tile title="Libraries" status={liveLibraries.status} source={liveLibraries.source}>
              {liveLibraries.data ? (
                <>
                  <div className="text-2xl font-black text-slate-900">{liveLibraries.data.total}</div>
                  <div className="text-[11px] text-slate-500 mb-2">public libraries</div>
                  {liveLibraries.data.libraries.slice(0, 3).map((lib) => (
                    <div key={lib.name} className="text-[11px] text-slate-600 truncate">{lib.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Business */}
            <Tile title="Business Registry" status={liveBusiness.status} source={liveBusiness.source}>
              {liveBusiness.data ? (
                <>
                  <div className="text-sm font-bold text-slate-900 mb-1">{liveBusiness.data.name}</div>
                  <div className="text-[11px] text-slate-500">ICO {liveBusiness.data.ico}</div>
                  <div className="text-[11px] text-slate-600 mt-1 truncate">{liveBusiness.data.address}</div>
                </>
              ) : <Skeleton />}
            </Tile>

            {/* City Hall */}
            <Tile title="City Hall" status={liveCityHall.status} source={liveCityHall.source}>
              {liveCityHall.data ? (
                <div className="space-y-1 text-[11px]">
                  {liveCityHall.data.address && <div className="text-slate-700">{liveCityHall.data.address}</div>}
                  {liveCityHall.data.phone && <div className="text-slate-600">Tel: <span className="font-mono">{liveCityHall.data.phone}</span></div>}
                  {liveCityHall.data.email && <div className="text-slate-600">{liveCityHall.data.email}</div>}
                  {liveCityHall.data.web && <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium">{liveCityHall.data.web}</a>}
                </div>
              ) : <Skeleton />}
            </Tile>

            {/* Budget - NEW */}
            <Tile title="District Budget" status={liveBudget.status} source={liveBudget.source}>
              {liveBudget.data ? (
                <>
                  {liveBudget.data.totalRevenue ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]"><span className="text-slate-500">Revenue</span><strong className="text-green-700">{fmtCZK(liveBudget.data.totalRevenue * 1_000_000)}</strong></div>
                      <div className="flex justify-between text-[11px]"><span className="text-slate-500">Expenditure</span><strong className="text-slate-900">{fmtCZK(liveBudget.data.totalExpenditure ? liveBudget.data.totalExpenditure * 1_000_000 : 0)}</strong></div>
                      {liveBudget.data.surplus != null && <div className="flex justify-between text-[11px]"><span className="text-slate-500">Surplus</span><strong className={liveBudget.data.surplus >= 0 ? "text-green-700" : "text-red-600"}>{fmtCZK(liveBudget.data.surplus * 1_000_000)}</strong></div>}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">{liveBudget.data.summary || "Budget data synced"}</div>
                  )}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Crime - NEW */}
            <Tile title="Crime Statistics" status={liveCrime.status} source={liveCrime.source}>
              {liveCrime.data ? (
                <>
                  {liveCrime.data.total ? (
                    <>
                      <div className="text-2xl font-black text-slate-900">{liveCrime.data.total.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500">reported incidents</div>
                      {liveCrime.data.change != null && (
                        <div className={`text-[11px] font-semibold mt-1 ${liveCrime.data.change < 0 ? "text-green-600" : "text-red-600"}`}>
                          {liveCrime.data.change > 0 ? "+" : ""}{liveCrime.data.change}% year-over-year
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-500">{liveCrime.data.summary?.slice(0, 100) || "Crime data available"}</div>
                  )}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Elections - NEW */}
            <Tile title="Elections" status={liveElections.status} source={liveElections.source}>
              {liveElections.data ? (
                <>
                  {liveElections.data.turnout ? (
                    <>
                      <div className="flex gap-4 mb-1.5">
                        <div><span className="text-2xl font-black text-slate-900">{liveElections.data.turnout}%</span><span className="text-[11px] text-slate-500 ml-1">turnout</span></div>
                        <div><span className="text-xl font-bold text-slate-700">{liveElections.data.seats}</span><span className="text-[11px] text-slate-500 ml-1">seats</span></div>
                      </div>
                      {liveElections.data.parties?.slice(0, 3).map((p) => (
                        <div key={p.name} className="flex justify-between text-[11px] py-0.5">
                          <span className="text-slate-600 truncate flex-1 mr-2">{p.name}</span>
                          <span className="text-slate-900 font-medium">{p.pct}%</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-500">{liveElections.data.summary?.slice(0, 100) || "Election data available"}</div>
                  )}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Housing - NEW */}
            <Tile title="Housing & Rent" status={liveHousing.status} source={liveHousing.source}>
              {liveHousing.data ? (
                <>
                  {liveHousing.data.avgRentM2 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]"><span className="text-slate-500">Avg rent</span><strong>{liveHousing.data.avgRentM2} CZK/m²/mo</strong></div>
                      <div className="flex justify-between text-[11px]"><span className="text-slate-500">Avg sale price</span><strong>{liveHousing.data.avgSaleM2?.toLocaleString()} CZK/m²</strong></div>
                      {liveHousing.data.vacancyRate != null && <div className="flex justify-between text-[11px]"><span className="text-slate-500">Vacancy</span><strong>{liveHousing.data.vacancyRate}%</strong></div>}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">{liveHousing.data.summary?.slice(0, 100) || "Housing data available"}</div>
                  )}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Employment - NEW */}
            <Tile title="Employment" status={liveEmployment.status} source={liveEmployment.source}>
              {liveEmployment.data ? (
                <>
                  {liveEmployment.data.unemploymentRate != null ? (
                    <>
                      <div className="text-2xl font-black text-slate-900">{liveEmployment.data.unemploymentRate}%</div>
                      <div className="text-[11px] text-slate-500 mb-1">unemployment rate</div>
                      {liveEmployment.data.avgSalary && <div className="text-[11px] text-slate-600">Avg salary: <strong>{liveEmployment.data.avgSalary.toLocaleString()} CZK</strong></div>}
                      {liveEmployment.data.jobseekers && <div className="text-[11px] text-slate-600">{liveEmployment.data.jobseekers} active jobseekers</div>}
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-500">{liveEmployment.data.summary?.slice(0, 100) || "Employment data available"}</div>
                  )}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Schools - NEW */}
            <Tile title="Education" status={liveSchools.status} source={liveSchools.source}>
              {liveSchools.data ? (
                <>
                  {liveSchools.data.primary != null ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      <span><strong>{liveSchools.data.kindergarten}</strong> kindergartens</span>
                      <span><strong>{liveSchools.data.primary}</strong> primary</span>
                      <span><strong>{liveSchools.data.secondary}</strong> secondary</span>
                      {liveSchools.data.universities ? <span><strong>{liveSchools.data.universities}</strong> universities</span> : null}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">{liveSchools.data.summary?.slice(0, 100) || "School data available"}</div>
                  )}
                </>
              ) : <Skeleton />}
            </Tile>

            {/* Tenders - NEW */}
            <Tile title="Public Tenders" status={liveTenders.status} source={liveTenders.source}>
              {liveTenders.data && Array.isArray(liveTenders.data) && liveTenders.data.length > 0 ? (
                <div className="space-y-1.5">
                  {liveTenders.data.slice(0, 3).map((t, i) => (
                    <div key={i} className="text-[11px]">
                      <div className="text-slate-700 truncate">{t.title || "Tender"}</div>
                      {t.estimatedValue && <div className="text-indigo-600 font-semibold">{fmtCZK(t.estimatedValue)}</div>}
                    </div>
                  ))}
                </div>
              ) : <Skeleton />}
            </Tile>

            {/* Energy - NEW */}
            <Tile title="Energy Prices" status={liveEnergy.status} source={liveEnergy.source}>
              {liveEnergy.data ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-500">Heat</span><strong>{liveEnergy.data.heatPriceGJ} CZK/GJ</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Electricity</span><strong>{liveEnergy.data.electricityPriceKWh} CZK/kWh</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Gas</span><strong>{liveEnergy.data.gasPrice} CZK/m³</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Renewables</span><strong className="text-green-600">{liveEnergy.data.renewableShare}%</strong></div>
                </div>
              ) : <Skeleton />}
            </Tile>

            {/* Water - NEW */}
            <Tile title="Water Quality" status={liveWater.status} source={liveWater.source}>
              {liveWater.data ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-500">Rating</span><strong className="text-green-600 capitalize">{liveWater.data.rating}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">pH</span><strong>{liveWater.data.ph}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Nitrates</span><strong>{liveWater.data.nitrates} mg/l</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Hardness</span><strong>{liveWater.data.hardness}</strong></div>
                </div>
              ) : <Skeleton />}
            </Tile>

            {/* Demographics - NEW (from static district data since API may not have persisted data) */}
            <Tile title="Demographics" status="live" source="https://www.czso.cz">
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Population</span><strong>{d.population.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Area</span><strong>{d.area} km²</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Density</span><strong>{Math.round(d.population / d.area).toLocaleString()}/km²</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Mayor</span><strong>{d.mayor}</strong></div>
              </div>
            </Tile>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-600">ForThePeople<span className="text-indigo-600">.cz</span></span>
            <span>Open civic data for all 22 Prague districts. Click any card for data source.</span>
            <a href="/sources" className="text-indigo-600 hover:underline font-medium">All sources</a>
          </div>
        </footer>
      </div>

      {/* Right Side District Panel - Desktop */}
      <aside className="hidden lg:flex flex-col w-48 border-l border-slate-200 bg-white sticky top-0 h-screen overflow-y-auto">
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Districts</div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {DISTRICTS.map((dist) => (
            <button
              key={dist.id}
              onClick={() => setDistrictId(dist.id)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                dist.id === districtId
                  ? "bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Praha {dist.id}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile District Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setShowPanel(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-0 top-0 bottom-0 w-56 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Districts</span>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>
            {DISTRICTS.map((dist) => (
              <button
                key={dist.id}
                onClick={() => { setDistrictId(dist.id); setShowPanel(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  dist.id === districtId
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Praha {dist.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tile Component ──────────────────────────────────────────────────────────

function Tile({ title, status, source, children }: {
  title: string;
  status: "live" | "loading" | "error" | string;
  source?: string | null;
  children: React.ReactNode;
}) {
  const [showSource, setShowSource] = useState(false);
  return (
    <div
      className="bg-white rounded-lg border border-slate-150 p-4 hover:border-indigo-200 hover:shadow-sm transition-all relative group"
      onClick={() => source && setShowSource(!showSource)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
        <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-green-500" : status === "loading" ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
      </div>
      {children}
      {showSource && source && (
        <div className="absolute bottom-1 right-2 text-[9px] text-indigo-500 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">
          {source.replace("https://", "").replace("http://", "").split("/")[0]}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-6 bg-slate-100 rounded w-1/3" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  );
}
