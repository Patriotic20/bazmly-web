"use client";

import { useEffect, useState } from "react";

export const USER_KEY = "bazmly:user";

// Foydalanuvchi profili (backend ulanguncha localStorage'da). Rasm — 256px gacha kichraytirilgan data URL.
export type User = { name?: string; phone?: string; avatar?: string };
const EVT = "bazmly:user-changed";

export function readUser(): User {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? "{}") ?? {}; } catch { return {}; }
}
export function saveUser(patch: User) {
  const next = { ...readUser(), ...patch };
  try { localStorage.setItem(USER_KEY, JSON.stringify(next)); } catch { return false; }
  window.dispatchEvent(new Event(EVT));
  return true;
}
export function useUser() {
  const [u, setU] = useState<User | null>(null);
  useEffect(() => {
    const sync = () => setU(readUser());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return u;
}

/** Profilni butunlay o'chirish: foydalanuvchi, bronlar, kartalar, sozlamalar */
export function wipeAccount() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("bazmly:")).forEach((k) => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter((k) => k.startsWith("bazmly:")).forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}
export function logout() {
  try { localStorage.removeItem(USER_KEY); sessionStorage.clear(); } catch {}
}

/** Rasmni kvadrat qilib qirqib, 256px JPEG data URL qaytaradi */
export function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Rasmni o‘qib bo‘lmadi")); };
    img.src = url;
  });
}
