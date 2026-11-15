"use client";

import { accountKey } from "./partner";
// Hamkor paneli: hodimlar va filiallar — backend ulanguncha brauzer xotirasida namunaviy ma'lumot.
// TODO: backend — GET/POST/PATCH/DELETE /partner/staff, GET/POST /partner/branches

export type Role = "oshpaz" | "ofitsiant" | "menejer" | "admin" | "qoriqchi" | "oshpaz-yordamchisi";
export const ROLES: { id: Role; label: string }[] = [
  { id: "oshpaz", label: "Oshpaz" },
  { id: "ofitsiant", label: "Ofitsiant" },
  { id: "menejer", label: "Menejer" },
  { id: "admin", label: "Admin" },
  { id: "qoriqchi", label: "Qo‘riqchi" },
  { id: "oshpaz-yordamchisi", label: "Oshpaz yordamchisi" },
];
export const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)?.label ?? r;

export type Staff = { id: string; name: string; phone: string; role: Role; active: boolean; avatar?: string; createdAt: string };
export type Branch = {
  id: string; name: string; address: string; lat: number; lng: number;
  from: string; to: string; phone: string; managerId?: string; createdAt: string;
};

const STAFF = "bazmly:partner:staff";
const BRANCHES = "bazmly:partner:branches";

// Figma'dagi 6 ta hodim + qolganlari namunaviy (jami 45 ta, 5 tasi noaktiv)
const FIRST: Omit<Staff, "id" | "createdAt">[] = [
  { name: "Sardor Rahimov", phone: "+998901234567", role: "menejer", active: true, avatar: "/staff/1.webp" },
  { name: "Malika Karimova", phone: "+998939876543", role: "ofitsiant", active: true, avatar: "/staff/2.webp" },
  { name: "Bekzod Aliyev", phone: "+998971112233", role: "admin", active: true, avatar: "/staff/3.webp" },
  { name: "Aziza Umarova", phone: "+998994567890", role: "ofitsiant", active: true, avatar: "/staff/4.webp" },
  { name: "Rustam Tursunov", phone: "+998912345678", role: "oshpaz", active: true, avatar: "/staff/5.webp" },
  { name: "Dilnoza Aliyeva", phone: "+998905554433", role: "ofitsiant", active: true, avatar: "/staff/6.webp" },
];
const NAMES = ["Azizbek", "Jahongir", "Shoxrux", "Nigora", "Kamola", "Otabek", "Feruza", "Doston", "Gulnora", "Sanjar", "Zarina", "Akmal", "Muxlisa", "Behruz", "Lola"];
const SURNAMES = ["Rahimov", "Yo‘ldoshev", "Nazarov", "Qosimov", "Ergashev", "Xolmatov", "Sobirov", "Ismoilov", "Jo‘rayev"];
const female = (n: string) => /a$/.test(n);

function seed(): Staff[] {
  const out: Staff[] = FIRST.map((s, i) => ({ ...s, id: `s${i + 1}`, createdAt: "2026-09-01" }));
  const roles: Role[] = ["ofitsiant", "ofitsiant", "oshpaz", "oshpaz-yordamchisi", "ofitsiant", "qoriqchi", "menejer", "admin"];
  for (let i = out.length; i < 45; i++) {
    const n = NAMES[(i * 7) % NAMES.length], s = SURNAMES[(i * 5) % SURNAMES.length];
    out.push({
      id: `s${i + 1}`, name: `${n} ${s}${female(n) ? "a" : ""}`,
      phone: `+9989${(i % 9) + 1}${String(1000000 + i * 104729).slice(-7)}`,
      role: roles[i % roles.length], active: i < 40, createdAt: "2026-09-01",
    });
  }
  // Figma: Azizbek Rahimov — menejer (filial formasidagi namuna)
  out[6] = { ...out[6], name: "Azizbek Rahimov", role: "menejer", active: true };
  return out;
}

function load<T>(key: string, init: () => T): T {
  try { const raw = localStorage.getItem(accountKey(key)); if (raw) return JSON.parse(raw); } catch {}
  const v = init();
  try { localStorage.setItem(accountKey(key), JSON.stringify(v)); } catch {}
  return v;
}
function store(key: string, v: unknown) { try { localStorage.setItem(accountKey(key), JSON.stringify(v)); } catch {} }

export const readStaff = () => load<Staff[]>(STAFF, seed);
export function saveStaff(s: Omit<Staff, "id" | "createdAt"> & { id?: string }) {
  const list = readStaff();
  const i = s.id ? list.findIndex((x) => x.id === s.id) : -1;
  const next = i >= 0
    ? list.map((x, j) => (j === i ? { ...x, ...s, id: x.id } : x))
    : [{ ...s, id: `s${Date.now()}`, createdAt: new Date().toISOString() } as Staff, ...list];
  store(STAFF, next);
  return next;
}
export function removeStaff(id: string) {
  const next = readStaff().filter((x) => x.id !== id);
  store(STAFF, next);
  return next;
}
export const phoneTaken = (phone: string, exceptId?: string) => readStaff().some((x) => x.phone === phone && x.id !== exceptId);

export const readBranches = () => load<Branch[]>(BRANCHES, () => []);
export function addBranch(b: Omit<Branch, "id" | "createdAt">) {
  const next = [...readBranches(), { ...b, id: `b${Date.now()}`, createdAt: new Date().toISOString() }];
  store(BRANCHES, next);
  return next;
}

/** "+998901234567" → "+998 90 123 45 67" */
export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, "").replace(/^998/, "");
  return `+998 ${[d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ")}`;
};
