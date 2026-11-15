"use client";

import { accountKey } from "./partner";
// To'yxona CRM: zallar, seanslar, paketlar va narxlar, bronlar (voronka), to'lovlar, yopiq kunlar.
// Backend ulanguncha brauzer xotirasida namunaviy ma'lumot.
// TODO: backend — GET/PUT /partner/hall/settings, GET/POST/PATCH /partner/hall/events, POST /partner/hall/events/:id/payments
// Mijoz sayti (to'yxona bron qilish) narx va bo'sh kunlarni shu ma'lumotdan oladi — backend orqali.

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIsoDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// ---------- Sozlamalar ----------
export type Hall = { id: string; name: string; capacity: number };
export type SessionId = "kunduzgi" | "kechki";
export type SessionInfo = { id: SessionId; label: string; from: string; to: string };
export type Tier = { id: string; label: string; max: number; price: number };
/** Oshxona me'yori: 1 mehmon uchun mahsulot miqdori */
export type Norm = { name: string; unit: string; qty: number };
export type CateringPkg = { id: string; name: string; perGuest: number; items: string; norms?: Norm[] };
export type HallSettings = {
  halls: Hall[];
  sessions: SessionInfo[];
  tiers: Tier[];
  catering: CateringPkg[];
  serviceFee: number;
  depositPct: number;
  /** Shanba va yakshanba — zal narxiga ustama, % */
  weekendPct: number;
  /** Qolgan to'lov muddati — tadbirdan necha kun oldin */
  dueDaysBefore: number;
  /** Bitta stolga necha mehmon */
  tableSize: number;
  /** Bitta ofitsiant necha stolga xizmat qiladi */
  tablesPerWaiter: number;
};

export const DEFAULT_SETTINGS: HallSettings = {
  halls: [{ id: "katta", name: "Katta zal", capacity: 500 }, { id: "kichik", name: "Kichik zal", capacity: 200 }],
  sessions: [
    { id: "kunduzgi", label: "Kunduzi", from: "11:00", to: "16:00" },
    { id: "kechki", label: "Kechqurun", from: "18:00", to: "23:00" },
  ],
  tiers: [
    { id: "t150", label: "100 – 150 kishi", max: 150, price: 10_000_000 },
    { id: "t200", label: "150 – 200 kishi", max: 200, price: 15_000_000 },
    { id: "t300", label: "200 – 300 kishi", max: 300, price: 20_000_000 },
    { id: "t500", label: "300+ kishi", max: 1200, price: 25_000_000 },
  ],
  catering: [
    { id: "standart", name: "Standart", perGuest: 95_000, items: "Osh, 2 xil salat, non, choy, mevalar", norms: [
      { name: "Guruch", unit: "kg", qty: 0.12 }, { name: "Go‘sht (mol/qo‘y)", unit: "kg", qty: 0.15 }, { name: "Sabzi", unit: "kg", qty: 0.12 },
      { name: "Yog‘", unit: "l", qty: 0.03 }, { name: "Non", unit: "dona", qty: 0.5 }, { name: "Choy", unit: "g", qty: 4 }, { name: "Meva", unit: "kg", qty: 0.15 },
    ] },
    { id: "premium", name: "Premium", perGuest: 125_000, items: "Osh, 4 xil salat, issiq taom, shirinliklar, ichimliklar", norms: [
      { name: "Guruch", unit: "kg", qty: 0.12 }, { name: "Go‘sht (mol/qo‘y)", unit: "kg", qty: 0.3 }, { name: "Sabzi", unit: "kg", qty: 0.12 },
      { name: "Yog‘", unit: "l", qty: 0.04 }, { name: "Sabzavotlar (salat)", unit: "kg", qty: 0.25 }, { name: "Non", unit: "dona", qty: 0.5 },
      { name: "Shirinliklar", unit: "kg", qty: 0.1 }, { name: "Ichimliklar", unit: "l", qty: 0.5 }, { name: "Meva", unit: "kg", qty: 0.2 },
    ] },
  ],
  serviceFee: 1_250_000,
  depositPct: 20,
  weekendPct: 10,
  dueDaysBefore: 7,
  tableSize: 10,
  tablesPerWaiter: 4,
};

const SETTINGS_KEY = "bazmly:partner:hall-settings";
export function readSettings(): HallSettings {
  try {
    const raw = localStorage.getItem(accountKey(SETTINGS_KEY));
    if (raw) {
      const v = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as HallSettings;
      // Oldin saqlangan paketlarga standart oshxona me'yorlari qo'shiladi
      v.catering = v.catering.map((c) => (c.norms ? c : { ...c, norms: DEFAULT_SETTINGS.catering.find((d) => d.id === c.id)?.norms }));
      return v;
    }
  } catch {}
  return DEFAULT_SETTINGS;
}
export function saveSettings(s: HallSettings) {
  try { localStorage.setItem(accountKey(SETTINGS_KEY), JSON.stringify(s)); } catch { return false; }
  return true;
}

// ---------- Bronlar (CRM) ----------
export type Stage = "yangi" | "boglanildi" | "korik" | "depozit" | "otdi" | "yakunlandi" | "bekor";
export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "yangi", label: "Yangi so‘rov", color: "#3B82F6" },
  { id: "boglanildi", label: "Bog‘lanildi", color: "#8B5CF6" },
  { id: "korik", label: "Zalni ko‘rdi", color: "#F59E0B" },
  { id: "depozit", label: "Depozit to‘landi", color: "#FF6A00" },
  { id: "otdi", label: "Tadbir o‘tdi", color: "#14B8A6" },
  { id: "yakunlandi", label: "Yakunlandi", color: "#22C55E" },
  { id: "bekor", label: "Bekor qilindi", color: "#94A3B8" },
];
export const stageInfo = (s: Stage) => STAGES.find((x) => x.id === s)!;
/** Kalendarda joy band hisoblanadigan bosqichlar */
export const BOOKED: Stage[] = ["depozit", "otdi", "yakunlandi"];
/** Vaqtincha ushlab turilgan (depozitsiz) */
export const HOLD: Stage[] = ["yangi", "boglanildi", "korik"];

export type Source = "bazmly" | "telefon" | "instagram" | "tashrif" | "tavsiya";
export const SOURCES: { id: Source; label: string }[] = [
  { id: "bazmly", label: "Bazmly" }, { id: "telefon", label: "Telefon" }, { id: "instagram", label: "Instagram" },
  { id: "tashrif", label: "Tashrif" }, { id: "tavsiya", label: "Tavsiya" },
];
export type EventType = "toy" | "nahor" | "fotiha" | "tugilgan" | "korporativ" | "boshqa";
export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "toy", label: "To‘y" }, { id: "nahor", label: "Nahor oshi" }, { id: "fotiha", label: "Fotiha to‘yi" },
  { id: "tugilgan", label: "Tug‘ilgan kun" }, { id: "korporativ", label: "Korporativ" }, { id: "boshqa", label: "Boshqa" },
];
export type PayMethod = "naqd" | "karta" | "otkazma" | "bazmly";
export const PAY_METHODS: { id: PayMethod; label: string }[] = [
  { id: "naqd", label: "Naqd" }, { id: "karta", label: "Karta" }, { id: "otkazma", label: "O‘tkazma" }, { id: "bazmly", label: "Bazmly (onlayn)" },
];
export type Payment = { id: string; amount: number; method: PayMethod; date: string; note?: string };
export type Extra = { name: string; price: number };
export type Note = { at: string; text: string };

export type HallEvent = {
  id: string; stage: Stage; source: Source;
  name: string; phone: string; eventType: EventType;
  date: string; session: SessionId; hallId: string; guests: number;
  cateringId: string | null; extras: Extra[]; discount: number;
  payments: Payment[]; dueDate?: string; notes: Note[];
  createdAt: string; updatedAt: string;
  /** Tadbir kuni: biriktirilgan hodimlar (id), vaqt jadvali, tayyorgarlik ro'yxati */
  staff?: string[]; timeline?: TimeItem[]; checklist?: Check[];
};
export type TimeItem = { time: string; text: string };
export type Check = { text: string; done: boolean };

// ---------- Narx hisobi ----------
export const tierFor = (s: HallSettings, guests: number) => s.tiers.find((t) => guests <= t.max) ?? s.tiers[s.tiers.length - 1];
export const isWeekend = (date: string) => { const d = fromIsoDay(date).getDay(); return d === 0 || d === 6; };
export function quote(s: HallSettings, e: Pick<HallEvent, "guests" | "cateringId" | "extras" | "discount" | "date">) {
  const tier = tierFor(s, e.guests);
  const hall = tier.price + (e.date && isWeekend(e.date) ? Math.round((tier.price * s.weekendPct) / 100) : 0);
  const pkg = s.catering.find((c) => c.id === e.cateringId);
  const catering = pkg ? pkg.perGuest * e.guests : 0;
  const extras = e.extras.reduce((a, x) => a + x.price, 0);
  const total = Math.max(0, hall + catering + s.serviceFee + extras - (e.discount || 0));
  return { tier, hall, catering, pkg, extras, service: s.serviceFee, total, deposit: Math.round((total * s.depositPct) / 100) };
}
export const paid = (e: HallEvent) => e.payments.reduce((a, p) => a + p.amount, 0);
export const eventTotal = (e: HallEvent, s = readSettings()) => quote(s, e).total;
export const debt = (e: HallEvent, s = readSettings()) => Math.max(0, eventTotal(e, s) - paid(e));

// ---------- Namunaviy ma'lumot ----------
const NAMES = ["Jasur Toshmatov", "Dilnoza Rahimova", "Sardor Aliyev", "Madina Yusupova", "Otabek Karimov", "Nilufar Ergasheva",
  "Bekzod Nazarov", "Shahnoza Qodirova", "Aziz Sobirov", "Gulnora Ismoilova", "Rustam Xolmatov", "Kamola Tursunova",
  "Javohir Mirzayev", "Zarina Abdullayeva", "Ulug‘bek Hamidov", "Sevara Yo‘ldosheva", "Doniyor Rasulov", "Feruza Saidova",
  "Shoxrux Umarov", "Malika Islomova", "Ilhom Jo‘rayev", "Lola Nurmatova"];

function seed(now = new Date()): HallEvent[] {
  const s = DEFAULT_SETTINGS;
  const out: HallEvent[] = [];
  // [kun (bugundan), seans, zal, bosqich, manba, mehmon, dasturxon, to'langan ulush]
  const plan: [number, SessionId, string, Stage, Source, number, string | null, number, EventType][] = [
    [-18, "kechki", "katta", "yakunlandi", "bazmly", 280, "premium", 1, "toy"],
    [-12, "kunduzgi", "kichik", "yakunlandi", "telefon", 120, "standart", 1, "nahor"],
    [-6, "kechki", "katta", "otdi", "instagram", 350, "premium", 0.6, "toy"],
    [-2, "kechki", "kichik", "otdi", "tavsiya", 180, null, 0.8, "tugilgan"],
    [0, "kechki", "katta", "depozit", "bazmly", 300, "premium", 1, "toy"],
    [2, "kunduzgi", "katta", "depozit", "telefon", 400, "standart", 0.2, "nahor"],
    [3, "kechki", "kichik", "depozit", "tashrif", 150, "premium", 1, "fotiha"],
    [5, "kechki", "katta", "depozit", "bazmly", 450, "premium", 0.2, "toy"],
    [6, "kechki", "kichik", "korik", "instagram", 160, "standart", 0, "toy"],
    [9, "kechki", "katta", "depozit", "telefon", 320, "premium", 0.35, "toy"],
    [12, "kunduzgi", "kichik", "boglanildi", "telefon", 90, null, 0, "korporativ"],
    [13, "kechki", "katta", "depozit", "bazmly", 260, "standart", 0.2, "toy"],
    [16, "kechki", "katta", "yangi", "bazmly", 220, "premium", 0, "toy"],
    [19, "kunduzgi", "katta", "depozit", "tavsiya", 380, "standart", 0.2, "nahor"],
    [20, "kechki", "katta", "korik", "tashrif", 300, "premium", 0, "toy"],
    [23, "kechki", "kichik", "depozit", "instagram", 140, "premium", 0.2, "tugilgan"],
    [27, "kechki", "katta", "boglanildi", "instagram", 500, "premium", 0, "toy"],
    [30, "kechki", "katta", "depozit", "bazmly", 330, "premium", 0.2, "toy"],
    [34, "kunduzgi", "kichik", "yangi", "telefon", 110, null, 0, "fotiha"],
    [41, "kechki", "katta", "depozit", "telefon", 420, "standart", 0.2, "toy"],
    [8, "kechki", "katta", "bekor", "instagram", 250, "standart", 0, "toy"],
    [48, "kechki", "kichik", "yangi", "bazmly", 170, "premium", 0, "toy"],
  ];
  plan.forEach(([dd, session, hallId, stage, source, guests, cateringId, share, eventType], i) => {
    const day = addDays(now, dd);
    const date = isoDay(day);
    // So'rov bosqichidagilar yaqinda tushgan, qolganlari oldinroq
    const created = HOLD.includes(stage) ? addDays(now, -(i % 5)) : addDays(now, Math.min(dd, 0) - 20 - (i % 9));
    const base: HallEvent = {
      id: `h${i + 1}`, stage, source, name: NAMES[i % NAMES.length], phone: `+99890${String(1234567 + i * 7919).slice(0, 7)}`,
      eventType, date, session, hallId, guests, cateringId, extras: i % 3 === 0 ? [{ name: "Gul bezak", price: 2_500_000 }] : [], discount: 0,
      payments: [], dueDate: isoDay(addDays(day, -s.dueDaysBefore)), notes: [], createdAt: created.toISOString(), updatedAt: created.toISOString(),
    };
    const total = quote(s, base).total;
    if (share > 0) {
      const dep = Math.round((total * s.depositPct) / 100 / 1000) * 1000;
      base.payments.push({ id: `p${i}a`, amount: Math.min(dep, total), method: source === "bazmly" ? "bazmly" : "naqd", date: isoDay(addDays(created, 1)), note: "Depozit" });
      const rest = Math.round((total * share) / 1000) * 1000 - dep;
      if (rest > 0) base.payments.push({ id: `p${i}b`, amount: share >= 1 ? total - dep : rest, method: i % 2 ? "otkazma" : "naqd", date: isoDay(addDays(day, Math.min(-1, -s.dueDaysBefore + (i % 4)))), note: share >= 1 ? "To‘liq to‘lov" : "Qisman to‘lov" });
    }
    if (source === "bazmly") base.notes.push({ at: created.toISOString(), text: "Bazmly orqali onlayn bron qilindi" });
    if (stage === "korik") base.notes.push({ at: addDays(now, -1).toISOString(), text: "Zalni ko‘rib ketdi, oilasi bilan maslahatlashadi" });
    out.push(base);
  });
  return out;
}

/** O'tgan 11 oy: yakunlangan (to'liq to'langan) va bekor qilingan tadbirlar — hisobotlar uchun */
function history(now = new Date()): HallEvent[] {
  const s = DEFAULT_SETTINGS;
  const out: HallEvent[] = [];
  const src: Source[] = ["bazmly", "bazmly", "telefon", "instagram", "instagram", "tashrif", "tavsiya", "bazmly"];
  const types: EventType[] = ["toy", "toy", "toy", "nahor", "fotiha", "tugilgan", "korporativ", "toy"];
  let n = 0;
  for (let m = 11; m >= 1; m--) {
    // Kuz va yoz — to'ylar mavsumi: ko'proq tadbir
    const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const season = [4, 5, 6, 8, 9, 10].includes(month.getMonth()) ? 1.6 : 1;
    const count = Math.round((7 + (m * 5) % 6) * season);
    for (let k = 0; k < count; k++) {
      n++;
      const day = new Date(month.getFullYear(), month.getMonth(), 1 + ((k * 7 + m * 3) % 27));
      const date = isoDay(day);
      const cancelled = n % 9 === 0;
      const lost = !cancelled && n % 5 === 0; // so'rov qoldirilgan, depozitsiz bekor
      const guests = 120 + ((n * 37) % 380);
      const hallId = guests > 200 ? "katta" : n % 3 ? "kichik" : "katta";
      const created = addDays(day, -30 - (n % 40));
      const e: HallEvent = {
        id: `hx${n}`, stage: cancelled || lost ? "bekor" : "yakunlandi", source: src[n % src.length], eventType: types[(n * 3) % types.length],
        name: NAMES[(n * 5) % NAMES.length], phone: `+99893${String(2000000 + n * 7717).slice(0, 7)}`,
        date, session: n % 4 === 0 ? "kunduzgi" : "kechki", hallId, guests, cateringId: n % 3 === 0 ? "standart" : n % 7 === 0 ? null : "premium",
        extras: [], discount: 0, payments: [], dueDate: isoDay(addDays(day, -s.dueDaysBefore)), notes: [],
        createdAt: created.toISOString(), updatedAt: day.toISOString(),
      };
      const total = quote(s, e).total;
      if (!lost) {
        const dep = Math.round((total * s.depositPct) / 100 / 1000) * 1000;
        e.payments.push({ id: `px${n}a`, amount: dep, method: e.source === "bazmly" ? "bazmly" : "naqd", date: isoDay(addDays(created, 2)), note: "Depozit" });
        if (!cancelled) e.payments.push({ id: `px${n}b`, amount: total - dep, method: n % 2 ? "otkazma" : "naqd", date: isoDay(addDays(day, -3)), note: "Qolgan to‘lov" });
      }
      out.push(e);
    }
  }
  return out;
}

const EVENTS_KEY = "bazmly:partner:hall-events";
export function readEvents(): HallEvent[] {
  try {
    const raw = localStorage.getItem(accountKey(EVENTS_KEY));
    if (raw) {
      const list = JSON.parse(raw) as HallEvent[];
      // Hisobotlar uchun o'tgan 11 oy tarixi (avval saqlangan ma'lumotga bir marta qo'shiladi)
      if (!list.some((e) => e.id.startsWith("hx"))) { const next = [...list, ...history()]; write(next); return next; }
      return list;
    }
  } catch {}
  const list = [...seed(), ...history()];
  try { localStorage.setItem(accountKey(EVENTS_KEY), JSON.stringify(list)); } catch {}
  return list;
}
function write(list: HallEvent[]) { try { localStorage.setItem(accountKey(EVENTS_KEY), JSON.stringify(list)); } catch {} return list; }
export const getEvent = (id: string) => readEvents().find((e) => e.id === id);

export function saveEvent(e: Omit<HallEvent, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = new Date().toISOString();
  const list = readEvents();
  if (e.id && list.some((x) => x.id === e.id)) {
    const next = list.map((x) => (x.id === e.id ? { ...x, ...e, id: x.id, updatedAt: now } : x));
    write(next);
    return next.find((x) => x.id === e.id)!;
  }
  const created: HallEvent = { ...e, id: `h${Date.now()}`, createdAt: now, updatedAt: now };
  write([created, ...list]);
  return created;
}
export function setStage(id: string, stage: Stage) {
  const e = getEvent(id);
  if (!e) return readEvents();
  const note = { at: new Date().toISOString(), text: `Bosqich: ${stageInfo(e.stage).label} → ${stageInfo(stage).label}` };
  return write(readEvents().map((x) => (x.id === id ? { ...x, stage, notes: [note, ...x.notes], updatedAt: note.at } : x)));
}
export function addPayment(id: string, p: Omit<Payment, "id">) {
  const pay = { ...p, id: `p${Date.now()}` };
  return write(readEvents().map((x) => {
    if (x.id !== id) return x;
    // Birinchi to'lov (depozit) — so'rov bosqichidagi bron "Depozit to'landi"ga o'tadi
    const stage = HOLD.includes(x.stage) ? "depozit" : x.stage;
    return { ...x, stage, payments: [...x.payments, pay], updatedAt: new Date().toISOString() };
  }));
}
export const removeEvent = (id: string) => write(readEvents().filter((x) => x.id !== id));

// ---------- Yopiq kunlar ----------
export type Block = { id: string; date: string; hallId: string | "all"; session: SessionId | "all"; reason: string };
const BLOCKS_KEY = "bazmly:partner:hall-blocks";
export function readBlocks(): Block[] { try { return JSON.parse(localStorage.getItem(accountKey(BLOCKS_KEY)) ?? "[]"); } catch { return []; } }
export function addBlock(b: Omit<Block, "id">) { const list = [...readBlocks(), { ...b, id: `b${Date.now()}` }]; try { localStorage.setItem(accountKey(BLOCKS_KEY), JSON.stringify(list)); } catch {} return list; }
export function removeBlock(id: string) { const list = readBlocks().filter((b) => b.id !== id); try { localStorage.setItem(accountKey(BLOCKS_KEY), JSON.stringify(list)); } catch {} return list; }

// ---------- Kalendar holati ----------
export type SlotState = { state: "bosh" | "ushlab" | "band" | "yopiq"; event?: HallEvent; holds: HallEvent[]; block?: Block };
export function slotState(events: HallEvent[], blocks: Block[], date: string, hallId: string, session: SessionId): SlotState {
  const here = events.filter((e) => e.date === date && e.hallId === hallId && e.session === session && e.stage !== "bekor");
  const booked = here.find((e) => BOOKED.includes(e.stage));
  const holds = here.filter((e) => HOLD.includes(e.stage));
  const block = blocks.find((b) => b.date === date && (b.hallId === "all" || b.hallId === hallId) && (b.session === "all" || b.session === session));
  if (booked) return { state: "band", event: booked, holds };
  if (block) return { state: "yopiq", holds, block };
  if (holds.length) return { state: "ushlab", event: holds[0], holds };
  return { state: "bosh", holds };
}
/** Saqlashdan oldin: shu joy boshqa bron bilan band emasmi */
export function conflict(events: HallEvent[], blocks: Block[], e: Pick<HallEvent, "date" | "hallId" | "session" | "stage"> & { id?: string }) {
  const others = events.filter((x) => x.id !== e.id);
  const s = slotState(others, blocks, e.date, e.hallId, e.session);
  if (s.state === "band") return { level: "band" as const, with: s.event };
  if (s.state === "yopiq") return { level: "yopiq" as const, block: s.block };
  if (s.state === "ushlab") return { level: "ushlab" as const, with: s.event };
  return null;
}

// ---------- Formatlash ----------
/** 12500000 → "12 500 000" */
export const num = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, " ");
/** 12500000 → "12,5 mln" */
export const mln = (n: number) => (n >= 1_000_000 ? `${(Math.round(n / 100_000) / 10).toString().replace(".", ",")} mln` : `${Math.round(n / 1000)} ming`);

// ---------- Tadbir kuni ----------
export const tablesNeeded = (s: HallSettings, guests: number) => Math.ceil(guests / Math.max(1, s.tableSize || 10));
export const waitersNeeded = (s: HallSettings, guests: number) => Math.ceil(tablesNeeded(s, guests) / Math.max(1, s.tablesPerWaiter || 4));
const TIMELINES: Record<SessionId, TimeItem[]> = {
  kechki: [
    { time: "16:00", text: "Zal bezagi va stollar tayyor" }, { time: "17:00", text: "Ovoz va yorug‘lik tekshiruvi" },
    { time: "18:00", text: "Mehmonlarni kutib olish, sovuq taomlar" }, { time: "18:30", text: "Kelin-kuyov kirishi" },
    { time: "19:30", text: "Issiq taom" }, { time: "21:00", text: "Osh / asosiy taom" }, { time: "22:00", text: "Tort va shirinliklar" },
    { time: "23:00", text: "Tadbir yakuni, tozalash" },
  ],
  kunduzgi: [
    { time: "05:30", text: "Oshxona: osh tayyorlash boshlanadi" }, { time: "06:30", text: "Zal va stollar tayyor" },
    { time: "07:00", text: "Mehmonlarni kutib olish" }, { time: "07:30", text: "Osh tortiladi" }, { time: "09:00", text: "Tadbir yakuni, tozalash" },
  ],
};
export const defaultTimeline = (e: Pick<HallEvent, "session" | "eventType">): TimeItem[] =>
  e.eventType === "nahor" ? TIMELINES.kunduzgi : e.session === "kunduzgi"
    ? [{ time: "10:00", text: "Zal bezagi va stollar tayyor" }, { time: "11:00", text: "Mehmonlarni kutib olish" }, { time: "12:00", text: "Asosiy taom" }, { time: "14:30", text: "Tort va shirinliklar" }, { time: "16:00", text: "Tadbir yakuni, tozalash" }]
    : TIMELINES.kechki;
export const DEFAULT_CHECKLIST: Check[] = [
  { text: "Menyu mijoz bilan kelishildi", done: false }, { text: "Zal bezagi tasdiqlandi", done: false },
  { text: "Mahsulotlar buyurtma qilindi", done: false }, { text: "Ofitsiantlar biriktirildi", done: false },
  { text: "Ovoz va yorug‘lik tekshirildi", done: false }, { text: "Qolgan to‘lov olindi", done: false },
];
/** Hodim boshqa tadbirga (shu kun va seans) biriktirilganmi */
export const staffBusy = (events: HallEvent[], e: Pick<HallEvent, "id" | "date" | "session">, staffId: string) =>
  events.find((x) => x.id !== e.id && x.date === e.date && x.session === e.session && x.stage !== "bekor" && x.staff?.includes(staffId));

// ---------- Eslatmalar ----------
export type Task = { id: string; text: string; date: string; eventId?: string; done: boolean; createdAt: string };
const TASKS_KEY = "bazmly:partner:hall-tasks";
const DISMISS_KEY = "bazmly:partner:hall-dismissed";
export function readTasks(): Task[] { try { return JSON.parse(localStorage.getItem(accountKey(TASKS_KEY)) ?? "[]"); } catch { return []; } }
function writeTasks(t: Task[]) { try { localStorage.setItem(accountKey(TASKS_KEY), JSON.stringify(t)); } catch {} return t; }
export const addTask = (t: Omit<Task, "id" | "done" | "createdAt">) => writeTasks([{ ...t, id: `t${Date.now()}`, done: false, createdAt: new Date().toISOString() }, ...readTasks()]);
export const toggleTask = (id: string) => writeTasks(readTasks().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
export const removeTask = (id: string) => writeTasks(readTasks().filter((t) => t.id !== id));
export function readDismissed(): string[] { try { return JSON.parse(localStorage.getItem(accountKey(DISMISS_KEY)) ?? "[]"); } catch { return []; } }
export function dismiss(key: string) { const l = [...new Set([...readDismissed(), key])]; try { localStorage.setItem(accountKey(DISMISS_KEY), JSON.stringify(l)); } catch {} return l; }

export type ReminderKind = "javob" | "qayta" | "tolov" | "tayyorgarlik" | "bosqich";
export type Reminder = { key: string; kind: ReminderKind; event: HallEvent; title: string; detail: string; urgent: boolean; date: string };
const daysBetween = (a: string, b: string) => Math.round((fromIsoDay(b).getTime() - fromIsoDay(a).getTime()) / 864e5);

/** Avtomatik eslatmalar: bronlar holatidan hisoblanadi (bajarilgani yashiriladi) */
export function reminders(events: HallEvent[], s: HallSettings, today = isoDay(new Date()), dismissed = readDismissed()): Reminder[] {
  const out: Reminder[] = [];
  for (const e of events) {
    if (e.stage === "bekor" || e.id.startsWith("hx")) continue;
    const created = isoDay(new Date(e.createdAt));
    const left = daysBetween(today, e.date);
    const total = quote(s, e).total; const p = paid(e);
    if (e.stage === "yangi" && daysBetween(created, today) >= 1)
      out.push({ key: `javob:${e.id}`, kind: "javob", event: e, title: "So‘rovga javob bering", detail: `${daysBetween(created, today)} kundan beri kutmoqda`, urgent: daysBetween(created, today) >= 2, date: created });
    const lastNote = e.notes[0] ? isoDay(new Date(e.notes[0].at)) : created;
    if ((e.stage === "boglanildi" || e.stage === "korik") && daysBetween(lastNote, today) >= 3)
      out.push({ key: `qayta:${e.id}:${lastNote}`, kind: "qayta", event: e, title: "Qayta bog‘laning", detail: `${daysBetween(lastNote, today)} kundan beri javob yo‘q`, urgent: left <= 14, date: lastNote });
    if (BOOKED.includes(e.stage) && p < total && e.dueDate && daysBetween(today, e.dueDate) <= 3)
      out.push({ key: `tolov:${e.id}:${p}`, kind: "tolov", event: e, title: e.dueDate < today ? "To‘lov muddati o‘tdi" : "Qolgan to‘lovni eslating", detail: `Qoldiq: ${num(total - p)} so‘m`, urgent: e.dueDate < today, date: e.dueDate });
    if (e.stage === "depozit" && left >= 0 && left <= 3) {
      const ch = e.checklist ?? DEFAULT_CHECKLIST;
      const undone = ch.filter((c) => !c.done).length;
      if (undone || !(e.staff?.length)) out.push({ key: `tayyorgarlik:${e.id}:${undone}:${e.staff?.length ?? 0}`, kind: "tayyorgarlik", event: e, title: left === 0 ? "Bugun tadbir — tayyorgarlik" : `Tadbirga ${left} kun qoldi`, detail: `${undone} ta ish bajarilmagan${e.staff?.length ? "" : ", hodimlar biriktirilmagan"}`, urgent: left <= 1, date: e.date });
    }
    if (e.stage === "depozit" && e.date < today)
      out.push({ key: `bosqich:${e.id}`, kind: "bosqich", event: e, title: "Tadbir o‘tdi — bosqichni yangilang", detail: "“Tadbir o‘tdi” yoki “Yakunlandi”", urgent: false, date: e.date });
  }
  return out.filter((r) => !dismissed.includes(r.key)).sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.date.localeCompare(b.date));
}
