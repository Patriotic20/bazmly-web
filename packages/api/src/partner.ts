"use client";

// Hamkor (restoran / to'yxona egasi) ma'lumotlari.
// Backend: akkaunt = filial (`/v1/venue/venues`), egasi = tarmoq (`/v1/venue/groups`). Kirish — `/v1/auth/login`.
// Sahifalar tez ochilishi uchun akkaunt ma'lumoti brauzer xotirasida ham saqlanadi (kesh) va kirishda yangilanadi.
// SMS kod hozircha backendda yo'q — ekrandagi kod bosqichi namunaviy.
import { loginWithPassword, logoutRemote, phoneCheck, register } from "./auth";
import { api, ApiError, isAuthed, toNum } from "./client";
import {
  districtAddress, fromWorkingDays, putTables, putWorkingHours, resolveDistrict, uploadImage,
  type BGroup, type BTable, type BVenue, type BVenueDetail, type VenueTypeSlug,
} from "./venueAdmin";

/** "barchasi" — eski akkauntlar uchun; yangi akkaunt faqat restoran yoki to'yxona bo'ladi */
export type VenueKind = "restoran" | "toyxona" | "barchasi";
export type PartnerAddress = { region?: string; city?: string; street?: string; house?: string };
export const TABLE_SIZES = [2, 4, 6, 8, 10] as const; // 10 = "10+ kishilik"
export type Tables = Partial<Record<(typeof TABLE_SIZES)[number], number>>;

/** Hafta kunlari: 0 = Dushanba … 6 = Yakshanba */
export const WEEK_DAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"] as const;
export type DayRange = { from: number; to: number };
export type Hours = { from: string; to: string }; // "09:00"
export type AdvanceDays = 1 | 2 | 3;

export type PartnerSchedule = { seats?: number; hours?: Hours; days?: DayRange; minAdvance?: AdvanceDays };
export type PartnerDraft = PartnerSchedule & { name?: string; kind?: VenueKind; address?: PartnerAddress; tables?: Tables; phone?: string;
  /** Kirgan hamkor yangi akkaunt qo'shmoqda (telefon so'ralmaydi) */
  adding?: boolean };
export type PartnerAccount = Required<Pick<PartnerDraft, "name" | "kind">> & PartnerSchedule & {
  phone: string; address: PartnerAddress; tables: Tables; createdAt: string;
  location?: { lat: number; lng: number };
  /** Muassasa rasmi (data-URL) — panel sarlavhasi va sozlamalarda */
  avatar?: string;
  /** Akkaunt id — bitta egada bir nechta akkaunt (masalan restoran va to'yxona) */
  id?: string;
  /** Backend: filial va tarmoq id */
  venueId?: number; groupId?: number;
};
/** Akkaunt o'zgarganda (sozlamalar) — sarlavha kabi joylar yangilanishi uchun */
export const ACCOUNT_EVENT = "bazmly:partner-account";

const DRAFT = "bazmly:partner:draft";
const ACCOUNT = "bazmly:partner";
const SESSION = "bazmly:partner:session";
const ACCOUNTS = "bazmly:partner:accounts";
/** Birinchi akkaunt — uning ma'lumotlari eski (qo'shimchasiz) kalitlarda saqlanadi */
export const PRIMARY = "a1";

export function readDraft(): PartnerDraft {
  try { return JSON.parse(sessionStorage.getItem(DRAFT) ?? "{}"); } catch { return {}; }
}
export function saveDraft(patch: PartnerDraft) {
  const next = { ...readDraft(), ...patch };
  try { sessionStorage.setItem(DRAFT, JSON.stringify(next)); } catch {}
  return next;
}
export function clearDraft() { try { sessionStorage.removeItem(DRAFT); } catch {} }

export function readAccount(): PartnerAccount | null {
  try { return JSON.parse(localStorage.getItem(ACCOUNT) ?? "null"); } catch { return null; }
}
/**
 * Akkaunt yaratish. `add` — kirgan hamkor yangi akkaunt qo'shmoqda (masalan restoranga to'yxona):
 * mavjud akkauntlar saqlanadi, yangisi faol bo'ladi.
 */
export function createAccount(phone: string, add = false): PartnerAccount | null {
  const d = readDraft();
  if (!d.name || !d.kind || !d.address?.region) return null;
  const acc: PartnerAccount = {
    id: add ? `a${Date.now()}` : PRIMARY,
    name: d.name, kind: d.kind, address: d.address, tables: d.tables ?? {}, phone,
    seats: d.seats, hours: d.hours, days: d.days, minAdvance: d.minAdvance, createdAt: new Date().toISOString(),
  };
  const list = add ? [...readAccounts(), acc] : [acc];
  try {
    localStorage.setItem(ACCOUNTS, JSON.stringify(list));
    localStorage.setItem(ACCOUNT, JSON.stringify(acc)); localStorage.setItem(SESSION, phone);
  } catch {}
  clearDraft();
  try { window.dispatchEvent(new Event(ACCOUNT_EVENT)); } catch {}
  return acc;
}

/** Egasining barcha akkauntlari (faol akkaunt ham ro'yxatda bo'ladi) */
export function readAccounts(): PartnerAccount[] {
  const active = readAccount();
  let list: PartnerAccount[] = [];
  try { list = JSON.parse(localStorage.getItem(ACCOUNTS) ?? "[]"); } catch {}
  if (!active) return list;
  const a = { ...active, id: active.id ?? PRIMARY };
  return list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [a, ...list];
}
/** Faol akkaunt id */
export const activeAccountId = () => readAccount()?.id ?? PRIMARY;
/** Har bir akkauntning ma'lumoti alohida: birinchi akkaunt — asl kalit, qolganlari — `kalit@id` */
export function accountKey(base: string) {
  try { const id = activeAccountId(); return id === PRIMARY ? base : `${base}@${id}`; } catch { return base; }
}
/** Boshqa akkauntga o'tish */
export function switchAccount(id: string) {
  const list = readAccounts();
  const target = list.find((x) => x.id === id);
  if (!target) return null;
  try { localStorage.setItem(ACCOUNTS, JSON.stringify(list)); localStorage.setItem(ACCOUNT, JSON.stringify(target)); } catch { return null; }
  try { window.dispatchEvent(new Event(ACCOUNT_EVENT)); } catch {}
  return target;
}
export function updateAccount(patch: Partial<PartnerAccount>) {
  const acc = readAccount();
  if (!acc) return null;
  const next = { ...acc, ...patch };
  try {
    localStorage.setItem(ACCOUNT, JSON.stringify(next));
    // Akkauntlar ro'yxatida ham yangilanadi
    const id = next.id ?? PRIMARY;
    localStorage.setItem(ACCOUNTS, JSON.stringify(readAccounts().map((x) => (x.id === id ? { ...next, id } : x))));
  } catch { return null; }
  try { window.dispatchEvent(new Event(ACCOUNT_EVENT)); } catch {}
  return next;
}
/** Akkaunt sozlamalarini backend'ga saqlaydi, so'ng keshni yangilaydi. Xatolikda null. */
export async function saveAccount(patch: Partial<PartnerAccount>): Promise<PartnerAccount | null> {
  const acc = readAccount();
  if (!acc?.venueId) return null;
  const id = acc.venueId;
  const q = { venue_id: id };
  try {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.minAdvance !== undefined) body.min_advance_booking_days = patch.minAdvance;
    if (patch.seats !== undefined) body.total_seats = patch.seats;
    if (patch.location) { body.latitude = Number(patch.location.lat.toFixed(6)); body.longitude = Number(patch.location.lng.toFixed(6)); }
    if (Object.keys(body).length) await api(`/v1/venue/venues/${id}`, { method: "PATCH", query: q, body });
    if (patch.hours || patch.days) await putWorkingHours(id, patch.days ?? acc.days, patch.hours ?? acc.hours);
    if (patch.tables) {
      // Backend stollarni faqat qo'shadi (o'chirish yo'li yo'q) — yetishmayotgan stollar qo'shiladi
      const cur = await api<BTable[]>(`/v1/venue/venues/${id}/tables`, { query: q });
      const have = tablesFrom(cur);
      const add = Object.fromEntries(TABLE_SIZES.map((n) => [n, Math.max(0, (patch.tables![n] ?? 0) - (have[n] ?? 0))]));
      await putTables(id, add);
    }
    if (patch.avatar !== undefined) {
      const url = await uploadImage(patch.avatar);
      const det = await api<BVenueDetail>(`/v1/venues/${id}`);
      const rest = det.photos.sort((a, b) => a.sort_order - b.sort_order).map((p) => p.url).filter((u) => u !== url);
      await api(`/v1/venue/venues/${id}/photos`, { method: "PUT", query: q, body: { urls: [url, ...rest].filter(Boolean).slice(0, 5) } });
      patch = { ...patch, avatar: url ?? undefined };
    }
  } catch { return null; }
  return updateAccount(patch);
}

// ---------- Backend ↔ akkaunt ----------
const SIZE = (seats: number) => (TABLE_SIZES as readonly number[]).reduce((best, n) => (seats >= n ? n : best), 2) as (typeof TABLE_SIZES)[number];
/** Backend stollari → { 2: 3, 4: 5, ... } (10 — "10+ kishilik") */
export function tablesFrom(list: BTable[]): Tables {
  const t: Tables = {};
  for (const x of list) if (x.is_active) { const k = SIZE(x.seats); t[k] = (t[k] ?? 0) + 1; }
  return t;
}

async function venueToAccount(v: BVenue, phone: string): Promise<PartnerAccount> {
  const [det, tables, addr] = await Promise.all([
    api<BVenueDetail>(`/v1/venues/${v.id}`).catch(() => null),
    api<BTable[]>(`/v1/venue/venues/${v.id}/tables`, { query: { venue_id: v.id } }).catch(() => [] as BTable[]),
    districtAddress(v.district_id, { lat: Number(v.latitude), lng: Number(v.longitude) }),
  ]);
  const wh = det ? fromWorkingDays(det.working_hours) : {};
  const cover = det?.photos.find((p) => p.is_cover) ?? det?.photos[0];
  return {
    id: `v${v.id}`, venueId: v.id, groupId: v.venue_group_id,
    name: v.name, kind: v.venue_type, phone,
    address: { region: addr.region, city: addr.city, street: v.street, house: v.house_number && v.house_number !== "-" ? v.house_number : undefined },
    tables: tablesFrom(tables), seats: v.total_seats ?? undefined,
    hours: wh.hours, days: wh.days,
    minAdvance: ([1, 2, 3].includes(v.min_advance_booking_days) ? v.min_advance_booking_days : 1) as AdvanceDays,
    location: { lat: toNum(v.latitude), lng: toNum(v.longitude) },
    avatar: cover?.url, createdAt: new Date().toISOString(),
  };
}

/** Har bir faoliyat turi uchun bitta akkaunt — shu turdagi eng birinchi filial (qolganlari "Filiallar" bo'limida) */
export const accountVenues = (venues: BVenue[]) => {
  const out: BVenue[] = [];
  for (const v of [...venues].sort((a, b) => a.id - b.id)) if (!out.some((x) => x.venue_type === v.venue_type)) out.push(v);
  return out;
};

/** Kirgan egasining akkauntlarini backend'dan oladi va keshga yozadi. `activeVenueId` — faol qilinadigan filial. */
export async function syncAccounts(phone: string, activeVenueId?: number): Promise<PartnerAccount[]> {
  let group: BGroup;
  try { group = await api<BGroup>("/v1/venue/groups/me"); } catch { return []; }
  const venues = await api<BVenue[]>("/v1/venue/venues", { query: { group_id: group.id } });
  const list = await Promise.all(accountVenues(venues).map((v) => venueToAccount(v, phone)));
  if (!list.length) return [];
  const prev = readAccount();
  const keepId = activeVenueId ?? prev?.venueId;
  const active = list.find((a) => a.venueId === keepId) ?? list.find((a) => a.kind === group.primary_venue_type) ?? list[0];
  // Avvalgi keshdagi, backendda yo'q maydonlar (masalan, rasm) saqlanadi
  const merged = list.map((a) => ({ ...(prev && prev.venueId === a.venueId ? { location: prev.location } : {}), ...a }));
  try {
    localStorage.setItem(ACCOUNTS, JSON.stringify(merged));
    localStorage.setItem(ACCOUNT, JSON.stringify(merged.find((a) => a.id === active.id)));
    localStorage.setItem(SESSION, phone);
  } catch {}
  try { window.dispatchEvent(new Event(ACCOUNT_EVENT)); } catch {}
  return merged;
}

/**
 * Ro'yxatdan o'tish (backend): telefon bo'yicha kirish yoki yangi foydalanuvchi, so'ng tarmoq + filial,
 * ish vaqti, stollar va boshlang'ich sozlash bosqichlari. `add` — kirgan egasi yangi akkaunt qo'shmoqda.
 */
export async function createAccountRemote(phone: string, add = false, password?: string): Promise<PartnerAccount | null> {
  const d = readDraft();
  if (!d.name || !d.kind || d.kind === "barchasi" || !d.address?.region) return null;
  try {
    if (!add || !isAuthed()) {
      // Login — telefon raqami, parol bilan; raqam avval ro'yxatdan o'tgan bo'lsa shu parol bilan kiriladi
      if (!password) return null;
      const chk = await phoneCheck(phone);
      if (chk.registered) await loginWithPassword(phone, password, chk); else await register(phone, d.name, null, password);
    }
    const dist = await resolveDistrict(d.address.region, d.address.city);
    if (!dist) return null;
    const branch = {
      district_id: dist.id, street: d.address.street || d.address.city || d.address.region, house_number: d.address.house || "-",
      latitude: dist.lat, longitude: dist.lng, phone, name: d.name, venue_type: d.kind as VenueTypeSlug,
      total_seats: d.seats ?? null, min_advance_booking_days: d.minAdvance ?? 1,
    };
    const group = await api<BGroup>("/v1/venue/groups/me").catch(() => null);
    let venueId: number;
    if (group) {
      const v = await api<BVenue>("/v1/venue/venues", { method: "POST", query: { group_id: group.id }, body: branch });
      venueId = v.id;
    } else {
      const r = await api<{ group: BGroup; branches: { id: number }[] }>("/v1/venue/groups", {
        method: "POST", body: { group: { primary_venue_type: d.kind, name: d.name }, branch },
      });
      venueId = r.branches[0].id;
    }
    const q = { venue_id: venueId };
    await api(`/v1/venue/venues/${venueId}/onboarding/address`, { method: "PATCH", query: q, body: { street: branch.street, house_number: branch.house_number } }).catch(() => {});
    await putWorkingHours(venueId, d.days, d.hours);
    if (d.tables) await putTables(venueId, d.tables);
    for (const step of ["tables-done", "services-done", "media-done"]) await api(`/v1/venue/venues/${venueId}/onboarding/${step}`, { method: "PATCH", query: q }).catch(() => {});
    await api(`/v1/venue/venues/${venueId}/onboarding/finish`, { method: "POST", query: q }).catch(() => {});
    const owner = add ? readAccount()?.phone ?? phone : phone;
    const list = await syncAccounts(owner, venueId);
    clearDraft();
    return list.find((a) => a.venueId === venueId) ?? null;
  } catch { return null; }
}

/** Ro'yxatdan o'tishning barcha bosqichlari to'ldirilganmi */
export const draftReady = (d: PartnerDraft) => !!(d.name && d.kind && d.address?.region && d.seats && d.hours && d.days && d.minAdvance);
export type SignInResult = "ok" | "no-account" | "bad-password" | "error";
/** Kirish (backend): telefon + parol. Parolsiz yaratilgan eski akkauntda kiritilgan parol o'rnatiladi. */
export async function signIn(phone: string, password: string): Promise<SignInResult> {
  try {
    const chk = await phoneCheck(phone);
    if (!chk.registered) return "no-account";
    await loginWithPassword(phone, password, chk);
    const list = await syncAccounts(phone);
    if (!list.length) { await logoutRemote(); return "no-account"; }
    return "ok";
  } catch (e) {
    return e instanceof ApiError && (e.status === 401 || e.status === 403) ? "bad-password" : "error";
  }
}
/** Panelga kirganda keshdagi akkauntlarni backend'dan yangilaydi (fon rejimida) */
export function refreshAccounts() {
  let phone: string | null = null;
  try { phone = localStorage.getItem(SESSION); } catch {}
  return phone ? syncAccounts(phone).catch(() => []) : Promise.resolve([]);
}
export function signOut() {
  void logoutRemote();
  try { localStorage.removeItem(SESSION); localStorage.removeItem(ACCOUNT); localStorage.removeItem(ACCOUNTS); } catch {}
}
export function isSignedIn() {
  try { return isAuthed() && !!localStorage.getItem(SESSION) && !!readAccount()?.venueId; } catch { return false; }
}

export const addressText = (a?: PartnerAddress) =>
  [a?.region, a?.city, a?.street, a?.house].filter(Boolean).join(", ");
export const totalSeats = (t: Tables = {}) => TABLE_SIZES.reduce((s, n) => s + n * (t[n] ?? 0), 0);
export const totalTables = (t: Tables = {}) => TABLE_SIZES.reduce((s, n) => s + (t[n] ?? 0), 0);

/** "Dush / Shan" — bitta kun bo'lsa faqat o'zi */
export const daysText = (r?: DayRange, sep = " / ") =>
  !r ? "" : r.from === r.to ? WEEK_DAYS[r.from] : `${WEEK_DAYS[r.from]}${sep}${WEEK_DAYS[r.to]}`;
/** "09:00" → "9:00" */
const hh = (t: string) => t.replace(/^0(\d)/, "$1");
export const hoursText = (h?: Hours) => (!h ? "" : `${hh(h.from)} - ${hh(h.to)}`);
