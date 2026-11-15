// Saqlangan kartalar — to'liq raqam saqlanmaydi, faqat oxirgi 4 raqam (tokenlash backend'da bo'ladi)
export type CardBrand = "humo" | "uzcard" | "visa" | "mastercard" | "card";
export type SavedCard = { last4: string; holder: string; exp: string; brand?: CardBrand };
const CARDS_KEY = "bazmly:cards";
const LEGACY_KEY = "bazmly:card";

export function cardBrand(digits: string): CardBrand {
  if (digits.startsWith("9860")) return "humo";
  if (digits.startsWith("8600") || digits.startsWith("5614")) return "uzcard";
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  return "card";
}

export function readCards(): SavedCard[] {
  try {
    const list: SavedCard[] = JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]");
    if (list.length) return list;
    const legacy = JSON.parse(sessionStorage.getItem(LEGACY_KEY) ?? "null");
    return legacy ? [legacy] : [];
  } catch { return []; }
}
const same = (a: SavedCard, b: SavedCard) => a.last4 === b.last4 && a.exp === b.exp;
/** Asosiy (birinchi) karta */
export function readCard(): SavedCard | null { return readCards()[0] ?? null; }
/** Kartani qo'shadi va asosiy qiladi */
export function saveCard(c: SavedCard) {
  const list = [c, ...readCards().filter((x) => !same(x, c))];
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(list)); sessionStorage.removeItem(LEGACY_KEY); } catch {}
}
export function removeCard(c: SavedCard) {
  const list = readCards().filter((x) => !same(x, c));
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(list)); sessionStorage.removeItem(LEGACY_KEY); } catch {}
  return list;
}

export const formatCardNumber = (digits: string) => digits.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

export function formatExp(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function expValid(exp: string, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export const formatUzs = (n: number) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")} UZS`;

// Promokodlar (vaqtinchalik — backend'da tekshiriladi)
export const PROMOCODES: Record<string, number> = { BAZMLY: 10 };

export const DEPOSIT_PER_PERSON = 50000;

export const BOOKINGS_KEY = "bazmly:bookings";
