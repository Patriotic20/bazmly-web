// Mijoz bronlari — backend `/v1/bookings` (stol va to'yxona).
// To'lov (karta, SMS) uchun backendda API yo'q — ekrandagi to'lov bosqichlari namunaviy qoladi, bron esa backendda yaratiladi.
import { api, toNum } from "./client";
import { getVenue, type VenueDetails, type VenueType } from "./venues";

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show" | "expired";

/** Ekranlarda ishlatiladigan bron ko'rinishi */
export type Booking = {
  id: string; venueId: string; venueName?: string; type: VenueType;
  date?: string; time?: string; table?: number; people?: number; guestTier?: string; receipt?: string;
  status?: BookingStatus; code?: string; qr?: string; amount?: number; total?: number;
  name?: string; phone?: string; items?: { id: string; name: string; qty: number; price: number }[];
  services?: string[];
};

type BBooking = {
  id: number; venue_id: number; kind: "table_reservation" | "hall_event"; status: BookingStatus;
  booking_date: string; start_time: string; end_time: string; guests_count: number;
  contact_name: string; contact_phone: string; subtotal: string; deposit_amount: string; total_amount: string;
  receipt_number: string; ticket_code: string; table_id: number | null;
};
type BListItem = {
  id: number; venue_id: number; venue_name: string; kind: BBooking["kind"]; status: BookingStatus;
  booking_date: string; start_time: string; end_time: string; guests_count: number; total_amount: string; table_number: number | null;
};
type BDetail = {
  booking: BBooking; qr_token: string; venue_name: string;
  items: { menu_item_id: number; quantity: number; unit_price: string; name_snapshot: string }[];
  services: { name_snapshot: string }[];
};

const typeOf = (k: BBooking["kind"]): VenueType => (k === "hall_event" ? "toyxona" : "restoran");
const hm = (t: string) => t.slice(0, 5);

const fromList = (b: BListItem): Booking => ({
  id: String(b.id), venueId: String(b.venue_id), venueName: b.venue_name, type: typeOf(b.kind),
  date: b.booking_date, time: hm(b.start_time), table: b.table_number ?? undefined,
  people: b.guests_count, guestTier: b.kind === "hall_event" ? `${b.guests_count} kishi` : undefined,
  status: b.status, total: toNum(b.total_amount),
});
const fromDetail = (d: BDetail, tableNumber?: number): Booking => {
  const b = d.booking;
  return {
    id: String(b.id), venueId: String(b.venue_id), venueName: d.venue_name || undefined, type: typeOf(b.kind),
    date: b.booking_date, time: hm(b.start_time), table: tableNumber,
    people: b.guests_count, guestTier: b.kind === "hall_event" ? `${b.guests_count} kishi` : undefined,
    receipt: b.receipt_number, code: b.ticket_code, qr: d.qr_token, status: b.status,
    amount: toNum(b.deposit_amount), total: toNum(b.total_amount),
    name: b.contact_name, phone: b.contact_phone,
    items: d.items.map((i) => ({ id: String(i.menu_item_id), name: i.name_snapshot, qty: i.quantity, price: toNum(i.unit_price) })),
    services: d.services.map((s) => s.name_snapshot),
  };
};

/** Bekor qilingan / muddati o'tgan bronlar "kelgusi" hisoblanmaydi */
export const isActive = (b: Booking) => !b.status || ["pending", "confirmed", "checked_in"].includes(b.status);
export const STATUS_TEXT: Record<BookingStatus, string> = {
  pending: "Tasdiqlash kutilmoqda", confirmed: "Band qilish tasdiqlandi", checked_in: "Tashrif qayd etildi",
  completed: "Yakunlangan", cancelled: "Bekor qilingan", no_show: "Kelinmadi", expired: "Muddati o‘tgan",
};

/** Foydalanuvchining barcha bronlari (chek raqami bilan) */
export async function fetchBookings(): Promise<Booking[]> {
  const list = await api<BListItem[]>("/v1/bookings");
  const details = await Promise.all(list.map((b) => api<BDetail>(`/v1/bookings/${b.id}`).catch(() => null)));
  return list.map((b, i) => {
    const d = details[i];
    return d ? { ...fromList(b), ...fromDetail(d, b.table_number ?? undefined), venueName: b.venue_name } : fromList(b);
  });
}

export async function fetchBooking(id: string): Promise<Booking | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const d = await api<BDetail>(`/v1/bookings/${id}`);
    const b = fromDetail(d);
    if (!b.venueName || b.table === undefined) {
      const row = (await api<BListItem[]>("/v1/bookings").catch(() => [])).find((x) => x.id === d.booking.id);
      if (row) { b.venueName = row.venue_name; b.table = row.table_number ?? undefined; }
    }
    return b;
  } catch { return null; }
}

export const cancelBooking = (id: string, reason?: string) =>
  api(`/v1/bookings/${id}/cancel`, { method: "POST", body: { reason: reason ?? null } });

/** "19:00" + soat → "21:00" (kun oxiridan oshmaydi) */
export function addHours(time: string, h: number) {
  const [hh, mm] = time.split(":").map(Number);
  const end = Math.min(hh * 60 + mm + h * 60, 23 * 60 + 59);
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}
/** Restoran broni davomiyligi (backend stol bandligini shu oraliq bo'yicha tekshiradi) */
export const TABLE_HOURS = 2;
/** To'yxona tadbiri davomiyligi */
export const HALL_HOURS = 5;

export type FreeTable = { id: number; number: number; seats: number };
/** Tanlangan sana va vaqtda bo'sh stollar */
export async function freeTables(venueId: string, date: string, time: string, people?: number): Promise<FreeTable[]> {
  const list = await api<{ id: number; number: number; seats: number }[]>(`/v1/venues/${venueId}/tables`, {
    auth: false,
    query: { booking_date: date, start_time: time, end_time: addHours(time, TABLE_HOURS), min_seats: people || undefined },
  });
  return list.sort((a, b) => a.number - b.number);
}

/** To'yxonaning band kunlari */
export async function blockedDates(venueId: string, from: string, to: string): Promise<Set<string>> {
  const r = await api<{ dates: string[] }>(`/v1/venues/${venueId}/availability`, { auth: false, query: { date_from: from, date_to: to } });
  return new Set(r.dates);
}

export async function createTableBooking(p: {
  venueId: string; date: string; time: string; people: number; tableId: number; name: string; phone: string;
  items: { id: string; qty: number }[]; note?: string;
}): Promise<Booking> {
  const d = await api<BDetail>("/v1/bookings/table", {
    method: "POST",
    body: {
      venue_id: Number(p.venueId), booking_date: p.date, start_time: p.time, end_time: addHours(p.time, TABLE_HOURS),
      guests_count: p.people, contact_name: p.name, contact_phone: p.phone, note: p.note ?? null, table_id: p.tableId,
      items: p.items.filter((i) => /^\d+$/.test(i.id)).map((i) => ({ menu_item_id: Number(i.id), quantity: i.qty })),
      services: [],
    },
  });
  return fromDetail(d);
}

type BService = { id: number; slug: string; name: string; price: string; price_unit: string; is_active: boolean };
/** Muassasa qo'shimcha xizmatlari (dasturxon va h.k.) */
export const venueServices = (v: Pick<VenueDetails, "id" | "groupId">) =>
  api<BService[]>(`/v1/venues/${v.id}/services`, { auth: false, query: { group_id: v.groupId } }).catch(() => [] as BService[]);

export async function createHallBooking(p: {
  v: Pick<VenueDetails, "id" | "groupId">; date: string; time: string; guests: number; name: string; phone: string; catering: boolean;
}): Promise<Booking> {
  // "Tayyor dasturxon" tanlansa — muassasaning dasturxon xizmati (premium bo'lsa o'sha) qo'shiladi
  let serviceIds: number[] = [];
  if (p.catering) {
    const list = (await venueServices(p.v)).filter((s) => s.is_active && s.slug.startsWith("dasturxon"));
    const pick = list.find((s) => s.slug === "dasturxon_premium") ?? list[0];
    if (pick) serviceIds = [pick.id];
  }
  const d = await api<BDetail>("/v1/bookings/hall", {
    method: "POST",
    body: {
      venue_id: Number(p.v.id), booking_date: p.date, start_time: p.time, end_time: addHours(p.time, HALL_HOURS),
      guests_count: p.guests, contact_name: p.name, contact_phone: p.phone, note: null,
      services: serviceIds.map((id) => ({ venue_service_id: id, quantity: 1 })), venue_service_ids: serviceIds,
    },
  });
  return fromDetail(d);
}

/** Bron kartasi uchun muassasa ma'lumotlari (rasm, telefon, manzil) — bir sahifada bir marta yuklanadi */
const venueCache = new Map<string, Promise<VenueDetails | null>>();
export function bookingVenue(b: Pick<Booking, "type" | "venueId">) {
  const key = `${b.type}:${b.venueId}`;
  if (!venueCache.has(key)) venueCache.set(key, getVenue(b.type, b.venueId));
  return venueCache.get(key)!;
}
/** Bron kartasidagi kichik rasm: muassasa rasmi bo'lsa o'sha, aks holda avvalgi namunaviy rasm */
export const bookingThumb = (b: Pick<Booking, "type">, v?: VenueDetails | null) =>
  v && v.gallery.length && !v.gallery[0].startsWith("/venue/") ? v.gallery[0] : b.type === "toyxona" ? "/venue/hall-card.webp" : "/venue/rest-one-thumb.webp";
