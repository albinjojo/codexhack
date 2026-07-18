"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import bins from "../data/bins.json";

const BinMap = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => <div className="h-[440px] animate-pulse bg-emerald-100" />,
});

const places = {
  "Lulu Mall": { latitude: 10.0274, longitude: 76.3089 },
  "Edappally Metro": { latitude: 10.0265, longitude: 76.3082 },
  "Vyttila Mobility Hub": { latitude: 9.9682, longitude: 76.3217 },
  "Marine Drive": { latitude: 9.9819, longitude: 76.2786 },
  "Fort Kochi": { latitude: 9.9661, longitude: 76.2427 },
  Kakkanad: { latitude: 10.0162, longitude: 76.3525 },
  Kaloor: { latitude: 9.9942, longitude: 76.2927 },
  "MG Road": { latitude: 9.9788, longitude: 76.2864 },
};

const locationNames = Object.keys(places);
const wasteTypes = [
  { name: "Plastic", key: "plastic", icon: "♻" },
  { name: "Food waste", key: "food", icon: "🍌" },
  { name: "Paper", key: "paper", icon: "▤" },
  { name: "General waste", key: "general", icon: "🗑" },
];

function distanceToRouteInKilometres(point, route) {
  if (route.length < 2) return Infinity;
  const latitudeScale = 110.574;
  const longitudeScale = 111.32 * Math.cos((point.latitude * Math.PI) / 180);
  let closestDistance = Infinity;

  for (let index = 0; index < route.length - 1; index += 1) {
    const [startLatitude, startLongitude] = route[index];
    const [endLatitude, endLongitude] = route[index + 1];
    const pointX = (point.longitude - startLongitude) * longitudeScale;
    const pointY = (point.latitude - startLatitude) * latitudeScale;
    const segmentX = (endLongitude - startLongitude) * longitudeScale;
    const segmentY = (endLatitude - startLatitude) * latitudeScale;
    const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;
    const progress = segmentLengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (pointX * segmentX + pointY * segmentY) / segmentLengthSquared));
    closestDistance = Math.min(closestDistance, Math.hypot(pointX - progress * segmentX, pointY - progress * segmentY));
  }

  return closestDistance;
}

export default function Home() {
  const [from, setFrom] = useState("Lulu Mall");
  const [to, setTo] = useState("Marine Drive");
  const [selectedWaste, setSelectedWaste] = useState("plastic");
  const [route, setRoute] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function findBinsOnRoute() {
    const start = places[from];
    const destination = places[to];
    setIsLoadingRoute(true);
    setRouteError("");
    setHasSearched(true);

    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error("Route request failed");
      const data = await response.json();
      const routeCoordinates = data.routes?.[0]?.geometry?.coordinates?.map(([longitude, latitude]) => [latitude, longitude]);
      if (!routeCoordinates?.length) throw new Error("No route found");

      const matchingBins = bins
        .filter((bin) => bin.wasteTypes.includes(selectedWaste))
        .map((bin) => ({ ...bin, routeDistance: distanceToRouteInKilometres(bin, routeCoordinates) }))
        .sort((first, second) => {
          if (first.status === "full" && second.status !== "full") return 1;
          if (first.status !== "full" && second.status === "full") return -1;
          return first.routeDistance - second.routeDistance;
        });

      setRoute(routeCoordinates);
      setResults(matchingBins);
      document.getElementById("route-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setRoute([]);
      setResults([]);
      setRouteError("We could not build this route right now. Please try again.");
    } finally {
      setIsLoadingRoute(false);
    }
  }

  const start = { name: from, ...places[from] };
  const destination = { name: to, ...places[to] };
  const bestBinId = results.find((bin) => bin.status === "available")?.id;

  return (
    <main className="min-h-screen bg-[#f7faf7] text-slate-800">
      <section className="relative overflow-hidden bg-emerald-700 px-5 pb-16 pt-5 sm:px-8 sm:pb-20 lg:px-16">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <header className="flex items-center gap-3 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl text-emerald-700 shadow-sm" aria-hidden="true">♻</span><div><p className="text-lg font-bold tracking-tight">BinBuddy Kochi</p><p className="text-sm text-emerald-100">Find the right bin on your way.</p></div></header>
          <div className="mt-10 max-w-3xl sm:mt-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Route bin finder</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Find a bin that fits your trip.</h1></div>

          <div className="mt-7 rounded-2xl bg-white p-5 shadow-xl shadow-emerald-950/20 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">From<select value={from} onChange={(event) => setFrom(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">{locationNames.map((name) => <option key={name}>{name}</option>)}</select></label>
              <label className="block text-sm font-semibold text-slate-700">To<select value={to} onChange={(event) => setTo(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">{locationNames.map((name) => <option key={name}>{name}</option>)}</select></label>
            </div>
            <fieldset className="mt-6"><legend className="text-sm font-semibold text-slate-700">What waste do you have?</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{wasteTypes.map((waste) => { const isSelected = selectedWaste === waste.key; return <button key={waste.key} type="button" onClick={() => setSelectedWaste(waste.key)} aria-pressed={isSelected} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${isSelected ? "border-emerald-600 bg-emerald-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"}`}><span className="mr-2" aria-hidden="true">{waste.icon}</span>{waste.name}</button>; })}</div></fieldset>
            <button type="button" onClick={findBinsOnRoute} disabled={isLoadingRoute} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-500">{isLoadingRoute ? "Finding your route..." : "Find the right bin"}</button>
            {routeError && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900" role="alert">{routeError}</p>}
          </div>
        </div>
      </section>

      <section id="route-map" className="scroll-mt-5 px-5 py-14 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Your route</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Bins on the way</h2><p className="mt-2 text-slate-600">Green pins are available, yellow pins are unknown, and red pins are full.</p></div>
          <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><BinMap route={route} start={hasSearched ? start : null} destination={hasSearched ? destination : null} bins={results} /></div>
          {hasSearched && <section className="mt-8" aria-labelledby="best-bins-heading"><h3 id="best-bins-heading" className="text-xl font-bold text-slate-900">Best bins on your route</h3><p className="mt-1 text-sm text-slate-600">Matching bins are sorted by status and distance from your route.</p>
            {results.length > 0 ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{results.map((bin) => <li key={bin.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><h4 className="font-bold text-slate-900">{bin.name}</h4>{bin.id === bestBinId && <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Best choice</span>}</div><p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-700">Accepts:</span> {bin.wasteTypes.join(", ")}</p><p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-slate-700">Status:</span> {bin.status}</p><p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-slate-700">From your route:</span> {Math.round(bin.routeDistance * 1000)} m</p></li>)}</ul> : !routeError && <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">No sample bins match this waste type.</p>}</section>}
        </div>
      </section>

      <footer className="bg-slate-900 px-5 py-8 text-sm text-slate-300 sm:px-8 lg:px-16"><div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:justify-between"><p className="font-semibold text-white">BinBuddy Kochi</p><p>Cleaner streets, one bin at a time.</p></div></footer>
    </main>
  );
}
