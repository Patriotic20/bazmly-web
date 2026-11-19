// Kirish / ro'yxatdan o'tish — backend `/v1/auth/*`.
// Login — telefon raqami, parol bilan (SMS kod ishlatilmaydi).
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

export async function register(phone: string, name: string, district_id?: number | null, password?: string) {
  const t = await api<Tokens>("/v1/auth/register", {
    method: "POST", auth: false,
    body: { phone: fullPhone(phone), ...splitName(name), district_id: district_id ?? null, password: password || null },
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

// ---------- Parol ----------
export const PASSWORD_MIN = 8;
/** Backend talabi: 8–128 belgi */
export const passwordError = (p: string) =>
  p.length < PASSWORD_MIN ? `Parol kamida ${PASSWORD_MIN} ta belgidan iborat bo‘lsin` : p.length > 128 ? "Parol juda uzun" : null;

/** Parol o'rnatish yoki o'zgartirish. Backend shundan so'ng barcha sessiyalarni yopadi. */
export const setPassword = (newPassword: string, currentPassword?: string) =>
  api("/v1/auth/password", { method: "POST", body: { current_password: currentPassword || null, new_password: newPassword } });

/**
 * Telefon + parol bilan kirish. Avval parolsiz yaratilgan akkaunt bo'lsa — kiritilgan parol
 * shu akkauntning paroli sifatida o'rnatiladi (parol o'rnatilgach sessiya yopiladi, shuning uchun qayta kiriladi).
 */
export async function loginWithPassword(phone: string, password: string, check?: PhoneCheckResult) {
  const c = check ?? (await phoneCheck(phone));
  if (c.password_required) return login(phone, password);
  await login(phone);
  await setPassword(password);
  return login(phone, password);
}

/** Ro'yxatdan o'tish bosqichlari orasida parol faqat xotirada turadi (brauzer xotirasiga yozilmaydi) */
let pendingPassword: string | null = null;
export const holdPassword = (p: string | null) => { pendingPassword = p; };
export const heldPassword = () => pendingPassword;
