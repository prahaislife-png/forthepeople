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
  const liveCount = [liveContracts, liveHealth, liveTransit, liveWaste, liveParks, liveSports, liveLibraries, liveBusiness, liveCityHall, liveBudget, liveCrime, liveElections, liveHousing, liveEmployment, liveSchools, liveTenders, liveEnergy, liveWater].filter(s => s.status === "live").length;

  return (
    <div className="min-h-screen bg-[#fefcf9] flex">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 bg-[#fefcf9]/95 backdrop-blur-sm border-b border-[#e8e4dc]">
          <div className="px-4 sm:px-5 h-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm font-bold text-[#3d4f3d]">
                ForThePeople<span className="text-[#6b7f5a]">.cz</span>
              </a>
              <span className="text-[10px] text-[#8a7e6b] hidden sm:inline">Real-time open data for Prague</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              {latestUpdate && (
                <span className="hidden sm:inline text-[#8a7e6b]">
                  <span className="inline-block w-1.5 h-1.5 bg-[#6b7f5a] rounded-full mr-1" />
                  {liveCount} live sections · updated {timeAgo(latestUpdate)}
                </span>
              )}
              <a href="/sources" className="text-[#6b7f5a] hover:underline font-medium">Data Sources</a>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="lg:hidden font-semibold text-white bg-[#6b7f5a] px-2.5 py-1 rounded text-[11px]"
              >
                {d.name}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Strip */}
        <div className="bg-[#4a5e3f] px-4 sm:px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white">{d.name}</h1>
            <p className="text-[#b8c9a8] text-xs">
              {new Intl.NumberFormat("en").format(d.population)} residents · {d.area} km² · Mayor: {d.mayor} ({d.mayorParty})
            </p>
          </div>
          {/* Quick stats inline */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[11px] text-[#d4e0c8]">
            {liveWeather.data && <span>{liveWeather.data.temperature}°C, {liveWeather.data.description}</span>}
            {liveAir.data && <span>Air Quality: AQI {liveAir.data.aqi} · PM2.5 {liveAir.data.pm25} ug/m³</span>}
            {liveTransit.data && <span>{liveTransit.data.length} transit alerts active</span>}
          </div>
        </div>

        {/* Data Grid */}
        <main className="px-4 sm:px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">

            <Tile title="Public Contracts" desc="Government spending agreements filed in the public registry" status={liveContracts.status} source={liveContracts.source}>
              {liveContracts.data && liveContracts.data.length > 0 ? (
                <>
                  <N>{liveContracts.data.length}</N>
                  <L>contracts on record</L>
                  {liveContracts.data.slice(0, 2).map((c) => (
                    <Row key={c.id} left={c.subject} right={fmtCZK(c.value)} />
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Health & Medical" desc="Clinics, pharmacies, and hospitals within this district" status={liveHealth.status} source={liveHealth.source}>
              {liveHealth.data ? (
                <>
                  <N>{liveHealth.data.total}</N>
                  <L>healthcare facilities</L>
                  <div className="flex gap-2 flex-wrap text-[10px] text-[#5a5040]">
                    <span>{liveHealth.data.pharmacies} pharmacies</span>
                    <span>{liveHealth.data.gps} GPs</span>
                    <span>{liveHealth.data.specialists} specialists</span>
                  </div>
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Transit Alerts" desc="Current disruptions and delays on metro, tram, and bus lines" status={liveTransit.status} source={liveTransit.source}>
              {liveTransit.data && liveTransit.data.length > 0 ? (
                <div className="space-y-1">
                  {liveTransit.data.slice(0, 3).map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-[#5a5040] hover:text-[#3d4f3d] truncate">
                      {item.title}
                    </a>
                  ))}
                </div>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Waste & Recycling" desc="Sorted waste stations and container counts in the area" status={liveWaste.status} source={liveWaste.source}>
              {liveWaste.data ? (
                <>
                  <div className="flex gap-3">
                    <div><N>{liveWaste.data.stations}</N><L>stations</L></div>
                    <div><N>{liveWaste.data.containers}</N><L>containers</L></div>
                  </div>
                  <div className="text-[10px] text-[#8a7e6b] mt-1">{liveWaste.data.monitoredContainers} with smart fill sensors</div>
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Parks & Gardens" desc="Public green spaces maintained by the district" status={liveParks.status} source={liveParks.source}>
              {liveParks.data ? (
                <>
                  <N>{liveParks.data.total}</N>
                  <L>registered green areas</L>
                  {liveParks.data.parks.slice(0, 3).map((p) => (
                    <div key={p.name} className="text-[10px] text-[#5a5040] truncate">{p.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Sports Facilities" desc="Playgrounds, courts, and recreation areas available to residents" status={liveSports.status} source={liveSports.source}>
              {liveSports.data ? (
                <>
                  <N>{liveSports.data.playgrounds}</N>
                  <L>playgrounds & sports areas</L>
                  {liveSports.data.facilities.slice(0, 2).map((f) => (
                    <div key={f.name} className="text-[10px] text-[#5a5040] truncate">{f.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Libraries" desc="Municipal and public library branches in this district" status={liveLibraries.status} source={liveLibraries.source}>
              {liveLibraries.data ? (
                <>
                  <N>{liveLibraries.data.total}</N>
                  <L>public libraries</L>
                  {liveLibraries.data.libraries.slice(0, 3).map((lib) => (
                    <div key={lib.name} className="text-[10px] text-[#5a5040] truncate">{lib.name}</div>
                  ))}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Business Registry" desc="Official commercial registration info from ARES database" status={liveBusiness.status} source={liveBusiness.source}>
              {liveBusiness.data ? (
                <>
                  <div className="text-[11px] font-semibold text-[#3d4f3d] mb-0.5">{liveBusiness.data.name}</div>
                  <div className="text-[10px] text-[#8a7e6b]">ICO: {liveBusiness.data.ico}</div>
                  <div className="text-[10px] text-[#5a5040] truncate mt-0.5">{liveBusiness.data.address}</div>
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="City Hall Contact" desc="Address, phone, and website for your local municipal office" status={liveCityHall.status} source={liveCityHall.source}>
              {liveCityHall.data ? (
                <div className="space-y-0.5 text-[10px]">
                  {liveCityHall.data.address && <div className="text-[#5a5040]">{liveCityHall.data.address}</div>}
                  {liveCityHall.data.phone && <div className="text-[#5a5040]">Tel: {liveCityHall.data.phone}</div>}
                  {liveCityHall.data.email && <div className="text-[#5a5040]">{liveCityHall.data.email}</div>}
                  {liveCityHall.data.web && <a href={`https://${liveCityHall.data.web}`} target="_blank" rel="noopener noreferrer" className="text-[#6b7f5a] font-medium">{liveCityHall.data.web}</a>}
                </div>
              ) : <Skeleton />}
            </Tile>

            <Tile title="District Budget" desc="Annual revenue and spending from the State Treasury Monitor" status={liveBudget.status} source={liveBudget.source}>
              {liveBudget.data ? (
                <>
                  {liveBudget.data.totalRevenue ? (
                    <div className="space-y-0.5">
                      <Row left="Revenue (income)" right={fmtCZK(liveBudget.data.totalRevenue * 1_000_000)} highlight />
                      <Row left="Expenditure (spending)" right={fmtCZK((liveBudget.data.totalExpenditure || 0) * 1_000_000)} />
                      {liveBudget.data.surplus != null && <Row left="Surplus (savings)" right={fmtCZK(liveBudget.data.surplus * 1_000_000)} highlight={liveBudget.data.surplus >= 0} />}
                    </div>
                  ) : <div className="text-[10px] text-[#8a7e6b]">{liveBudget.data.summary || "Budget data synced"}</div>}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Crime Statistics" desc="Reported criminal incidents from Czech Police crime map" status={liveCrime.status} source={liveCrime.source}>
              {liveCrime.data ? (
                <>
                  {liveCrime.data.total ? (
                    <>
                      <N>{liveCrime.data.total.toLocaleString()}</N>
                      <L>reported incidents (annual)</L>
                      {liveCrime.data.change != null && (
                        <div className={`text-[10px] font-semibold ${liveCrime.data.change < 0 ? "text-[#6b7f5a]" : "text-red-600"}`}>
                          {liveCrime.data.change > 0 ? "+" : ""}{liveCrime.data.change}% vs previous year
                        </div>
                      )}
                    </>
                  ) : <div className="text-[10px] text-[#8a7e6b]">{liveCrime.data.summary?.slice(0, 120) || "Crime statistics synced"}</div>}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Local Elections" desc="Results from the most recent municipal council election" status={liveElections.status} source={liveElections.source}>
              {liveElections.data ? (
                <>
                  {liveElections.data.turnout ? (
                    <>
                      <div className="flex gap-3 mb-1">
                        <div><N>{liveElections.data.turnout}%</N><L>voter turnout</L></div>
                        <div><N>{liveElections.data.seats}</N><L>council seats</L></div>
                      </div>
                      {liveElections.data.parties?.slice(0, 2).map((p) => (
                        <Row key={p.name} left={p.name} right={`${p.pct}%`} />
                      ))}
                    </>
                  ) : <div className="text-[10px] text-[#8a7e6b]">{liveElections.data.summary?.slice(0, 120) || "Election results synced"}</div>}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Housing Market" desc="Average rent and property sale prices in this area" status={liveHousing.status} source={liveHousing.source}>
              {liveHousing.data ? (
                <>
                  {liveHousing.data.avgRentM2 ? (
                    <div className="space-y-0.5">
                      <Row left="Rent (per m² monthly)" right={`${liveHousing.data.avgRentM2} CZK`} />
                      <Row left="Sale price (per m²)" right={`${liveHousing.data.avgSaleM2?.toLocaleString()} CZK`} />
                      {liveHousing.data.vacancyRate != null && <Row left="Vacancy rate" right={`${liveHousing.data.vacancyRate}%`} />}
                    </div>
                  ) : <div className="text-[10px] text-[#8a7e6b]">{liveHousing.data.summary?.slice(0, 120) || "Housing market data synced"}</div>}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Employment" desc="Unemployment rate and job market data from Labor Office" status={liveEmployment.status} source={liveEmployment.source}>
              {liveEmployment.data ? (
                <>
                  {liveEmployment.data.unemploymentRate != null ? (
                    <>
                      <N>{liveEmployment.data.unemploymentRate}%</N>
                      <L>unemployment rate</L>
                      {liveEmployment.data.avgSalary && <div className="text-[10px] text-[#5a5040]">Avg salary: {liveEmployment.data.avgSalary.toLocaleString()} CZK/month</div>}
                      {liveEmployment.data.jobseekers && <div className="text-[10px] text-[#8a7e6b]">{liveEmployment.data.jobseekers} registered jobseekers</div>}
                    </>
                  ) : <div className="text-[10px] text-[#8a7e6b]">{liveEmployment.data.summary?.slice(0, 120) || "Employment data synced"}</div>}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Education" desc="Schools registered in MSMT national school registry" status={liveSchools.status} source={liveSchools.source}>
              {liveSchools.data ? (
                <>
                  {liveSchools.data.primary != null ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#5a5040]">
                      <span><strong>{liveSchools.data.kindergarten}</strong> kindergartens</span>
                      <span><strong>{liveSchools.data.primary}</strong> primary schools</span>
                      <span><strong>{liveSchools.data.secondary}</strong> secondary schools</span>
                      {liveSchools.data.universities ? <span><strong>{liveSchools.data.universities}</strong> universities</span> : null}
                    </div>
                  ) : <div className="text-[10px] text-[#8a7e6b]">{liveSchools.data.summary?.slice(0, 120) || "Education data synced"}</div>}
                </>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Public Tenders" desc="Open government procurement opportunities from the official gazette" status={liveTenders.status} source={liveTenders.source}>
              {liveTenders.data && Array.isArray(liveTenders.data) && liveTenders.data.length > 0 ? (
                <div className="space-y-1">
                  {liveTenders.data.slice(0, 2).map((t, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-[#5a5040] truncate">{t.title || "Tender"}</div>
                      {t.estimatedValue && <div className="text-[10px] text-[#6b7f5a] font-semibold">{fmtCZK(t.estimatedValue)}</div>}
                    </div>
                  ))}
                </div>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Energy Prices" desc="Current heating, electricity, and gas rates for this zone" status={liveEnergy.status} source={liveEnergy.source}>
              {liveEnergy.data ? (
                <div className="space-y-0.5">
                  <Row left="District heating" right={`${liveEnergy.data.heatPriceGJ} CZK/GJ`} />
                  <Row left="Electricity" right={`${liveEnergy.data.electricityPriceKWh} CZK/kWh`} />
                  <Row left="Natural gas" right={`${liveEnergy.data.gasPrice} CZK/m³`} />
                  <Row left="Renewable share" right={`${liveEnergy.data.renewableShare}%`} highlight />
                </div>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Water Quality" desc="Tap water safety testing from Prague Water utility (PVK)" status={liveWater.status} source={liveWater.source}>
              {liveWater.data ? (
                <div className="space-y-0.5">
                  <Row left="Safety rating" right={liveWater.data.rating} highlight />
                  <Row left="pH level" right={String(liveWater.data.ph)} />
                  <Row left="Nitrates" right={`${liveWater.data.nitrates} mg/l`} />
                  <Row left="Hardness" right={liveWater.data.hardness} />
                </div>
              ) : <Skeleton />}
            </Tile>

            <Tile title="Demographics" desc="Population, area, and density from Czech Statistical Office" status="live" source="https://www.czso.cz">
              <div className="space-y-0.5">
                <Row left="Population" right={d.population.toLocaleString()} />
                <Row left="Area" right={`${d.area} km²`} />
                <Row left="Population density" right={`${Math.round(d.population / d.area).toLocaleString()}/km²`} />
                <Row left="Mayor" right={d.mayor} />
              </div>
            </Tile>

          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#e8e4dc] bg-[#fefcf9] px-4 sm:px-5 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#8a7e6b]">
            <span className="font-bold text-[#3d4f3d]">ForThePeople<span className="text-[#6b7f5a]">.cz</span></span>
            <span>19 live data categories · 22 Prague districts · Click any card to see data source</span>
            <a href="/sources" className="text-[#6b7f5a] hover:underline font-medium">All Sources</a>
          </div>
        </footer>
      </div>

      {/* Right District Panel - Desktop */}
      <aside className="hidden lg:flex flex-col w-44 border-l border-[#e8e4dc] bg-[#faf8f4] sticky top-0 h-screen overflow-y-auto">
        <div className="px-3 py-2.5 border-b border-[#e8e4dc]">
          <div className="text-[9px] font-bold text-[#8a7e6b] uppercase tracking-wider">Select District</div>
        </div>
        <div className="flex-1 overflow-y-auto py-0.5">
          {DISTRICTS.map((dist) => (
            <button
              key={dist.id}
              onClick={() => setDistrictId(dist.id)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                dist.id === districtId
                  ? "bg-[#6b7f5a]/10 text-[#3d4f3d] font-bold border-r-2 border-[#6b7f5a]"
                  : "text-[#5a5040] hover:bg-[#f0ebe3] hover:text-[#3d4f3d]"
              }`}
            >
              Praha {dist.id}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setShowPanel(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute right-0 top-0 bottom-0 w-52 bg-[#faf8f4] shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-2.5 border-b border-[#e8e4dc] flex items-center justify-between">
              <span className="text-[9px] font-bold text-[#8a7e6b] uppercase tracking-wider">Select District</span>
              <button onClick={() => setShowPanel(false)} className="text-[#8a7e6b] hover:text-[#3d4f3d] text-base">×</button>
            </div>
            {DISTRICTS.map((dist) => (
              <button
                key={dist.id}
                onClick={() => { setDistrictId(dist.id); setShowPanel(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  dist.id === districtId
                    ? "bg-[#6b7f5a]/10 text-[#3d4f3d] font-bold"
                    : "text-[#5a5040] hover:bg-[#f0ebe3]"
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

// ─── Small Components ────────────────────────────────────────────────────────

function Tile({ title, desc, status, source, children }: {
  title: string;
  desc: string;
  status: "live" | "loading" | "error" | string;
  source?: string | null;
  children: React.ReactNode;
}) {
  const [showSource, setShowSource] = useState(false);
  return (
    <div
      className="bg-white rounded-md border border-[#e8e4dc] p-3 hover:border-[#6b7f5a]/40 hover:shadow-sm transition-all cursor-pointer relative"
      onClick={() => source && setShowSource(!showSource)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="text-[11px] font-bold text-[#3d4f3d] leading-tight">{title}</h3>
          <p className="text-[9px] text-[#8a7e6b] leading-snug mt-0.5">{desc}</p>
        </div>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ml-2 ${status === "live" ? "bg-[#6b7f5a]" : status === "loading" ? "bg-amber-400 animate-pulse" : "bg-[#d4cfc5]"}`} />
      </div>
      {children}
      {showSource && source && (
        <div className="mt-1.5 text-[8px] text-[#6b7f5a] font-mono bg-[#f0ebe3] px-1.5 py-0.5 rounded inline-block">
          Source: {source.replace("https://", "").replace("http://", "").split("/")[0]}
        </div>
      )}
    </div>
  );
}

function N({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-black text-[#3d4f3d] leading-none">{children}</div>;
}

function L({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] text-[#8a7e6b] mb-1">{children}</div>;
}

function Row({ left, right, highlight }: { left: string; right: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-[10px] py-px">
      <span className="text-[#8a7e6b]">{left}</span>
      <strong className={highlight ? "text-[#6b7f5a]" : "text-[#3d4f3d]"}>{right}</strong>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-1.5">
      <div className="h-5 bg-[#f0ebe3] rounded w-1/4" />
      <div className="h-2.5 bg-[#f0ebe3] rounded w-2/3" />
      <div className="h-2.5 bg-[#f0ebe3] rounded w-1/2" />
    </div>
  );
}
