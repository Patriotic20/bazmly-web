// Backend bilan ishlash uchun yagona kirish nuqtasi.
// Brauzerdan so'rovlar Next.js orqali proksilanadi (`/bapi/*` → backend `/api/*`, next.config.ts dagi rewrites) —
// shu sababli backend CORS ro'yxatiga sayt domenini qo'shish shart emas.
// Serverda (server komponentlar) to'g'ridan-to'g'ri backend manziliga murojaat qilinadi.

/** Backend manzili (oxirida `/api` yo'q). Railway'da `BAZMLY_API_ORIGIN` bilan almashtirish mumkin. */
export const API_ORIGIN = (process.env.BAZMLY_API_ORIGIN ?? process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://bazmly-backend-production.up.railway.app").replace(/\/$/, "");

/** API yo'llari `/v1/...` ko'rinishida beriladi */
export const API_URL = typeof window === "undefined" ? `${API_ORIGIN}/api` : "/bapi";

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown, public code?: string) {
    super(message);
  }
}

// ---------- Tokenlar (brauzer xotirasida) ----------
const AUTH_KEY = "bazmly:auth";
export type Tokens = { access_token: string; refresh_token: string; user_id?: number; profile_completed?: boolean; must_change_password?: boolean };
export const AUTH_EVENT = "bazmly:auth-changed";

export function readTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) ?? "null"); } catch { return null; }
}
export function saveTokens(t: Tokens | null) {
  if (typeof window === "undefined") return;
  try {
    if (t) localStorage.setItem(AUTH_KEY, JSON.stringify(t));
    else localStorage.removeItem(AUTH_KEY);
  } catch {}
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export const isAuthed = () => Boolean(readTokens()?.access_token);

let refreshing: Promise<boolean> | null = null;
/** Access token muddati tugaganda refresh token bilan yangilaydi (bir vaqtda faqat bitta so'rov) */
function refreshTokens(): Promise<boolean> {
  if (refreshing) return refreshing;
  const t = readTokens();
  if (!t?.refresh_token) return Promise.resolve(false);
  refreshing = fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: t.refresh_token }),
  })
    .then(async (r) => {
      if (!r.ok) { saveTokens(null); return false; }
      saveTokens({ ...t, ...(await r.json()) });
      return true;
    })
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>;
type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Bearer token qo'shilsinmi (standart: token bo'lsa qo'shiladi) */
  auth?: boolean;
  query?: Query;
};

function qs(q?: Query) {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => p.append(k, String(x)));
    else p.append(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function api<T>(path: string, { body, auth = true, query, headers, ...init }: Options = {}, retried = false): Promise<T> {
  const token = auth ? readTokens()?.access_token : undefined;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_URL}${path}${qs(query)}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  if (res.status === 401 && token && !retried && (await refreshTokens())) return api<T>(path, { body, auth, query, headers, ...init }, true);
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  if (!res.ok) {
    const d = data as { message?: string; code?: string } | undefined;
    throw new ApiError(res.status, d?.message ?? res.statusText, data, d?.code);
  }
  return data as T;
}

/** Backend ulanganmi — har doim ha (manzil standart qiymatga ega) */
export const hasBackend = () => true;

/** Backend narxlari "150000.00" ko'rinishida keladi */
export const toNum = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? 0 : Number(v));

/** Xatoni foydalanuvchiga ko'rsatish uchun matnga aylantiradi */
export const errorText = (e: unknown, fallback = "Xatolik yuz berdi, qayta urinib ko‘ring") =>
  e instanceof ApiError && e.message && e.status !== 0 && e.status < 500 ? e.message : fallback;
