"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap, Marker } from "leaflet";

export type LatLng = { lat: number; lng: number };
export const TASHKENT: LatLng = { lat: 41.3111, lng: 69.2797 };

const PIN = `<svg viewBox="0 0 24 32" width="24" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill="#FF6A00"/><circle cx="12" cy="11.5" r="4.2" fill="#fff"/></svg>`;

/** Xaritada joyni belgilash: bosilgan yoki pin surilgan joy tanlanadi (OpenStreetMap / CARTO yorug' uslub) */
export function MapPicker({ value, onChange, className = "", zoom = 13, controls = false }: { value: LatLng; onChange: (v: LatLng) => void; className?: string; zoom?: number; controls?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let alive = true;
    import("leaflet").then((L) => {
      if (!alive || !el.current || map.current) return;
      const m = L.map(el.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false }).setView([value.lat, value.lng], zoom);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, subdomains: "abcd",
        attribution: "&copy; OpenStreetMap, &copy; CARTO",
      }).addTo(m);
      if (controls) L.control.zoom({ position: "topright" }).addTo(m);
      // Mualliflik belgisi tepada — pastdagi "Xaritadan belgilash" tugmasiga to'qnashmasin
      L.control.attribution({ position: "topleft", prefix: false }).addTo(m);
      const icon = L.divIcon({ html: PIN, className: "", iconSize: [24, 32], iconAnchor: [12, 32] });
      const mk = L.marker([value.lat, value.lng], { icon, draggable: true, keyboard: false }).addTo(m);
      mk.on("dragend", () => { const p = mk.getLatLng(); cb.current({ lat: p.lat, lng: p.lng }); });
      m.on("click", (e) => { mk.setLatLng(e.latlng); cb.current({ lat: e.latlng.lat, lng: e.latlng.lng }); });
      map.current = m; marker.current = mk;
    });
    return () => { alive = false; map.current?.remove(); map.current = null; marker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tashqaridan o'zgarsa (masalan, katta xaritada tanlansa) — pin va markaz yangilanadi
  useEffect(() => {
    const mk = marker.current, m = map.current;
    if (!mk || !m) return;
    const p = mk.getLatLng();
    if (Math.abs(p.lat - value.lat) > 1e-7 || Math.abs(p.lng - value.lng) > 1e-7) { mk.setLatLng([value.lat, value.lng]); m.panTo([value.lat, value.lng]); }
  }, [value]);

  return <div ref={el} className={`z-0 bg-[#F2F2F2] ${className}`} role="application" aria-label="Xaritada joyni belgilash" />;
}
