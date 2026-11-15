"use client";

import { accountKey } from "./partner";
// Hamkor menyusi — backend ulanguncha brauzer xotirasida namunaviy ma'lumot.
// TODO: backend — GET/POST/PATCH/DELETE /partner/menu

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
  // Figma: "Menu (86 mahsulot)" — qolganlari namunaviy taomlar
  const extra = ["Qozon kabob", "Jizz", "Manti", "Steyk"];
  const imgs = [IMG.kabob, IMG.jizz, IMG.manti, IMG.steyk, IMG.zal];
  for (let i = out.length; i < 86; i++) {
    const k = i % extra.length;
    out.push({ id: `d${i + 1}`, name: `${extra[k]} №${Math.floor(i / extra.length)}`, price: [100000, 180000, 300000, 500000][k], category: k === 3 ? "steyklar" : "goshli", image: imgs[i % imgs.length], active: true });
  }
  return out;
}

/** Yangi hamkorning menyusi bo'sh — taomlar "Menyuni kiritish" orqali qo'shiladi */
export function readMenu(): Dish[] {
  try { const raw = localStorage.getItem(accountKey(KEY)); if (raw) return JSON.parse(raw); } catch {}
  return [];
}
/** Namunaviy menyu (demo uchun): 86 ta taom */
export const seedDemoMenu = () => store(seed());
function store(v: Dish[]) { try { localStorage.setItem(accountKey(KEY), JSON.stringify(v)); } catch {} return v; }
export function saveDish(d: Omit<Dish, "id"> & { id?: string }) {
  const list = readMenu();
  return store(d.id ? list.map((x) => (x.id === d.id ? { ...x, ...d, id: x.id } : x)) : [{ ...d, id: `d${Date.now()}`, createdAt: new Date().toISOString() }, ...list]);
}
export const removeDish = (id: string) => store(readMenu().filter((x) => x.id !== id));

/** 500000 → "500 000 so‘m" */
export const som = (n: number) => `${n.toLocaleString("ru-RU").replace(/\s/g, " ")} so‘m`;
