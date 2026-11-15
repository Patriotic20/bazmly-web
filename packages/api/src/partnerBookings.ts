"use client";

import { accountKey } from "./partner";
// Hamkor paneli: mijozlar bronlari va statistikasi — backend ulanguncha brauzer xotirasida namunaviy ma'lumot.
// TODO: backend — GET /partner/bookings?date=…, PATCH /partner/bookings/:id { status }, GET /partner/stats

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

// Sana bo'yicha barqaror "tasodifiy" son — har safar bir xil namunaviy ma'lumot chiqishi uchun
function rand(seed: string) {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

const NAMES = [
  "Alisher Usmonov", "Bekzod Sharipov", "Dilnoza Karimova", "Jasur Toshmatov", "Madina Rahimova", "Sardor Aliyev",
  "Nodira Yusupova", "Otabek Nazarov", "Shahnoza Ergasheva", "Javohir Qodirov", "Malika Abdullayeva", "Ulug‘bek Saidov",
];
const PLACES = ["", " (Teras)", " (Zal)", " (VIP)"];
const TIMES = ["12:00", "13:30", "14:00", "17:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

function seed(today = new Date()): PartnerBooking[] {
  const out: PartnerBooking[] = [];
  for (let off = -3; off <= 7; off++) {
    const day = addDays(today, off);
    const r = rand(iso(day));
    const n = off === 0 ? 9 : off === 1 ? 6 : 3 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      // Bugun: 5 ta kutilmoqda, 3 ta keldi, 1 ta bekor qilingan; o'tgan kunlar — yakunlangan
      const status: BookingStatus = off < 0 ? (r() < 0.85 ? "keldi" : "bekor")
        : off === 0 ? (i < 5 ? "kutilmoqda" : i < 8 ? "keldi" : "bekor") : "kutilmoqda";
      out.push({
        id: `${iso(day)}-${i}`,
        name: NAMES[Math.floor(r() * NAMES.length)],
        phone: `+99890${String(1000000 + Math.floor(r() * 8999999)).slice(0, 7)}`,
        date: iso(day),
        time: TIMES[Math.floor(r() * TIMES.length)],
        people: 2 + Math.floor(r() * 7),
        table: `Stol ${pad(1 + Math.floor(r() * 20))}${PLACES[Math.floor(r() * PLACES.length)]}`,
        status,
      });
    }
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function readBookings(): PartnerBooking[] {
  try {
    const raw = localStorage.getItem(accountKey(KEY));
    if (raw) {
      const list = JSON.parse(raw) as PartnerBooking[];
      // Namunaviy ma'lumot bugungi kun atrofida bo'lishi kerak — kun almashgan bo'lsa yangilanadi
      if (list.some((b) => b.date === iso(new Date()))) return list;
    }
  } catch {}
  const list = seed();
  try { localStorage.setItem(accountKey(KEY), JSON.stringify(list)); } catch {}
  return list;
}

export function setBookingStatus(id: string, status: BookingStatus) {
  const list = readBookings().map((b) => (b.id === id ? { ...b, status } : b));
  try { localStorage.setItem(accountKey(KEY), JSON.stringify(list)); } catch {}
  return list;
}

/** Kunlik band qilishlar soni (statistika uchun namunaviy) */
export function dailyCount(d: Date) {
  const r = rand(`stat-${iso(d)}`);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  return Math.round(10 + r() * (weekend ? 190 : 110));
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
  const days = new Date(year, month + 1, 0).getDate();
  let s = 0;
  for (let i = 1; i <= days; i++) s += dailyCount(new Date(year, month, i));
  return s;
}

/** O'tgan davrga nisbatan o'zgarish foizi */
export const growth = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : 0);
