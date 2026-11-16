// Bron qoralamasi — oynada (Partiya soni, kun va vaqt) va bron sahifasida to'ldiriladi
export type BookingDraft = {
  people?: number;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  table?: number;
  /** Backend stol id (bron yaratishda kerak) */
  tableId?: number;
  name?: string;
  phone?: string;
};

export const draftKey = (venueId: string) => `bazmly:booking:${venueId}`;

export function readDraft(venueId: string): BookingDraft {
  try { return JSON.parse(sessionStorage.getItem(draftKey(venueId)) ?? "{}"); } catch { return {}; }
}

export function saveDraft(venueId: string, patch: BookingDraft) {
  const next = { ...readDraft(venueId), ...patch };
  try { sessionStorage.setItem(draftKey(venueId), JSON.stringify(next)); } catch {}
  return next;
}

export const WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"]; // getDay() tartibida

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function nextDays(count: number, from = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return { iso: isoDate(d), day: d.getDate(), weekday: WEEKDAYS[d.getDay()] };
  });
}

// Ish vaqti: 11:00 – 23:30, har 30 daqiqada
export const TIMES = Array.from({ length: 26 }, (_, i) => `${pad(11 + Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);

export function defaultTime(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes() + 30;
  return TIMES.find((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) >= mins) ?? TIMES[0];
}

// To'yxona bandligi — backend ulanguncha barqaror namunaviy ma'lumot (joy + sana [+ vaqt] bo'yicha)
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
export const isDayFree = (venueId: string, iso: string, index: number) => index === 0 || hash(`${venueId}|${iso}`) % 2 === 0;
/** Restoran stoli bo'shligi (namunaviy, backend ulanguncha) */
export const isTableFree = (venueId: string, n: number) => hash(`${venueId}|stol|${n}`) % 2 === 0;
export const isTimeFree = (venueId: string, iso: string, time: string, index: number) => index === 0 || hash(`${venueId}|${iso}|${time}`) % 3 !== 0;

export const HALL_STEPS = ["To‘yxonani belgilang", "Kun va vaqtni belgilang", "Mehmonlar soni", "Chek va to‘lov"];

// ---------- To'yxona: mehmonlar soni, dasturxon, narx hisobi ----------
export type GuestTier = { id: string; label: string; guests: number; price: number };
export const GUEST_TIERS: GuestTier[] = [
  { id: "100-150", label: "100 - 150 kishi", guests: 150, price: 10_000_000 },
  { id: "150-200", label: "150 - 200 kishi", guests: 200, price: 15_000_000 },
  { id: "200-300", label: "200 - 300 kishi", guests: 300, price: 20_000_000 },
  { id: "300+", label: "300+ kishi", guests: 300, price: 25_000_000 },
];
export type Catering = "self" | "ready";
export const CATERING_PER_GUEST = 125_000; // Tayyor dasturxon (Premium to'plam), 1 mehmon uchun
export const SERVICE_FEE = 1_250_000; // Tadbirni muvofiqlashtirish va tozalash
export const HALL_DEPOSIT_PCT = 20;

export type HallDraft = { tier?: string; catering?: Catering };
export const hallDraftKey = (venueId: string) => `bazmly:hall:${venueId}`;
export function readHallDraft(venueId: string): HallDraft {
  try { return JSON.parse(sessionStorage.getItem(hallDraftKey(venueId)) ?? "{}"); } catch { return {}; }
}
export function saveHallDraft(venueId: string, patch: HallDraft) {
  const next = { ...readHallDraft(venueId), ...patch };
  try { sessionStorage.setItem(hallDraftKey(venueId), JSON.stringify(next)); } catch {}
  return next;
}

export function hallQuote(tierId?: string, catering: Catering = "self") {
  const tier = GUEST_TIERS.find((t) => t.id === tierId) ?? GUEST_TIERS[0];
  const cateringTotal = catering === "ready" ? CATERING_PER_GUEST * tier.guests : 0;
  const total = tier.price + cateringTotal + SERVICE_FEE;
  return {
    tier, catering, cateringTotal, total,
    perGuest: Math.round(total / tier.guests / 1000) * 1000,
    deposit: Math.round((total * HALL_DEPOSIT_PCT) / 100),
  };
}
