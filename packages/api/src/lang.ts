"use client";

// Interfeys tili — hozircha ilova faqat o'zbek tilida; tanlov saqlanadi (tarjimalar keyin qo'shiladi).
// TODO: backend — foydalanuvchi profilida til

export type Lang = "uz" | "en" | "ru";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "uz", label: "O‘zbek tili" },
  { id: "en", label: "Ingliz tili" },
  { id: "ru", label: "Rus tili" },
];
/** Hozir to'liq tarjima qilingan tillar */
export const READY_LANGS: Lang[] = ["uz"];
const KEY = "bazmly:lang";

export function readLang(): Lang {
  try { const v = localStorage.getItem(KEY); if (v === "uz" || v === "en" || v === "ru") return v; } catch {}
  return "uz";
}
export function saveLang(l: Lang) { try { localStorage.setItem(KEY, l); } catch {} }
