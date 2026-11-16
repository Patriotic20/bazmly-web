"use client";

// Hamkor paneli ↔ backend (`/v1/venue/*`) uchun umumiy yordamchilar: turlar, faol filial, hududlar, rollar, rasm yuklash.
// Modullar (partner, staff, menu, orders, partnerBookings) shu yerdan foydalanadi.
import { api, toNum } from "./client";
import { REGIONS } from "./regions";

// ---------- Backend turlari ----------
export type VenueTypeSlug = "restoran" | "toyxona";
export type BVenue = {
  id: number; venue_group_id: number; name: string; description: string | null; district_id: number; venue_type: VenueTypeSlug;
  street: string; house_number: string; latitude: string; longitude: string; phone: string; total_seats: number | null;
  min_advance_booking_days: number; status: string; manager_user_id?: number | null; onboarding_step: number;
};
export type BWorkingHours = { weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean };
export type BVenueDetail = { venue: BVenue; photos: { id: number; url: string; sort_order: number; is_cover: boolean }[]; working_hours: BWorkingHours[] };
export type BGroup = { id: number; owner_id: number; primary_venue_type: VenueTypeSlug; name: string };
export type BTable = { id: number; number: number; seats: number; zone_id: number | null; is_active: boolean };
export type BZone = { id: number; slug: string; name: string };
export type BRole = { id: number; slug: string; scope: "group" | "venue"; name: string };

// ---------- Faol muassasa (akkaunt) ----------
// Akkaunt ma'lumoti partner.ts da "bazmly:partner" kalitida saqlanadi; bu yerda faqat id'lar kerak (aylanma importsiz).
export function ctx(): { groupId: number; venueId: number } | null {
  try {
    const a = JSON.parse(localStorage.getItem("bazmly:partner") ?? "null") as { groupId?: number; venueId?: number } | null;
    return a?.groupId && a.venueId ? { groupId: a.groupId, venueId: a.venueId } : null;
  } catch { return null; }
}
/** Backend'dagi ruxsat tekshiruvi uchun `group_id` va `venue_id` so'rov parametrlari */
export const scope = () => { const c = ctx(); return c ? { group_id: c.groupId, venue_id: c.venueId } : {}; };

// ---------- Kesh (localStorage) ----------
export function cacheRead<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
export function cacheWrite<T>(key: string, v: T): T {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  return v;
}

// ---------- Vaqt / sana ----------
/** "09:00:00" → "09:00" */
export const hm = (t?: string | null) => (t ? t.slice(0, 5) : "");
/** Backend vaqtlari UTC, lekin zona belgisisiz keladi ("2026-11-15T17:29:01") */
export const utc = (s?: string | null) => (s ? (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`) : "");

// ---------- Hududlar ----------
const norm = (s: string) => s.toLowerCase().replace(/[‘’ʻʼ'`]/g, "").replace(/\s+(viloyati|respublikasi)$/, "").trim();
type BRegion = { id: number; name: string };
type BDistrict = { id: number; region_id: number; name: string; latitude: string; longitude: string };
let regionsP: Promise<BRegion[]> | null = null;
const districtsP = new Map<number, Promise<BDistrict[]>>();
const regions = () => (regionsP ??= api<BRegion[]>("/v1/regions", { auth: false }).catch((e) => { regionsP = null; throw e; }));
const districts = (rid: number) => {
  let p = districtsP.get(rid);
  if (!p) { p = api<BDistrict[]>(`/v1/regions/${rid}/districts`, { auth: false }).catch((e) => { districtsP.delete(rid); throw e; }); districtsP.set(rid, p); }
  return p;
};

/** Frontend manzili (viloyat qisqa nomi + tuman/shahar) → backend tuman id va koordinatalari */
export async function resolveDistrict(regionShort?: string, city?: string): Promise<{ id: number; lat: number; lng: number } | null> {
  const fr = REGIONS.find((r) => r.short === regionShort || r.name === regionShort);
  const list = await regions();
  const br = list.find((r) => norm(r.name) === norm(fr?.name ?? regionShort ?? "")) ?? list.find((r) => norm(r.name).startsWith(norm(regionShort ?? "-")));
  if (!br) return null;
  const ds = await districts(br.id);
  const d = ds.find((x) => norm(x.name) === norm(city ?? "")) ?? ds.find((x) => norm(x.name).split(" ")[0] === norm(city ?? "").split(" ")[0]) ?? ds[0];
  return d ? { id: d.id, lat: toNum(d.latitude), lng: toNum(d.longitude) } : null;
}
/** Koordinata bo'yicha eng yaqin tuman */
export async function nearestDistrict(lat: number, lng: number) {
  const r = await api<{ district_id: number }>("/v1/districts/nearest", { auth: false, query: { lat, lng } });
  return r.district_id;
}
/** Backend tuman id → frontend manzili (viloyat qisqa nomi va tuman nomi).
 *  Koordinata berilsa — bitta `/districts/nearest` so'rovi; aks holda viloyatlar parallel tekshiriladi. */
export async function districtAddress(districtId: number, coords?: { lat: number; lng: number }): Promise<{ region?: string; city?: string }> {
  const shortOf = (regionName: string) => REGIONS.find((x) => norm(x.name) === norm(regionName))?.short ?? regionName;
  try {
    if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
      const n = await api<{ district_id: number; district_name: string; region_name: string }>("/v1/districts/nearest", { auth: false, query: coords });
      if (n.district_id === districtId) return { region: shortOf(n.region_name), city: n.district_name };
    }
    const list = await regions();
    const all = await Promise.all(list.map((r) => districts(r.id).then((ds) => ({ r, d: ds.find((x) => x.id === districtId) }))));
    const hit = all.find((x) => x.d);
    if (hit?.d) return { region: shortOf(hit.r.name), city: hit.d.name };
  } catch {}
  return {};
}

// ---------- Rollar ----------
let rolesP: Promise<BRole[]> | null = null;
export const staffRoles = () => (rolesP ??= api<BRole[]>("/v1/venue/staff/roles").catch((e) => { rolesP = null; throw e; }));

// ---------- Rasm yuklash ----------
/** data-URL yoki tashqi URL: data-URL bo'lsa backend'ga yuklanadi va doimiy URL qaytariladi */
export async function uploadImage(src?: string): Promise<string | null> {
  if (!src) return null;
  if (!src.startsWith("data:")) return src;
  const blob = await (await fetch(src)).blob();
  const fd = new FormData();
  fd.append("file", blob, `image.${blob.type.split("/")[1] ?? "jpg"}`);
  const r = await api<{ url: string }>("/v1/media/images", { method: "POST", body: fd });
  return r.url;
}

// ---------- Ish vaqti ----------
/** Frontend: ish kunlari oralig'i (0 = Dushanba) va soatlar → backend 7 kunlik jadval */
export function toWorkingDays(days?: { from: number; to: number }, hours?: { from: string; to: string }) {
  const d = days ?? { from: 0, to: 6 };
  const h = hours ?? { from: "09:00", to: "23:00" };
  return Array.from({ length: 7 }, (_, weekday) => (weekday >= d.from && weekday <= d.to
    ? { weekday, opens_at: h.from, closes_at: h.to, is_closed: false }
    : { weekday, opens_at: null, closes_at: null, is_closed: true }));
}
/** Backend jadvali → frontend ish kunlari oralig'i va soatlari */
export function fromWorkingDays(wh: BWorkingHours[]) {
  const open = wh.filter((x) => !x.is_closed && x.opens_at && x.closes_at).sort((a, b) => a.weekday - b.weekday);
  if (!open.length) return {};
  return {
    days: { from: open[0].weekday, to: open[open.length - 1].weekday },
    hours: { from: hm(open[0].opens_at), to: hm(open[0].closes_at) },
  };
}

export async function putWorkingHours(venueId: number, days?: { from: number; to: number }, hours?: { from: string; to: string }) {
  await api(`/v1/venue/venues/${venueId}/working-hours`, { method: "PUT", query: { venue_id: venueId }, body: { days: toWorkingDays(days, hours) } });
}
/** Stollar: { 2: 3, 4: 5 } → backend `counts` */
export async function putTables(venueId: number, tables: Partial<Record<number, number>>) {
  const counts = Object.fromEntries(Object.entries(tables).filter(([, n]) => (n ?? 0) > 0).map(([k, n]) => [k, n]));
  if (!Object.keys(counts).length) return [];
  return api<BTable[]>(`/v1/venue/venues/${venueId}/tables/bulk`, { method: "POST", query: { venue_id: venueId }, body: { counts } });
}
