"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";

const markerColors = { available: "#16a34a", full: "#dc2626", unknown: "#eab308" };

function createBinIcon(status) {
  const color = markerColors[status] ?? markerColors.unknown;
  return L.divIcon({
    className: "bin-marker",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 5px rgba(15,23,42,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

function createPlaceIcon(color, label) {
  return L.divIcon({
    className: "place-marker",
    html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:9999px;background:${color};border:3px solid white;color:white;font:700 12px system-ui;box-shadow:0 1px 5px rgba(15,23,42,.35)">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const startIcon = createPlaceIcon("#2563eb", "A");
const destinationIcon = createPlaceIcon("#7c3aed", "B");

function RouteBounds({ route }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 1) map.fitBounds(route, { padding: [36, 36] });
  }, [map, route]);

  return null;
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Map({ route = [], start, destination, bins = [], onReportFull }) {
  return (
    <MapContainer center={[9.991, 76.297]} zoom={12} scrollWheelZoom={false} className="h-[440px] w-full" aria-label="Map of waste-bin locations around Kochi">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <RouteBounds route={route} />
      {route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#047857", weight: 5, opacity: 0.8 }} />}
      {start && <Marker position={[start.latitude, start.longitude]} icon={startIcon}><Popup><strong>Start:</strong> {start.name}</Popup></Marker>}
      {destination && <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}><Popup><strong>Destination:</strong> {destination.name}</Popup></Marker>}
      {bins.map((bin) => <Marker key={bin.id} position={[bin.latitude, bin.longitude]} icon={createBinIcon(bin.status)}>
        <Popup><div className="min-w-52 p-1 text-sm text-slate-700"><div className="flex items-start gap-2"><h3 className="font-bold text-slate-900">{bin.name}</h3>{bin.official && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Official</span>}</div><p className="mt-2"><span className="font-semibold">Accepts:</span> {bin.wasteTypes.join(", ")}</p><p className="mt-1"><span className="font-semibold">Status:</span> {formatStatus(bin.status)}</p><p className="mt-1"><span className="font-semibold">Distance from route:</span> {Math.round(bin.routeDistance * 1000)} m</p><button type="button" onClick={() => onReportFull?.(bin.id)} className="mt-3 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100">Report bin full</button></div></Popup>
      </Marker>)}
    </MapContainer>
  );
}
