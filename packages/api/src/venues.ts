// Muassasalar — backend `/v1/venues/*`. Promo bannerlar uchun API yo'q — ular shu yerda qoladi.
// Muassasada rasm bo'lmasa (backendga hali yuklanmagan) — avvalgi namunaviy rasmlar ko'rsatiladi.
import { api, toNum } from "./client";

export type VenueType = "restoran" | "toyxona";

export type Venue = {
  id: string;
  type: VenueType;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  open: boolean;
  deposit: boolean;
  address: string;
};

export type GridVenue = {
  id: string;
  type: VenueType;
  name: string;
  image: string;
  rating: number;
  distanceKm: number;
  open: boolean;
  address: string;
};

export const promos = [
  { id: "p1", image: "/home/banner-1.webp", alt: "Milliy taomlar to‘plami" },
  { id: "p2", image: "/home/banner-2.webp", alt: "Fast food aksiyasi" },
  { id: "p3", image: "/home/banner-3.webp", alt: "Dasturxon" },
  { id: "p4", image: "/home/banner-4.webp", alt: "Palov" },
];

export type Amenity = { id: "parking" | "acoustic" | "stage" | "ac" | "kitchen" | "wifi"; label: string };
export const HALL_AMENITIES: Amenity[] = [
  { id: "parking", label: "Keng avtoturargoh" },
  { id: "acoustic", label: "Akustik tizim" },
  { id: "stage", label: "Katta sahna" },
  { id: "ac", label: "Konditsioner" },
  { id: "kitchen", label: "Professional oshxona" },
  { id: "wifi", label: "Yuqori tezlikdagi Wi-Fi" },
];

// Backend qulayliklari (slug) → sahifadagi ikonka turi
const AMENITY_SLUG: Record<string, Amenity["id"]> = {
  parking: "parking", sound_system: "acoustic", stage: "stage", air_conditioning: "ac", professional_kitchen: "kitchen", wifi: "wifi",
};

export function venueHref(v: { type: VenueType; id: string }) {
  return v.type === "toyxona" ? `/toyxonalar/${v.id}` : `/restoranlar/${v.id}`;
}

// ---------- Joy sahifasi (restoran / to'yxona) ----------
export type MenuItem = { id: string; name: string; price: number; image: string; category: string };
export type GuestTier = { id: number; min: number; max: number | null; price: number };
export type WorkingHours = { weekday: number; opens: string | null; closes: string | null; closed: boolean };

export type VenueDetails = {
  id: string;
  type: VenueType;
  name: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  open: boolean;
  deposit: boolean;
  discount?: number;
  city: string;
  address: string;
  hero: string;
  /** Telefon uchun (rasmga yopishgan Figma elementlari tozalangan) nusxa */
  heroMobile?: string;
  gallery: string[];
  phone: string;
  hours: string;
  capacity: string;
  about: string;
  menu: MenuItem[];
  /** To'yxona: zal narxi (so'm), sig'im oralig'i, tavsif, qulayliklar */
  price?: number;
  guests?: { min: number; max: number };
  description?: string;
  amenities?: Amenity[];
  /** Backend ma'lumotlari: tarmoq, mehmon oraliqlari (to'yxona narxi), ish vaqti, depozit foizi */
  groupId?: number;
  tiers?: GuestTier[];
  workingHours?: WorkingHours[];
  depositPercent?: number;
  minAdvanceDays?: number;
};

// ---------- Backend ----------
type BVenueListItem = {
  id: number; name: string; tagline: string | null; venue_type: VenueType; street: string; house_number: string;
  capacity_min: number | null; capacity_max: number | null; rating_avg: string; reviews_count: number;
  base_price: string | null; discount_percent: string | null; requires_deposit: boolean;
  distance_m: number | null; is_open_now: boolean; cover_url: string | null;
};
type BVenueDetail = {
  venue: {
    id: number; venue_group_id: number; name: string; description: string | null; tagline: string | null; district_id: number;
    venue_type: VenueType; street: string; house_number: string; latitude: string; longitude: string; phone: string;
    total_seats: number | null; capacity_min: number | null; capacity_max: number | null; base_price: string | null;
    min_advance_booking_days: number; requires_deposit: boolean; deposit_percent: string | null; discount_percent: string | null;
    rating_avg: string; reviews_count: number;
  };
  photos: { url: string; sort_order: number; is_cover: boolean }[];
  amenities: { slug: string; name: string }[];
  working_hours: { weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean }[];
  is_open_now: boolean;
  guest_tiers?: { id: number; min_guests: number; max_guests: number | null; base_price: string }[];
};
type BMenuItem = { id: number; category_name: string; name: string; photo_url: string | null; effective_price: string | null; price_from: string | null; is_available: boolean; status: string };

/** Foydalanuvchi joylashuvi tanlanmagan bo'lsa masofa shu nuqtadan (Toshkent markazi) hisoblanadi */
export const DEFAULT_COORDS = { lat: 41.3111, lng: 69.2797 };
export type Coords = { lat: number; lng: number };

// Rasm yo'q bo'lsa — avvalgi namunaviy rasmlar (dizayn buzilmasligi uchun)
const TOP_IMG = { restoran: [1, 2, 3, 2].map((i) => `/home/rest-${i}.webp`), toyxona: [1, 2, 3, 4].map((i) => `/home/hall-${i}.webp`) };
const GRID_IMG = { restoran: [1, 2, 3, 4].map((i) => `/home/grid-${i}.webp`), toyxona: [1, 2, 3, 4].map((i) => `/home/hall-grid-${i}.webp`) };
const MENU_IMG = ["/venue/menu-1.webp", "/venue/menu-2.webp", "/venue/menu-3.webp", "/venue/menu-4.webp", "/home/banner-4.webp", "/home/banner-1.webp", "/home/banner-3.webp", "/home/banner-2.webp"];
const GALLERY = [1, 2, 3, 4, 5, 6].map((i) => `/venue/rest-one-g${i}.webp`);
const HERO = "/venue/rest-one-hero.webp";
export const venueImage = (type: VenueType, id: number | string, grid = false) => {
  const pool = (grid ? GRID_IMG : TOP_IMG)[type];
  return pool[Math.abs(Number(id) || 0) % pool.length];
};

const km = (m: number | null | undefined) => (m === null || m === undefined ? 0 : Math.round(m / 100) / 10);
const addressOf = (v: { street: string; house_number: string }) => [v.street, v.house_number && `${v.house_number} - uy`].filter(Boolean).join(" ");
function distanceM(a: Coords, b: Coords) {
  const R = 6371e3, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const toVenue = (v: BVenueListItem, i = 0): Venue => ({
  id: String(v.id), type: v.venue_type, name: v.name,
  image: v.cover_url ?? venueImage(v.venue_type, i),
  rating: toNum(v.rating_avg), reviews: v.reviews_count, distanceKm: km(v.distance_m),
  open: v.is_open_now, deposit: v.requires_deposit, address: addressOf(v),
});
const toGrid = (v: BVenueListItem, i = 0): GridVenue => ({ ...toVenue(v, i), image: v.cover_url ?? venueImage(v.venue_type, i, true) });

export type VenueSearch = { type?: VenueType; query?: string; sort?: "rating" | "distance"; limit?: number; coords?: Coords; districtId?: number };
async function search(p: VenueSearch) {
  const c = p.coords ?? DEFAULT_COORDS;
  const res = await api<{ items: BVenueListItem[] }>("/v1/venues/search", {
    auth: false,
    query: { venue_type: p.type, query: p.query, sort: p.sort, limit: p.limit ?? 50, lat: c.lat, lng: c.lng, latitude: c.lat, longitude: c.lng, district_id: p.districtId },
  });
  return res.items;
}
/** "Top" qatori — reyting bo'yicha */
export const topVenues = async (p: VenueSearch) => (await search({ sort: "rating", limit: 10, ...p })).map(toVenue);
/** Pastdagi to'r — barcha joylar */
export const gridVenues = async (p: VenueSearch) => (await search({ limit: 100, ...p })).map(toGrid);

const WEEK = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"]; // backend: 0 = dushanba
const hm = (t: string | null) => (t ?? "").slice(0, 5);
function hoursText(wh: BVenueDetail["working_hours"]) {
  const open = wh.filter((d) => !d.is_closed && d.opens_at && d.closes_at);
  if (!open.length) return "";
  const same = open.every((d) => d.opens_at === open[0].opens_at && d.closes_at === open[0].closes_at);
  if (same) {
    const range = `${hm(open[0].opens_at)} – ${hm(open[0].closes_at)}`;
    if (open.length === 7) return `Har kuni ${range}`;
    const days = open.map((d) => d.weekday).sort();
    return `${WEEK[days[0]]} – ${WEEK[days[days.length - 1]]} ${range}`;
  }
  return open.map((d) => `${WEEK[d.weekday]} ${hm(d.opens_at)}–${hm(d.closes_at)}`).join(", ");
}
const fmtPhone = (p: string) => {
  const d = p.replace(/\D/g, "").slice(-9);
  return d.length === 9 ? `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : p;
};

export async function getMenu(venueId: string | number): Promise<MenuItem[]> {
  const items = await api<BMenuItem[]>(`/v1/venues/${venueId}/menu`, { auth: false }).catch(() => [] as BMenuItem[]);
  return items
    .filter((m) => m.status === "active" && m.is_available !== false)
    .map((m, i) => ({
      id: String(m.id), name: m.name, price: toNum(m.effective_price ?? m.price_from),
      image: m.photo_url ?? MENU_IMG[i % MENU_IMG.length], category: m.category_name,
    }));
}

export async function getVenue(type: VenueType, id: string, coords: Coords = DEFAULT_COORDS): Promise<VenueDetails | null> {
  if (!/^\d+$/.test(id)) return null;
  let d: BVenueDetail;
  try { d = await api<BVenueDetail>(`/v1/venues/${id}`, { auth: false }); } catch { return null; }
  const v = d.venue;
  if (v.venue_type !== type) return null;
  const lat = Number(v.latitude), lng = Number(v.longitude);
  const [menu, place] = await Promise.all([
    type === "restoran" ? getMenu(v.id) : Promise.resolve([] as MenuItem[]),
    api<{ district_name: string; region_name: string }>("/v1/districts/nearest", { auth: false, query: { lat, lng } }).catch(() => null),
  ]);
  const photos = [...d.photos].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order).map((p) => p.url);
  const gallery = photos.length ? photos : [HERO, ...GALLERY];
  const tiers = (d.guest_tiers ?? []).map((t) => ({ id: t.id, min: t.min_guests, max: t.max_guests, price: toNum(t.base_price) }));
  const amenities = d.amenities.map((a) => ({ id: AMENITY_SLUG[a.slug], label: a.name })).filter((a): a is Amenity => Boolean(a.id));
  const capMax = v.capacity_max ?? v.total_seats;
  return {
    id: String(v.id), type, name: v.name,
    rating: toNum(v.rating_avg), reviews: v.reviews_count,
    distanceKm: Number.isFinite(lat) && Number.isFinite(lng) ? km(distanceM(coords, { lat, lng })) : 0,
    open: d.is_open_now, deposit: v.requires_deposit,
    discount: toNum(v.discount_percent) || undefined,
    city: place?.region_name ?? "", address: addressOf(v),
    hero: gallery[0], heroMobile: photos.length ? undefined : "/venue/rest-one-hero-clean.webp", gallery,
    phone: fmtPhone(v.phone), hours: hoursText(d.working_hours),
    capacity: capMax ? `${capMax} kishigacha` : "",
    about: v.description ?? v.tagline ?? "",
    menu,
    price: type === "toyxona" ? toNum(v.base_price) || tiers[0]?.price || undefined : undefined,
    guests: type === "toyxona" && (v.capacity_min || v.capacity_max) ? { min: v.capacity_min ?? 0, max: v.capacity_max ?? v.capacity_min ?? 0 } : undefined,
    description: v.description ?? undefined,
    amenities: amenities.length ? amenities : undefined,
    groupId: v.venue_group_id, tiers,
    workingHours: d.working_hours.map((w) => ({ weekday: w.weekday, opens: hm(w.opens_at), closes: hm(w.closes_at), closed: w.is_closed })),
    depositPercent: toNum(v.deposit_percent) || undefined,
    minAdvanceDays: v.min_advance_booking_days,
  };
}

export const formatSum = (n: number) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")} so‘m`;

/** Figma: "25,000,000" — minglar vergul bilan */
export const formatNum = (n: number) => n.toLocaleString("en-US");
