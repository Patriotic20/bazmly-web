"use client";

import { api, ApiError } from "./client";
import { accountKey, readAccount } from "./partner";
// To'yxona CRM: zallar, seanslar, paketlar va narxlar, bronlar (voronka), to'lovlar, yopiq kunlar.
// Ma'lumot backendda (`/v1/venue/hall/*`), brauzerda esa kesh: ekranlar keshni darhol o'qiydi,
// o'zgarishlar navbat (outbox) orqali backendga yuboriladi — internet uzilsa keyin qayta yuboriladi.
// To'lovlar uchun backend API yo'q — ular faqat shu qurilmada saqlanadi.
// Mijoz sayti zal narxlari va to'liq band kunlarni shu ma'lumotdan oladi (backend orqali).

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIsoDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

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

// ---------- Kesh (brauzer xotirasi, akkaunt bo'yicha) ----------
const KEYS = {
  settings: "bazmly:partner:hall-settings",
  events: "bazmly:partner:hall-events",
  blocks: "bazmly:partner:hall-blocks",
  tasks: "bazmly:partner:hall-tasks",
  dismissed: "bazmly:partner:hall-dismissed",
  payments: "bazmly:partner:hall-payments",
  outbox: "bazmly:partner:hall-outbox",
  synced: "bazmly:partner:hall-synced-v1",
} as const;

function loadRaw<T>(fullKey: string, fallback: T): T {
  try { const raw = localStorage.getItem(fullKey); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function storeRaw(fullKey: string, v: unknown) {
  try { localStorage.setItem(fullKey, JSON.stringify(v)); return true; } catch { return false; }
}
const load = <T,>(key: string, fallback: T) => loadRaw(accountKey(key), fallback);
const store = (key: string, v: unknown) => storeRaw(accountKey(key), v);

export function readSettings(): HallSettings {
  const raw = load<Partial<HallSettings> | null>(KEYS.settings, null);
  if (!raw) return DEFAULT_SETTINGS;
  const v = { ...DEFAULT_SETTINGS, ...raw } as HallSettings;
  // Oldin saqlangan paketlarga standart oshxona me'yorlari qo'shiladi
  v.catering = v.catering.map((c) => (c.norms ? c : { ...c, norms: DEFAULT_SETTINGS.catering.find((d) => d.id === c.id)?.norms }));
  return v;
}
export function saveSettings(s: HallSettings) {
  if (!store(KEYS.settings, s)) return false;
  queue({ kind: "settings", uid: "settings", op: "put", body: settingsToB(s) });
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

// ---------- Bronlarni saqlash ----------
/** Yangi yozuv identifikatori shu yerda beriladi — ekran uni darhol ishlata oladi (backend shu id bilan saqlaydi) */
const newId = (p: string) => `${p}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

type PayMap = Record<string, Payment[]>;
/** To'lovlar faqat shu qurilmada (backendda to'lov API yo'q) */
const readPays = () => load<PayMap>(KEYS.payments, {});

export function readEvents(): HallEvent[] {
  const pays = readPays();
  return load<HallEvent[]>(KEYS.events, []).map((e) => ({ ...e, payments: pays[e.id] ?? [] }));
}
function write(list: HallEvent[]) {
  store(KEYS.events, list.map((e) => ({ ...e, payments: [] })));
  return readEvents();
}
export const getEvent = (id: string) => readEvents().find((e) => e.id === id);
const pushEvent = (e: HallEvent | undefined) => { if (e) queue({ kind: "events", uid: e.id, op: "put", body: eventToB(e) }); };

export function saveEvent(e: Omit<HallEvent, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = new Date().toISOString();
  const list = readEvents();
  if (e.id && list.some((x) => x.id === e.id)) {
    const saved = write(list.map((x) => (x.id === e.id ? { ...x, ...e, id: x.id, updatedAt: now } : x))).find((x) => x.id === e.id)!;
    pushEvent(saved);
    return saved;
  }
  const created: HallEvent = { ...e, id: newId("h"), payments: [], createdAt: now, updatedAt: now };
  write([created, ...list]);
  pushEvent(created);
  return created;
}
export function setStage(id: string, stage: Stage) {
  const e = getEvent(id);
  if (!e) return readEvents();
  const note = { at: new Date().toISOString(), text: `Bosqich: ${stageInfo(e.stage).label} → ${stageInfo(stage).label}` };
  const list = write(readEvents().map((x) => (x.id === id ? { ...x, stage, notes: [note, ...x.notes], updatedAt: note.at } : x)));
  pushEvent(list.find((x) => x.id === id));
  return list;
}
export function addPayment(id: string, p: Omit<Payment, "id">) {
  const pays = readPays();
  pays[id] = [...(pays[id] ?? []), { ...p, id: newId("p") }];
  store(KEYS.payments, pays);
  // Birinchi to'lov (depozit) — so'rov bosqichidagi bron "Depozit to'landi"ga o'tadi
  const e = getEvent(id);
  if (!e || !HOLD.includes(e.stage)) return readEvents();
  const list = write(readEvents().map((x) => (x.id === id ? { ...x, stage: "depozit" as Stage, updatedAt: new Date().toISOString() } : x)));
  pushEvent(list.find((x) => x.id === id));
  return list;
}
export const removeEvent = (id: string) => {
  const pays = readPays();
  delete pays[id];
  store(KEYS.payments, pays);
  queue({ kind: "events", uid: id, op: "del" });
  return write(readEvents().filter((x) => x.id !== id));
};

// ---------- Yopiq kunlar ----------
export type Block = { id: string; date: string; hallId: string | "all"; session: SessionId | "all"; reason: string };
export function readBlocks(): Block[] { return load<Block[]>(KEYS.blocks, []); }
export function addBlock(b: Omit<Block, "id">) {
  const block: Block = { ...b, id: newId("b") };
  const list = [...readBlocks(), block];
  store(KEYS.blocks, list);
  queue({ kind: "blocks", uid: block.id, op: "put", body: blockToB(block) });
  return list;
}
export function removeBlock(id: string) {
  const list = readBlocks().filter((b) => b.id !== id);
  store(KEYS.blocks, list);
  queue({ kind: "blocks", uid: id, op: "del" });
  return list;
}

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
export function readTasks(): Task[] { return load<Task[]>(KEYS.tasks, []); }
function writeTasks(t: Task[], changed?: Task, removed?: string) {
  store(KEYS.tasks, t);
  if (changed) queue({ kind: "tasks", uid: changed.id, op: "put", body: taskToB(changed) });
  if (removed) queue({ kind: "tasks", uid: removed, op: "del" });
  return t;
}
export const addTask = (t: Omit<Task, "id" | "done" | "createdAt">) => {
  const task: Task = { ...t, id: newId("t"), done: false, createdAt: new Date().toISOString() };
  return writeTasks([task, ...readTasks()], task);
};
export const toggleTask = (id: string) => {
  const list = readTasks().map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  return writeTasks(list, list.find((t) => t.id === id));
};
export const removeTask = (id: string) => writeTasks(readTasks().filter((t) => t.id !== id), undefined, id);
export function readDismissed(): string[] { return load<string[]>(KEYS.dismissed, []); }
export function dismiss(key: string) {
  const l = [...new Set([...readDismissed(), key])];
  store(KEYS.dismissed, l);
  queue({ kind: "dismiss", uid: key, op: "put", body: { key } });
  return l;
}

export type ReminderKind = "javob" | "qayta" | "tolov" | "tayyorgarlik" | "bosqich";
export type Reminder = { key: string; kind: ReminderKind; event: HallEvent; title: string; detail: string; urgent: boolean; date: string };
const daysBetween = (a: string, b: string) => Math.round((fromIsoDay(b).getTime() - fromIsoDay(a).getTime()) / 864e5);

/** Avtomatik eslatmalar: bronlar holatidan hisoblanadi (bajarilgani yashiriladi) */
export function reminders(events: HallEvent[], s: HallSettings, today = isoDay(new Date()), dismissed = readDismissed()): Reminder[] {
  const out: Reminder[] = [];
  for (const e of events) {
    if (e.stage === "bekor") continue;
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

// ---------- Backend bilan almashinuv ----------
// Backend qiymatlari inglizcha (CONVENTIONS), ekran esa o'zbekcha kalitlar bilan ishlaydi.
const STAGE_B: Record<Stage, string> = { yangi: "new", boglanildi: "contacted", korik: "viewed", depozit: "deposit", otdi: "held", yakunlandi: "completed", bekor: "cancelled" };
const SOURCE_B: Record<Source, string> = { bazmly: "bazmly", telefon: "phone", instagram: "instagram", tashrif: "walk_in", tavsiya: "referral" };
const TYPE_B: Record<EventType, string> = { toy: "wedding", nahor: "nahor", fotiha: "fotiha", tugilgan: "birthday", korporativ: "corporate", boshqa: "other" };
const invert = <K extends string>(m: Record<K, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, K>;
const STAGE_F = invert(STAGE_B), SOURCE_F = invert(SOURCE_B), TYPE_F = invert(TYPE_B);
const n = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? 0 : Number(v));
/** Backend vaqti UTC, lekin zonasiz keladi */
const utc = (s: string) => (/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`);

type BSettings = {
  halls: { key: string; name: string; capacity: number }[];
  sessions: { key: string; label: string; starts_at: string; ends_at: string }[];
  tiers: { key: string; label: string; max_guests: number; price: string }[];
  catering: { key: string; name: string; price_per_guest: string; items: string; norms: { name: string; unit: string; qty: string }[] }[];
  service_fee: string; deposit_percent: number; weekend_percent: number; due_days_before: number; table_size: number; tables_per_waiter: number;
};
type BEvent = {
  uid: string; stage: string; source: string; contact_name: string; contact_phone: string; event_type: string;
  event_date: string; session_key: string; hall_key: string; guests: number; catering_key: string | null;
  extras: { name: string; price: string }[]; discount: string; due_date: string | null; notes: Note[];
  staff: string[] | null; timeline: TimeItem[] | null; checklist: Check[] | null; created_at: string; updated_at: string;
};
type BBlock = { uid: string; block_date: string; hall_key: string; session_key: string; reason: string };
type BTask = { uid: string; text: string; due_date: string; event_uid: string | null; done: boolean; created_at: string };

function settingsToB(s: HallSettings) {
  return {
    halls: s.halls.map((h) => ({ key: h.id, name: h.name.trim(), capacity: h.capacity })),
    sessions: s.sessions.map((x) => ({ key: x.id, label: x.label, starts_at: x.from, ends_at: x.to })),
    tiers: s.tiers.map((t) => ({ key: t.id, label: t.label, max_guests: t.max, price: t.price })),
    catering: s.catering.map((c) => ({ key: c.id, name: c.name.trim(), price_per_guest: c.perGuest, items: c.items, norms: c.norms ?? [] })),
    service_fee: s.serviceFee, deposit_percent: s.depositPct, weekend_percent: s.weekendPct,
    due_days_before: s.dueDaysBefore, table_size: s.tableSize, tables_per_waiter: s.tablesPerWaiter,
  };
}
const settingsFromB = (b: BSettings): HallSettings => ({
  halls: b.halls.map((h) => ({ id: h.key, name: h.name, capacity: h.capacity })),
  sessions: b.sessions.map((x) => ({ id: x.key as SessionId, label: x.label, from: x.starts_at, to: x.ends_at })),
  tiers: b.tiers.map((t) => ({ id: t.key, label: t.label, max: t.max_guests, price: n(t.price) })),
  catering: b.catering.map((c) => ({ id: c.key, name: c.name, perGuest: n(c.price_per_guest), items: c.items, norms: c.norms.map((x) => ({ name: x.name, unit: x.unit, qty: n(x.qty) })) })),
  serviceFee: n(b.service_fee), depositPct: b.deposit_percent, weekendPct: b.weekend_percent,
  dueDaysBefore: b.due_days_before, tableSize: b.table_size, tablesPerWaiter: b.tables_per_waiter,
});

const eventToB = (e: HallEvent) => ({
  stage: STAGE_B[e.stage], source: SOURCE_B[e.source], contact_name: e.name, contact_phone: e.phone, event_type: TYPE_B[e.eventType],
  event_date: e.date, session_key: e.session, hall_key: e.hallId, guests: e.guests, catering_key: e.cateringId,
  extras: e.extras, discount: e.discount || 0, due_date: e.dueDate || null, notes: e.notes,
  staff: e.staff ?? null, timeline: e.timeline ?? null, checklist: e.checklist ?? null,
});
const eventFromB = (b: BEvent): HallEvent => ({
  id: b.uid, stage: STAGE_F[b.stage] ?? "yangi", source: SOURCE_F[b.source] ?? "telefon",
  name: b.contact_name, phone: b.contact_phone, eventType: TYPE_F[b.event_type] ?? "boshqa",
  date: b.event_date, session: b.session_key as SessionId, hallId: b.hall_key, guests: b.guests,
  cateringId: b.catering_key, extras: b.extras.map((x) => ({ name: x.name, price: n(x.price) })), discount: n(b.discount),
  payments: [], dueDate: b.due_date ?? undefined, notes: b.notes,
  createdAt: utc(b.created_at), updatedAt: utc(b.updated_at),
  ...(b.staff ? { staff: b.staff } : {}), ...(b.timeline ? { timeline: b.timeline } : {}), ...(b.checklist ? { checklist: b.checklist } : {}),
});
const blockToB = (b: Block) => ({ block_date: b.date, hall_key: b.hallId, session_key: b.session, reason: b.reason });
const blockFromB = (b: BBlock): Block => ({ id: b.uid, date: b.block_date, hallId: b.hall_key, session: b.session_key as SessionId | "all", reason: b.reason });
const taskToB = (t: Task) => ({ text: t.text, due_date: t.date, event_uid: t.eventId ?? null, done: t.done });
const taskFromB = (b: BTask): Task => ({ id: b.uid, text: b.text, date: b.due_date, ...(b.event_uid ? { eventId: b.event_uid } : {}), done: b.done, createdAt: utc(b.created_at) });

// ---------- Navbat (outbox) ----------
type OutKind = "settings" | "events" | "blocks" | "tasks" | "dismiss";
type Out = { kind: OutKind; uid: string; op: "put" | "del"; body?: unknown; venueId: number; seq: number };
const BASE = "/v1/venue/hall";

function queue(item: Omit<Out, "venueId" | "seq">) {
  const venueId = readAccount()?.venueId;
  if (!venueId) return;
  const key = accountKey(KEYS.outbox);
  // Bitta yozuvning eski o'zgarishi yangisi bilan almashtiriladi — faqat oxirgi holat yuboriladi
  const list = loadRaw<Out[]>(key, []).filter((x) => !(x.kind === item.kind && x.uid === item.uid));
  list.push({ ...item, venueId, seq: Date.now() + Math.random() });
  storeRaw(key, list);
  schedule(700);
}

let timer: ReturnType<typeof setTimeout> | undefined;
function schedule(ms: number) {
  if (typeof window === "undefined") return;
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), ms);
}

function send(x: Out) {
  const query = { venue_id: x.venueId };
  const uid = encodeURIComponent(x.uid);
  if (x.kind === "settings") return api(`${BASE}/settings`, { method: "PUT", query, body: x.body });
  if (x.kind === "dismiss") return api(`${BASE}/reminders/dismissed`, { method: "POST", query, body: x.body });
  return api(`${BASE}/${x.kind}/${uid}`, x.op === "del" ? { method: "DELETE", query } : { method: "PUT", query, body: x.body });
}

let flushing: Promise<void> | null = null;
function flush(): Promise<void> {
  if (!flushing) flushing = drain().finally(() => { flushing = null; });
  return flushing;
}
async function drain() {
  const key = accountKey(KEYS.outbox);
  for (;;) {
    const item = loadRaw<Out[]>(key, [])[0];
    if (!item) return;
    try {
      await send(item);
    } catch (e) {
      const rejected = e instanceof ApiError && e.status >= 400 && e.status < 500 && ![401, 408, 429].includes(e.status);
      // Tarmoq yoki server xatosi — keyinroq qayta urinamiz; backend rad etsa — yozuv keyingi sinxronda serverdagi holatga qaytadi
      if (!rejected) { schedule(15_000); return; }
      console.warn("Bazmly CRM: backend o'zgarishni qabul qilmadi", item.kind, item.uid, (e as ApiError).message);
    }
    storeRaw(key, loadRaw<Out[]>(key, []).filter((x) => x.seq !== item.seq));
  }
}

// ---------- Sinxronlash ----------
export const HALL_EVENT = "bazmly:hall-synced";
/** Shu akkaunt uchun backenddan kamida bir marta yuklanganmi */
export const hallSynced = () => load<boolean>(KEYS.synced, false);

let syncing: Promise<boolean> | null = null;
/** Navbatni yuboradi va backenddagi holatni keshga yozadi (yuborilmagan o'zgarishlar saqlanib qoladi) */
export function syncHall(): Promise<boolean> {
  if (!syncing) syncing = pull().finally(() => { syncing = null; });
  return syncing;
}
async function pull(): Promise<boolean> {
  const venueId = readAccount()?.venueId;
  if (!venueId) return false;
  await flush().catch(() => {});
  const query = { venue_id: venueId };
  try {
    const [s, events, blocks, tasks, dismissed] = await Promise.all([
      api<BSettings>(`${BASE}/settings`, { query }),
      api<BEvent[]>(`${BASE}/events`, { query }),
      api<BBlock[]>(`${BASE}/blocks`, { query }),
      api<BTask[]>(`${BASE}/tasks`, { query }),
      api<string[]>(`${BASE}/reminders/dismissed`, { query }),
    ]);
    if (readAccount()?.venueId !== venueId) return false; // shu orada boshqa akkauntga o'tildi
    const pending = load<Out[]>(KEYS.outbox, []);
    const waiting = (kind: OutKind) => new Map(pending.filter((x) => x.kind === kind).map((x) => [x.uid, x.op]));
    /** Serverdagi ro'yxat + hali yuborilmagan mahalliy o'zgarishlar */
    const merge = <T extends { id: string }>(kind: OutKind, server: T[], local: T[]) => {
      const w = waiting(kind);
      return [...local.filter((x) => w.get(x.id) === "put"), ...server.filter((x) => !w.has(x.id))];
    };
    if (!pending.some((x) => x.kind === "settings")) store(KEYS.settings, settingsFromB(s));
    write(merge("events", events.map(eventFromB), readEvents()));
    store(KEYS.blocks, merge("blocks", blocks.map(blockFromB), readBlocks()));
    store(KEYS.tasks, merge("tasks", tasks.map(taskFromB), readTasks()));
    store(KEYS.dismissed, [...new Set([...dismissed, ...waiting("dismiss").keys()])]);
    store(KEYS.synced, true);
    if (typeof window !== "undefined") window.dispatchEvent(new Event(HALL_EVENT));
    return true;
  } catch {
    return false;
  }
}
