"use client";

import { PROMOCODES } from "./payment";

// Voucherlar (namunaviy — backend ulanganda API'dan keladi). Amal qilish muddati birinchi ko'rilganda belgilanadi.
export type Voucher = { code: string; amount: number; title: string; expiresAt: number; used?: boolean };
const KEY = "bazmly:vouchers";
const S = 1000, H = 3600 * S, D = 24 * H;

function seed(now: number): Voucher[] {
  return [
    { code: "BAZMLY50E", amount: 80_000, title: "-80 000 so‘m oldindan buyurtma uchun promokod", expiresAt: now + 5 * H + 35 * 60 * S + 49 * S },
    { code: "BAZMLY80K", amount: 80_000, title: "-80 000 so‘m oldindan buyurtma uchun promokod", expiresAt: now + 21 * D },
    { code: "BAZMLY30K", amount: 30_000, title: "-30 000 so‘m oldindan buyurtma uchun promokod", expiresAt: now + 9 * H + 12 * 60 * S },
    { code: "BAZMLY100", amount: 100_000, title: "-100 000 so‘m oldindan buyurtma uchun promokod", expiresAt: now + 17 * H + 3 * 60 * S },
  ];
}
export function readVouchers(): Voucher[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    const s = seed(Date.now()); localStorage.setItem(KEY, JSON.stringify(s)); return s;
  } catch { return []; }
}
export function markVoucherUsed(code: string) {
  try { localStorage.setItem(KEY, JSON.stringify(readVouchers().map((v) => (v.code === code ? { ...v, used: true } : v)))); } catch {}
}
export const voucherActive = (v: Voucher, now = Date.now()) => !v.used && v.expiresAt > now;

/** Promokod: foizli (PROMOCODES) yoki voucher (so'mda). Topilmasa — null */
export function promoInfo(raw: string): { code: string; pct: number; amount: number } | null {
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  if (PROMOCODES[code]) return { code, pct: PROMOCODES[code], amount: 0 };
  const v = readVouchers().find((x) => x.code === code);
  return v && voucherActive(v) ? { code, pct: 0, amount: v.amount } : null;
}
