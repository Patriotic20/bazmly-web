"use client";

import { accountKey } from "./partner";
// Hamkor paneli: stollar va buyurtmalar — backend ulanguncha brauzer xotirasida namunaviy ma'lumot.
// TODO: backend — GET /partner/tables, GET/POST/PATCH /partner/orders

import type { Dish } from "./menu";
import type { PartnerBooking } from "./partnerBookings";

export type Zone = "ichkari" | "tashqari";
export type TableInfo = { no: number; seats: number; zone: Zone };
export type OrderStatus = "keldi" | "jarayonda" | "tolov" | "yakunlandi";
export type OrderItem = { dishId: string; name: string; qty: number; price: number };
export type Order = {
  id: string; table: number; waiter: string; customer: string; phone?: string; people: number;
  date: string; time: string; status: OrderStatus; startedAt: string; finishedAt?: string;
  pay?: "naqd" | "karta"; items: OrderItem[]; bookingId?: string;
};

const ORDERS_KEY = "bazmly:partner:orders";
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const TABLES: TableInfo[] = [
  { no: 12, seats: 6, zone: "ichkari" }, { no: 5, seats: 4, zone: "ichkari" }, { no: 8, seats: 6, zone: "ichkari" },
  { no: 1, seats: 4, zone: "ichkari" }, { no: 3, seats: 4, zone: "ichkari" }, { no: 7, seats: 2, zone: "ichkari" },
  { no: 9, seats: 2, zone: "ichkari" }, { no: 11, seats: 4, zone: "ichkari" }, { no: 4, seats: 6, zone: "ichkari" },
  { no: 6, seats: 6, zone: "ichkari" }, { no: 2, seats: 4, zone: "ichkari" }, { no: 10, seats: 4, zone: "ichkari" },
  { no: 14, seats: 4, zone: "tashqari" }, { no: 15, seats: 6, zone: "tashqari" }, { no: 16, seats: 2, zone: "tashqari" }, { no: 17, seats: 8, zone: "tashqari" },
];
/** Stollar ro'yxatdan o'tishdagi "Joylar soni"dan olinadi (2, 4, 6, 8, 10+ kishilik), bo'lmasa — namunaviy ro'yxat */
export function readTables(): TableInfo[] {
  try {
    const acc = JSON.parse(localStorage.getItem("bazmly:partner") ?? "null") as { tables?: Partial<Record<number, number>> } | null;
    const t = acc?.tables;
    if (t && Object.values(t).some((n) => (n ?? 0) > 0)) {
      const out: TableInfo[] = [];
      for (const size of [2, 4, 6, 8, 10]) for (let i = 0; i < (t[size] ?? 0) && out.length < 200; i++) out.push({ no: out.length + 1, seats: size, zone: "ichkari" });
      return out;
    }
  } catch {}
  return TABLES;
}

const WAITERS = ["Jasur A.", "Malika K.", "Aziza U.", "Dilnoza A."];
const CUSTOMERS = ["Bekzod Sharipov", "Sardor Aliyev", "Nodira Yusupova", "Otabek Nazarov", "Madina Rahimova", "Javohir Qodirov", "Shahnoza Ergasheva", "Dilnoza Karimova"];

function seed(now = new Date()): Order[] {
  const today = iso(now);
  const ago = (min: number) => new Date(now.getTime() - min * 60000);
  const items = (k: number): OrderItem[] => [
    { dishId: "d9", name: "Osh (Plov)", qty: 2, price: 40000 }, { dishId: "d12", name: "Choy (Ko‘k)", qty: 1, price: 5000 },
    { dishId: "d16", name: "Non", qty: 2, price: 3000 }, ...(k % 2 ? [{ dishId: "d14", name: "Kompot", qty: 1, price: 15000 }, { dishId: "d17", name: "Shashlik (qo‘y)", qty: 3, price: 28000 }] : []),
  ];
  const mk = (i: number, table: number, status: OrderStatus, minAgo: number, extra: Partial<Order> = {}): Order => {
    const st = ago(minAgo);
    return {
      id: `o${i}`, table, waiter: WAITERS[i % WAITERS.length], customer: CUSTOMERS[i % CUSTOMERS.length], people: 2 + (i % 5),
      date: today, time: hm(st), status, startedAt: st.toISOString(), items: status === "keldi" ? [] : items(i), ...extra,
    };
  };
  const list: Order[] = [
    // Figma: stollar — 05 va 03 jarayonda, 08 va 11 to'lovda, 01 yakunlangan
    mk(1, 5, "jarayonda", 25), mk(2, 3, "jarayonda", 40), mk(3, 8, "tolov", 70, { pay: "naqd" }), mk(4, 11, "tolov", 55, { pay: "karta" }),
    mk(5, 1, "yakunlandi", 109, { finishedAt: ago(5).toISOString() }), mk(6, 14, "jarayonda", 15), mk(7, 15, "jarayonda", 32),
    mk(8, 4, "keldi", 6), mk(9, 6, "jarayonda", 18), mk(10, 10, "keldi", 3),
  ];
  // Yakunlangan buyurtmalar: bugun va o'tgan 6 kun
  let n = 11;
  for (let d = 0; d < 7; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    for (let k = 0; k < (d === 0 ? 24 : 18 + (d % 4)); k++) {
      const st = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 11 + (k % 11), (k * 17) % 60);
      if (d === 0 && st > now) st.setTime(now.getTime() - (k + 2) * 7 * 60000);
      list.push({
        id: `o${n}`, table: TABLES[k % TABLES.length].no % 13 || 1, waiter: WAITERS[k % WAITERS.length], customer: CUSTOMERS[(k + d) % CUSTOMERS.length],
        people: 2 + (k % 5), date: iso(st), time: hm(st), status: "yakunlandi", startedAt: st.toISOString(),
        finishedAt: new Date(st.getTime() + 75 * 60000).toISOString(), items: items(k),
      });
      n++;
    }
  }
  return list;
}

export function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(accountKey(ORDERS_KEY));
    if (raw) { const list = JSON.parse(raw) as Order[]; if (list.some((o) => o.date === iso(new Date()))) return list; }
  } catch {}
  // Namunaviy buyurtmalar faqat mavjud stollar uchun
  const nos = new Set(readTables().map((t) => t.no));
  return write(seed().filter((o) => nos.has(o.table)));
}
function write(list: Order[]) { try { localStorage.setItem(accountKey(ORDERS_KEY), JSON.stringify(list)); } catch {} return list; }
const patch = (id: string, fn: (o: Order) => Order) => write(readOrders().map((o) => (o.id === id ? fn(o) : o)));

export const orderTotal = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty * i.price, 0);
export const finishOrder = (id: string) => patch(id, (o) => ({ ...o, status: "yakunlandi", finishedAt: new Date().toISOString() }));
export function addItem(id: string, d: Pick<Dish, "id" | "name" | "price">) {
  return patch(id, (o) => {
    const has = o.items.find((i) => i.dishId === d.id);
    const items = has ? o.items.map((i) => (i.dishId === d.id ? { ...i, qty: i.qty + 1 } : i)) : [...o.items, { dishId: d.id, name: d.name, qty: 1, price: d.price }];
    return { ...o, items, status: o.status === "keldi" ? "jarayonda" : o.status };
  });
}
/** Bron qilgan mijoz keldi — stolga "keldi" holatidagi buyurtma ochiladi */
export function openFromBooking(b: PartnerBooking) {
  const list = readOrders();
  if (list.some((o) => o.bookingId === b.id)) return list;
  const no = Number(b.table.match(/\d+/)?.[0] ?? 0);
  const now = new Date();
  return write([{
    id: `o${Date.now()}`, table: no, waiter: WAITERS[now.getMinutes() % WAITERS.length], customer: b.name, phone: b.phone, people: b.people,
    date: iso(now), time: b.time, status: "keldi", startedAt: now.toISOString(), items: [], bookingId: b.id,
  }, ...list]);
}

export type TableState = { t: TableInfo; order?: Order; state: "bosh" | "jarayonda" | "tolov" | "yakunlangan" };
/** Stol holati: ochiq buyurtma bo'lsa — uning holati, so'nggi 30 daqiqada yakunlangan bo'lsa — "yakunlangan" */
export function tableStates(orders: Order[], now = new Date()): TableState[] {
  const today = iso(now);
  return readTables().map((t) => {
    const open = orders.find((o) => o.table === t.no && o.date === today && o.status !== "yakunlandi");
    if (open) return { t, order: open, state: open.status === "tolov" ? "tolov" : "jarayonda" };
    const done = orders.find((o) => o.table === t.no && o.status === "yakunlandi" && o.finishedAt && now.getTime() - new Date(o.finishedAt).getTime() < 30 * 60000);
    return done ? { t, order: done, state: "yakunlangan" } : { t, state: "bosh" };
  });
}

/** "25 min" / "1 soat 49 daqiqa" */
export function elapsed(from: string, to?: string) {
  const m = Math.max(0, Math.round(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} soat ${m % 60} daqiqa`;
}
/** 91000 → "91,000 UZS"; 1200000 → "1 mln 200 ming UZS" */
export function uzs(n: number) {
  if (n >= 1_000_000) {
    const mln = Math.floor(n / 1_000_000), k = Math.round((n % 1_000_000) / 1000);
    return `${mln} mln${k ? ` ${k} ming` : ""} UZS`;
  }
  return `${n.toLocaleString("en-US")} UZS`;
}
