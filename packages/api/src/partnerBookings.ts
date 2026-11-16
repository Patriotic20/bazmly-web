"use client";

import { accountKey } from "./partner";
import { api } from "./client";
import { cacheRead, cacheWrite, ctx, hm } from "./venueAdmin";
// Hamkor paneli: mijozlar bronlari va statistikasi — backend `/v1/venue/bookings`, `/v1/venue/analytics/*`.
// O'qish keshdan (sinxron), `syncBookings()` / `syncStats()` backend'dan yangilaydi.
// "Keldi": backend'da kelishni qayd etish faqat mijoz QR kodi orqali (check-in) — shu sababli bron tasdiqlanadi,
// stolga buyurtma ochiladi va "keldi" holati keshda belgilanadi.

export type BookingStatus = "kutilmoqda" | "keldi" | "bekor";
export type PartnerBooking = {
  id: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  people: number;
  table: string; // "Stol 12 (Teras)"
  status: BookingStatus;
  /** Backend: stol id (buyurtma ochish uchun) */
  tableId?: number | null;
};

const KEY = "bazmly:partner:bookings";
const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const MONTHS_UZ = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
/** Grafik ostidagi qisqa oy nomlari: "14– mart" */
export const MONTHS_SHORT = ["yan", "fev", "mart", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
export const WEEKDAYS_UZ = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"]; // getDay() tartibida
export const WEEKDAYS_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
/** "12 Oktyabr, Seshanba" */
export const longDate = (d: Date) => `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}, ${WEEKDAYS_UZ[d.getDay()]}`;

const ARRIVED = "bazmly:partner:arrived";
const STATS = "bazmly:partner:stats";

type BBooking = {
  id: number; kind: "table_reservation" | "hall_event"; status: string; booking_date: string; start_time: string;
  guests_count: number; contact_name: string; contact_phone: string; table_id: number | null; table_number: number | null;
};
const STATUS: Record<string, BookingStatus> = {
  pending: "kutilmoqda", confirmed: "kutilmoqda", checked_in: "keldi", completed: "keldi", cancelled: "bekor", no_show: "bekor", expired: "bekor",
};
const write = (list: PartnerBooking[]) => cacheWrite(accountKey(KEY), list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));

export function readBookings(): PartnerBooking[] {
  return cacheRead<PartnerBooking[]>(accountKey(KEY), []);
}

/** Berilgan kunlar bronlarini backend'dan oladi (stol bronlari) va keshga yozadi */
export async function syncBookings(days: string[]): Promise<PartnerBooking[]> {
  const c = ctx();
  if (!c || !days.length) return readBookings();
  const arrived = new Set(cacheRead<string[]>(accountKey(ARRIVED), []));
  const lists = await Promise.all(days.map((day) => api<BBooking[]>("/v1/venue/bookings", { query: { venue_id: c.venueId, day } }).catch(() => null)));
  const fetched = new Set(days.filter((_, i) => lists[i]));
  const fresh: PartnerBooking[] = lists.flatMap((l) => l ?? []).filter((b) => b.kind === "table_reservation").map((b) => {
    let status = STATUS[b.status] ?? "kutilmoqda";
    if (status === "kutilmoqda" && arrived.has(String(b.id))) status = "keldi";
    return {
      id: String(b.id), name: b.contact_name, phone: b.contact_phone, date: b.booking_date, time: hm(b.start_time),
      people: b.guests_count, table: b.table_number ? `Stol ${String(b.table_number).padStart(2, "0")}` : "Stol —", status, tableId: b.table_id,
    };
  });
  // Namunaviy (eski) yozuvlar va yangilangan kunlar almashtiriladi
  return write([...readBookings().filter((b) => /^\d+$/.test(b.id) && !fetched.has(b.date)), ...fresh]);
}
/** Bugundan boshlab `n` kun (va kecha) */
export const nextDays = (n = 14, from = new Date()) => Array.from({ length: n + 1 }, (_, i) => iso(addDays(from, i - 1)));

/** Holatni o'zgartirish: "keldi" — tasdiqlash (+ keshda belgi), "bekor" — rad etish */
export async function setBookingStatus(id: string, status: BookingStatus): Promise<PartnerBooking[]> {
  const c = ctx();
  if (c) {
    if (status === "bekor") await api(`/v1/venue/bookings/${id}/reject`, { method: "POST", query: { venue_id: c.venueId }, body: {} });
    if (status === "keldi") {
      await api(`/v1/venue/bookings/${id}/confirm`, { method: "POST", query: { venue_id: c.venueId } }).catch(() => {});
      cacheWrite(accountKey(ARRIVED), [...cacheRead<string[]>(accountKey(ARRIVED), []), id]);
    }
  }
  return write(readBookings().map((b) => (b.id === id ? { ...b, status } : b)));
}

// ---------- Statistika ----------
type Stats = { daily: Record<string, number>; months: Record<string, number> };
const stats = () => cacheRead<Stats>(accountKey(STATS), { daily: {}, months: {} });
const monthKey = (year: number, month: number) => { const d = new Date(year, month, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };

/** Kunlik band qilishlar soni (backend kunlik hisobotidan; ma'lumot bo'lmasa — 0) */
export function dailyCount(d: Date) {
  return stats().daily[iso(d)] ?? 0;
}

/** Grafik (joriy va keyingi hafta) va oylik jami uchun statistikani backend'dan oladi */
export async function syncStats(today = new Date()) {
  const c = ctx();
  if (!c) return stats();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const first = new Date(today.getFullYear(), today.getMonth(), 1), prevFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0), prevLast = new Date(today.getFullYear(), today.getMonth(), 0);
  type Daily = { business_date: string; bookings_count: number };
  type Totals = { current: { bookings_count: number }; previous: { bookings_count: number } };
  const [daily, rev] = await Promise.all([
    api<Daily[]>("/v1/venue/analytics/daily", { query: { venue_id: c.venueId, date_from: iso(monday), date_to: iso(addDays(monday, 13)) } }),
    api<Totals>("/v1/venue/analytics/revenue", { query: { venue_id: c.venueId, current_from: iso(first), current_to: iso(last), previous_from: iso(prevFirst), previous_to: iso(prevLast) } }),
  ]);
  const s = stats();
  for (const d of daily) s.daily[d.business_date] = d.bookings_count;
  s.months[monthKey(today.getFullYear(), today.getMonth())] = rev.current.bookings_count;
  s.months[monthKey(today.getFullYear(), today.getMonth() - 1)] = rev.previous.bookings_count;
  return cacheWrite(accountKey(STATS), s);
}

/** Joriy haftaning dushanbasidan boshlab 14 kun */
export function twoWeeks(today = new Date()) {
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  return Array.from({ length: 14 }, (_, i) => {
    const d = addDays(monday, i);
    return { iso: iso(d), date: d, weekday: WEEKDAYS_SHORT[d.getDay()], label: `${d.getDate()}– ${MONTHS_SHORT[d.getMonth()]}`, count: dailyCount(d) };
  });
}

export function monthCount(year: number, month: number) {
  return stats().months[monthKey(year, month)] ?? 0;
}

/** O'tgan davrga nisbatan o'zgarish foizi */
export const growth = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : 0);
