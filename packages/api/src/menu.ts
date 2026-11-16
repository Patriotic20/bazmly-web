"use client";

import { accountKey } from "./partner";
import { api, toNum } from "./client";
import { cacheRead, cacheWrite, ctx, uploadImage } from "./venueAdmin";
// Hamkor menyusi — backend `/v1/venue/menu/*`. O'qish keshdan (sinxron), `syncMenu()` backend'dan yangilaydi.
// Kategoriyalar backend'da tarmoq bo'yicha — quyidagi nomlar bilan bog'lanadi (yo'q bo'lsa yaratiladi).
// Backend'da taomni o'chirish yo'q — "O'chirish" taomni yashiradi (status "hidden") va ro'yxatdan olib tashlaydi.
// "Yashirin" (noaktiv) taom — `is_available: false`. Backend filial ro'yxati faqat sotuvdagi taomlarni qaytaradi,
// shu sababli shu brauzerda yaratilgan/ko'rilgan taomlar id bo'yicha alohida so'raladi (keshdagi ro'yxat).
// Taom variantlari faqat yaratishda yuboriladi (backend'da variantlarni tahrirlash yo'li yo'q).

export type Category = { id: string; label: string };
export const CATEGORIES: Category[] = [
  { id: "goshli", label: "Go‘shlik taomlar" },
  { id: "steyklar", label: "Steyklar" },
  { id: "ichimliklar", label: "Ichimliklar" },
  { id: "osh", label: "Osh" },
];
export type Variant = { name: string; price: number };
export type Dish = {
  id: string; name: string; price: number; category: string; image?: string;
  description?: string; active?: boolean; variants?: Variant[]; discount?: number;
  /** Qaysi joylarda sotiladi: "asosiy" — asosiy joy, qolganlari filial id'lari */
  branches?: string[]; createdAt?: string;
};
/** Asosiy narx: variantlar bo'lsa — eng arzoni */
export const basePrice = (d: Pick<Dish, "price" | "variants">) => (d.variants?.length ? Math.min(...d.variants.map((v) => v.price)) : d.price);
/** Chegirmadan keyingi narx */
export const finalPrice = (price: number, discount?: number) => Math.round(price * (1 - (discount ?? 0) / 100));

const KEY = "bazmly:partner:menu";
const REMOVED = "bazmly:partner:menu-removed";
const META = "bazmly:partner:menu-meta";

type BCategory = { id: number; name: string };
type BItemList = { id: number };
type BItem = {
  id: number; menu_category_id: number; name: string; description: string | null; base_price: string | null; photo_url: string | null;
  has_variants: boolean; discount_percent: string | null; is_available: boolean; status: "active" | "hidden" | "out_of_stock";
  variants: { id: number; name: string; price: string; is_active: boolean }[];
};
/** Taomning qaysi joylarda sotilishi va yaratilgan vaqti backend javobida yo'q — keshda saqlanadi */
type Meta = Record<string, { branches?: string[]; createdAt?: string }>;
const meta = () => cacheRead<Meta>(accountKey(META), {});

export function readMenu(): Dish[] {
  return cacheRead<Dish[]>(accountKey(KEY), []);
}
/** Namunaviy menyu (demo uchun) — faqat brauzer xotirasida */
export const seedDemoMenu = () => store(seed());
function store(v: Dish[]) { return cacheWrite(accountKey(KEY), v); }

const catId = (label: string) => CATEGORIES.find((c) => c.label === label)?.id;
async function categories(): Promise<BCategory[]> {
  const c = ctx();
  return c ? api<BCategory[]>("/v1/venue/menu/categories", { query: { group_id: c.groupId, venue_id: c.venueId } }) : [];
}
/** Frontend kategoriyasi → backend kategoriya id (yo'q bo'lsa yaratiladi) */
async function ensureCategory(id: string): Promise<number> {
  const c = ctx()!;
  if (/^c\d+$/.test(id)) return Number(id.slice(1));
  const label = CATEGORIES.find((x) => x.id === id)?.label ?? id;
  const found = (await categories()).find((x) => x.name === label);
  if (found) return found.id;
  const made = await api<BCategory>("/v1/venue/menu/categories", { method: "POST", query: { group_id: c.groupId, venue_id: c.venueId }, body: { name: label } });
  return made.id;
}

function toDish(i: BItem & { category_name?: string }, m: Meta): Dish {
  const variants = i.variants.filter((v) => v.is_active).map((v) => ({ name: v.name, price: toNum(v.price) }));
  return {
    id: String(i.id), name: i.name, description: i.description ?? undefined, image: i.photo_url ?? undefined,
    price: variants.length ? Math.min(...variants.map((v) => v.price)) : toNum(i.base_price),
    variants: variants.length ? variants : undefined, discount: toNum(i.discount_percent) || undefined,
    category: catId(i.category_name ?? "") ?? `c${i.menu_category_id}`,
    active: i.is_available,
    branches: m[String(i.id)]?.branches ?? ["asosiy"], createdAt: m[String(i.id)]?.createdAt,
  };
}

/** Menyuni backend'dan oladi (har bir taom tafsiloti bilan — narx va variantlar uchun) */
export async function syncMenu(): Promise<Dish[]> {
  const c = ctx();
  if (!c) return readMenu();
  const [list, cats] = await Promise.all([api<BItemList[]>("/v1/venue/menu/items", { query: { venue_id: c.venueId } }), categories()]);
  const hidden = new Set(cacheRead<string[]>(accountKey(REMOVED), []));
  const m = meta();
  const ids = [...new Set([...list.map((x) => String(x.id)), ...Object.keys(m), ...readMenu().map((d) => d.id).filter((id) => /^\d+$/.test(id))])].filter((id) => !hidden.has(id));
  const items = await Promise.all(ids.map((id) => api<BItem>(`/v1/venue/menu/items/${id}`, { query: { venue_id: c.venueId } }).catch(() => null)));
  return store(items.filter((i): i is BItem => !!i && i.status !== "hidden")
    .map((i) => toDish({ ...i, category_name: cats.find((x) => x.id === i.menu_category_id)?.name }, m)).sort((a, b) => Number(b.id) - Number(a.id)));
}

/** Taomni yaratish yoki tahrirlash; yangilangan ro'yxat qaytariladi (yangi taom — birinchi). Xatolikda istisno. */
export async function saveDish(d: Omit<Dish, "id"> & { id?: string }): Promise<Dish[]> {
  const c = ctx();
  if (!c) throw new Error("Akkaunt topilmadi");
  const q = { venue_id: c.venueId };
  const menu_category_id = await ensureCategory(d.category);
  const photo_url = await uploadImage(d.image);
  const variants = d.variants?.length ? d.variants : null;
  const common = {
    menu_category_id, name: d.name, description: d.description ?? null, photo_url,
    base_price: variants ? null : d.price, discount_percent: d.discount ?? null,
  };
  let id = d.id;
  if (id) {
    await api(`/v1/venue/menu/items/${id}`, { method: "PATCH", query: q, body: { ...common, status: "active", is_available: d.active !== false } });
  } else {
    const made = await api<BItem>("/v1/venue/menu/items", {
      method: "POST", query: q,
      body: { payload: { ...common, has_variants: !!variants }, variants: variants?.map((v, i) => ({ name: v.name, price: v.price, sort_order: i })) ?? null },
    });
    id = String(made.id);
    if (d.active === false) await api(`/v1/venue/menu/items/${id}`, { method: "PATCH", query: q, body: { is_available: false } }).catch(() => {});
  }
  // Qaysi joylarda sotiladi: "asosiy" — faol akkaunt filiali, "v12" — boshqa filial
  const venue_ids = (d.branches ?? ["asosiy"]).map((b) => (b === "asosiy" ? c.venueId : Number(b.replace(/^v/, "")))).filter((n) => Number.isFinite(n) && n > 0);
  if (venue_ids.length && (venue_ids.length > 1 || venue_ids[0] !== c.venueId)) {
    await api(`/v1/venue/menu/items/${id}/branches`, { method: "PUT", query: q, body: { venue_ids } }).catch(() => {});
  }
  const m = meta();
  cacheWrite(accountKey(META), { ...m, [id]: { branches: d.branches, createdAt: m[id]?.createdAt ?? new Date().toISOString() } });
  const list = await syncMenu();
  const mine = list.find((x) => x.id === id);
  return mine ? [mine, ...list.filter((x) => x.id !== id)] : list;
}
/** O'chirish: backend'da yashiriladi va ro'yxatdan olib tashlanadi */
export async function removeDish(id: string): Promise<Dish[]> {
  const c = ctx();
  if (c) await api(`/v1/venue/menu/items/${id}`, { method: "PATCH", query: { venue_id: c.venueId }, body: { status: "hidden", is_available: false } });
  cacheWrite(accountKey(REMOVED), [...cacheRead<string[]>(accountKey(REMOVED), []), id]);
  return store(readMenu().filter((x) => x.id !== id));
}

const IMG = { jizz: "/menu/jizz.webp", kabob: "/menu/qozon-kabob.webp", manti: "/menu/manti.webp", steyk: "/menu/steyk.webp", zal: "/menu/zal.webp" };

const BASE: [string, number, string, string | undefined][] = [
  ["Jizz", 500000, "goshli", IMG.jizz], ["Qozon kabob", 300000, "goshli", IMG.kabob], ["Manti", 100000, "goshli", IMG.manti],
  ["Steyk", 180000, "steyklar", IMG.steyk], ["Ribay steyk", 320000, "steyklar", IMG.steyk], ["Tomahawk", 500000, "steyklar", IMG.steyk],
  ["Striploin", 260000, "steyklar", IMG.steyk], ["Filet minyon", 290000, "steyklar", IMG.steyk],
  ["Osh (Plov)", 40000, "osh", IMG.kabob], ["To‘y oshi", 45000, "osh", IMG.kabob], ["Choyxona oshi", 42000, "osh", IMG.kabob],
  ["Choy (Ko‘k)", 5000, "ichimliklar", undefined], ["Choy (Qora)", 5000, "ichimliklar", undefined], ["Kompot", 15000, "ichimliklar", undefined],
  ["Limonad", 25000, "ichimliklar", undefined], ["Non", 3000, "goshli", undefined], ["Shashlik (qo‘y)", 28000, "goshli", IMG.jizz],
  ["Lag‘mon", 38000, "goshli", IMG.kabob], ["Chuchvara", 35000, "goshli", IMG.manti], ["Somsa", 12000, "goshli", IMG.manti],
];

function seed(): Dish[] {
  const out: Dish[] = BASE.map(([name, price, category, image], i) => ({ id: `d${i + 1}`, name, price, category, image, active: true }));
  const extra = ["Qozon kabob", "Jizz", "Manti", "Steyk"];
  const imgs = [IMG.kabob, IMG.jizz, IMG.manti, IMG.steyk, IMG.zal];
  for (let i = out.length; i < 86; i++) {
    const k = i % extra.length;
    out.push({ id: `d${i + 1}`, name: `${extra[k]} №${Math.floor(i / extra.length)}`, price: [100000, 180000, 300000, 500000][k], category: k === 3 ? "steyklar" : "goshli", image: imgs[i % imgs.length], active: true });
  }
  return out;
}

/** 500000 → "500 000 so‘m" */
export const som = (n: number) => `${n.toLocaleString("ru-RU").replace(/\s/g, " ")} so‘m`;
