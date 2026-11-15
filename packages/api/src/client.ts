// Backend bilan ishlash uchun yagona kirish nuqtasi.
// Hozircha ma'lumotlar brauzer xotirasida (localStorage/sessionStorage) saqlanadi —
// har bir modul (booking, payment, user, vouchers, venues, regions) o'z funksiyalari orqali ishlaydi.
// Backend tayyor bo'lganda o'sha funksiyalarning ichi shu `api` chaqiruvlariga almashtiriladi,
// sahifalar va komponentlar o'zgarmaydi.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; token?: string | null };

export async function api<T>(path: string, { body, token, headers, ...init }: Options = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, "NEXT_PUBLIC_API_URL sozlanmagan");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new ApiError(res.status, (data as { message?: string })?.message ?? res.statusText, data);
  return data as T;
}

/** Backend ulanganmi — modullar shunga qarab localStorage yoki API'ni tanlaydi */
export const hasBackend = () => Boolean(API_URL);
