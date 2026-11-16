"use client";

import { useEffect, useState } from "react";
import { api, isAuthed, saveTokens } from "./client";
import { logoutRemote } from "./auth";

export const USER_KEY = "bazmly:user";

// Foydalanuvchi profili: backend `/v1/users/me` dan olinadi va tez ko'rsatish uchun localStorage'da nusxasi turadi.
// Rasm — 256px gacha kichraytirilgan data URL (backendda mijoz uchun rasm yuklash yo'q — faqat shu qurilmada).
export type User = { name?: string; phone?: string; avatar?: string; id?: number; districtId?: number | null };

export type BackendUser = {
  id: number; first_name: string; last_name: string; phone: string | null; email: string | null;
  avatar_url: string | null; district_id: number | null; role: string; status: string; theme: string;
};
const fullName = (u: Pick<BackendUser, "first_name" | "last_name">) =>
  u.last_name && u.last_name !== u.first_name ? `${u.first_name} ${u.last_name}` : u.first_name;
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

/** Backenddagi profilni olib, mahalliy nusxani yangilaydi */
export async function syncMe(): Promise<User | null> {
  if (!isAuthed()) return null;
  const u = await api<BackendUser>("/v1/users/me");
  const cur = readUser();
  saveUser({ id: u.id, name: fullName(u), phone: u.phone ?? cur.phone, districtId: u.district_id, avatar: u.avatar_url ?? cur.avatar });
  return readUser();
}

/** Profilni tahrirlash — ism va tuman backendga yoziladi */
export async function updateProfile(p: { name?: string; districtId?: number | null }) {
  const body: Record<string, unknown> = {};
  if (p.name) {
    const [first = "", ...rest] = p.name.trim().split(/\s+/);
    body.first_name = first;
    body.last_name = rest.join(" ") || first;
  }
  if (p.districtId !== undefined) body.district_id = p.districtId;
  if (isAuthed() && Object.keys(body).length) await api<BackendUser>("/v1/users/me", { method: "PATCH", body });
}

/** Akkauntni backendda o'chiradi va mahalliy ma'lumotlarni tozalaydi */
export async function deleteAccount() {
  if (isAuthed()) await api("/v1/users/me", { method: "DELETE" }).catch(() => {});
  wipeAccount();
}

/** Profilni butunlay o'chirish: foydalanuvchi, bronlar, kartalar, sozlamalar */
export function wipeAccount() {
  saveTokens(null);
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("bazmly:")).forEach((k) => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter((k) => k.startsWith("bazmly:")).forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}
export function logout() {
  void logoutRemote();
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
