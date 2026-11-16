// Kirish / ro'yxatdan o'tish — backend `/v1/auth/*`.
// SMS kod hozircha backendda yo'q: ekrandagi kod bosqichi namunaviy, undan keyin shu funksiyalar chaqiriladi.
import { api, readTokens, saveTokens, type Tokens } from "./client";

export type PhoneCheckResult = { phone: string; registered: boolean; password_required: boolean };

/** "+998901234567" yoki "901234567" → "+998901234567" */
export const fullPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("998") ? `+${d}` : `+998${d.slice(-9)}`;
};

export const phoneCheck = (phone: string) =>
  api<PhoneCheckResult>("/v1/auth/phone-check", { method: "POST", auth: false, body: { phone: fullPhone(phone) } });

export async function login(phone: string, password?: string) {
  const t = await api<Tokens>("/v1/auth/login", { method: "POST", auth: false, body: { phone: fullPhone(phone), password: password || null } });
  saveTokens(t);
  return t;
}

/** Ism-familiya bitta maydonda kiritiladi — birinchi so'z ism, qolgani familiya */
export const splitName = (name: string) => {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  return { first_name: first, last_name: rest.join(" ") || first };
};

export async function register(phone: string, name: string, district_id?: number | null) {
  const t = await api<Tokens>("/v1/auth/register", {
    method: "POST", auth: false,
    body: { phone: fullPhone(phone), ...splitName(name), district_id: district_id ?? null },
  });
  saveTokens(t);
  return t;
}

/** Hodim (login + parol) sifatida kirish */
export async function staffLogin(loginName: string, password: string) {
  const t = await api<Tokens>("/v1/auth/staff-login", { method: "POST", auth: false, body: { login: loginName, password } });
  saveTokens(t);
  return t;
}

export async function logoutRemote() {
  const t = readTokens();
  if (t?.refresh_token) await api("/v1/auth/logout", { method: "POST", body: { refresh_token: t.refresh_token } }).catch(() => {});
  saveTokens(null);
}
