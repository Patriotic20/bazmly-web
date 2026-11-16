"use client";

import { accountKey } from "./partner";
import { api, toNum } from "./client";
import { cacheRead, cacheWrite, ctx, utc, type BTable, type BZone } from "./venueAdmin";
// Hamkor paneli: stollar va buyurtmalar (cheklar) — backend `/v1/venue/orders/*`, `/v1/venue/venues/{id}/tables`.
// O'qish keshdan (sinxron), `syncTables()` / `syncOrders()` backend'dan yangilaydi.
// Backend buyurtmalar ro'yxati faqat bugungi ish kuni uchun — o'tgan kunlar keshdan ko'rsatiladi.

import type { Dish } from "./menu";
import { readBookings, type PartnerBooking } from "./partnerBookings";
import { readStaff } from "./staff";

export type Zone = "ichkari" | "tashqari";
export type TableInfo = { no: number; seats: number; zone: Zone; id?: number };
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

const TABLES_KEY = "bazmly:partner:tables";
/** Filial stollari (backend'dan, keshda) */
export function readTables(): TableInfo[] {
  return cacheRead<TableInfo[]>(accountKey(TABLES_KEY), []);
}
export async function syncTables(): Promise<TableInfo[]> {
  const c = ctx();
  if (!c) return readTables();
  const q = { venue_id: c.venueId };
  const [tables, zones] = await Promise.all([
    api<BTable[]>(`/v1/venue/venues/${c.venueId}/tables`, { query: q }),
    api<BZone[]>(`/v1/venue/venues/${c.venueId}/zones`, { query: q }).catch(() => [] as BZone[]),
  ]);
  const zoneOf = (id: number | null) => (zones.find((z) => z.id === id)?.slug === "tashqari" ? "tashqari" : "ichkari") as Zone;
  return cacheWrite(accountKey(TABLES_KEY), tables.filter((t) => t.is_active).sort((a, b) => a.number - b.number).map((t) => ({ no: t.number, seats: t.seats, zone: zoneOf(t.zone_id), id: t.id })));
}

type BOrderList = { id: number; status: string; opened_at: string };
type BOrder = {
  order: { id: number; table_id: number | null; booking_id: number | null; business_date: string; status: string; guests_count: number | null; waiter_staff_id: number | null; opened_at: string; closed_at: string | null; total_amount: string };
  items: { menu_item_id: number; quantity: number; unit_price: string; name_snapshot: string; variant_name_snapshot: string | null; status: string }[];
  payments: { method: string; amount: string }[];
  paid_amount: string;
};
const LINKS = "bazmly:partner:order-bookings";
const STATUS: Record<string, OrderStatus | undefined> = { open: "keldi", in_progress: "jarayonda", served: "jarayonda", awaiting_payment: "tolov", completed: "yakunlandi" };

function toOrder(d: BOrder, tables: TableInfo[]): Order | null {
  const o = d.order;
  const status = STATUS[o.status];
  if (!status) return null; // bekor qilingan
  const started = new Date(utc(o.opened_at));
  // Chek bron bilan ochilgan bo'lsa (backend'da yoki shu panelda "Keldi" orqali) — mijoz ismi bron'dan olinadi
  const bookingId = o.booking_id ? String(o.booking_id) : cacheRead<Record<string, string>>(accountKey(LINKS), {})[String(o.id)];
  const booking = bookingId ? readBookings().find((b) => b.id === bookingId) : undefined;
  const waiter = o.waiter_staff_id ? readStaff().find((s) => s.id === String(o.waiter_staff_id))?.name : undefined;
  const no = tables.find((t) => t.id === o.table_id)?.no ?? 0;
  const items = d.items.filter((i) => i.status !== "cancelled").map((i) => ({
    dishId: String(i.menu_item_id), name: i.variant_name_snapshot ? `${i.name_snapshot} (${i.variant_name_snapshot})` : i.name_snapshot,
    qty: i.quantity, price: toNum(i.unit_price),
  }));
  return {
    id: String(o.id), table: no, waiter: waiter ?? "—", customer: booking?.name ?? `Stol ${String(no).padStart(2, "0")}`, phone: booking?.phone,
    people: o.guests_count ?? booking?.people ?? 0, date: o.business_date, time: hm(started), status: status === "keldi" && items.length ? "jarayonda" : status,
    startedAt: started.toISOString(), finishedAt: o.closed_at ? new Date(utc(o.closed_at)).toISOString() : undefined,
    pay: d.payments.length ? (d.payments[0].method === "cash" ? "naqd" : "karta") : undefined, items, bookingId,
  };
}

export function readOrders(): Order[] {
  return cacheRead<Order[]>(accountKey(ORDERS_KEY), []);
}
function write(list: Order[]) { return cacheWrite(accountKey(ORDERS_KEY), list); }

/** Bugungi cheklarni (taomlari bilan) backend'dan oladi; o'tgan kunlar keshda qoladi */
export async function syncOrders(): Promise<Order[]> {
  const c = ctx();
  if (!c) return readOrders();
  const q = { venue_id: c.venueId };
  const tables = readTables().length ? readTables() : await syncTables();
  const list = await api<BOrderList[]>("/v1/venue/orders", { query: q });
  const details = await Promise.all(list.map((o) => api<BOrder>(`/v1/venue/orders/${o.id}`, { query: q }).catch(() => null)));
  const fresh = details.flatMap((d) => (d ? [toOrder(d, tables)] : [])).filter((o): o is Order => !!o);
  const days = new Set(fresh.map((o) => o.date).concat(iso(new Date())));
  // Namunaviy (eski) yozuvlar va bugungi kun almashtiriladi
  return write([...fresh, ...readOrders().filter((o) => /^\d+$/.test(o.id) && !days.has(o.date))]);
}

export const orderTotal = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty * i.price, 0);
/** Yakunlash: qolgan summa naqd to'lov sifatida qayd etiladi va chek yopiladi */
export async function finishOrder(id: string): Promise<Order[]> {
  const c = ctx();
  if (!c) return readOrders();
  const q = { venue_id: c.venueId };
  const d = await api<BOrder>(`/v1/venue/orders/${id}`, { query: q });
  const left = toNum(d.order.total_amount) - toNum(d.paid_amount);
  if (left > 0) await api(`/v1/venue/orders/${id}/payments`, { method: "POST", query: q, body: { method: "cash", amount: left } });
  await api(`/v1/venue/orders/${id}/close`, { method: "POST", query: q });
  return syncOrders();
}
/** Chekka taom qo'shish (variantli taom — eng arzon variant) */
export async function addItem(id: string, d: Pick<Dish, "id" | "name" | "price"> & { variants?: Dish["variants"] }): Promise<Order[]> {
  const c = ctx();
  if (!c) return readOrders();
  const q = { venue_id: c.venueId };
  let variant_id: number | null = null;
  if (d.variants?.length) {
    const item = await api<{ variants: { id: number; price: string; is_active: boolean }[] }>(`/v1/venue/menu/items/${d.id}`, { query: q });
    variant_id = item.variants.filter((v) => v.is_active).sort((a, b) => toNum(a.price) - toNum(b.price))[0]?.id ?? null;
  }
  await api(`/v1/venue/orders/${id}/items`, { method: "POST", query: q, body: [{ menu_item_id: Number(d.id), variant_id, quantity: 1 }] });
  return syncOrders();
}
/** Bron qilgan mijoz keldi — uning stoliga chek ochiladi ("Buyurtmalar" bo'limida ko'rinadi) */
export async function openFromBooking(b: PartnerBooking): Promise<Order[]> {
  const c = ctx();
  if (!c) return readOrders();
  const tableId = b.tableId ?? readTables().find((t) => t.no === Number(b.table.match(/\d+/)?.[0] ?? 0))?.id;
  if (tableId) {
    // Stolda ochiq chek bo'lsa backend 409 qaytaradi — e'tiborsiz qoldiriladi
    const made = await api<{ id: number }>("/v1/venue/orders", { method: "POST", query: { venue_id: c.venueId }, body: { table_id: tableId, guests_count: b.people } }).catch(() => null);
    if (made) cacheWrite(accountKey(LINKS), { ...cacheRead<Record<string, string>>(accountKey(LINKS), {}), [String(made.id)]: b.id });
  }
  return syncOrders();
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
