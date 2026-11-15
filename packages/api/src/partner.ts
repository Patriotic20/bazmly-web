"use client";

// Hamkor (restoran / to'yxona egasi) ma'lumotlari — backend ulanguncha brauzer xotirasida.
// TODO: backend — POST /partners (ro'yxatdan o'tish), POST /auth/partner/otp (kirish)

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
/** Ro'yxatdan o'tishning barcha bosqichlari to'ldirilganmi */
export const draftReady = (d: PartnerDraft) => !!(d.name && d.kind && d.address?.region && d.seats && d.hours && d.days && d.minAdvance);
/** Kirish: shu telefon bilan akkaunt bo'lsa sessiya ochiladi */
export function signIn(phone: string) {
  const acc = readAccount();
  if (!acc || acc.phone !== phone) {
    const other = readAccounts().find((x) => x.phone === phone);
    if (!other?.id || !switchAccount(other.id)) return false;
  }
  try { localStorage.setItem(SESSION, phone); } catch {}
  return true;
}
export function signOut() { try { localStorage.removeItem(SESSION); } catch {} }
export function isSignedIn() {
  try { const s = localStorage.getItem(SESSION); return !!s && readAccount()?.phone === s; } catch { return false; }
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
