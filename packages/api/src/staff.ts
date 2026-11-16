"use client";

import { accountKey, readAccount } from "./partner";
import { api } from "./client";
import { cacheRead, cacheWrite, ctx, fromWorkingDays, nearestDistrict, putWorkingHours, staffRoles, type BVenue, type BVenueDetail } from "./venueAdmin";
// Hamkor paneli: hodimlar va filiallar — backend `/v1/venue/staff`, `/v1/venue/venues`.
// O'qish keshdan (sinxron), `syncStaff()` / `syncBranches()` backend'dan yangilaydi.
// Backend hodim ro'yxatida telefon yo'q — telefon qo'shilgan paytda keshda saqlanadi.
// Backend'da hodimni o'chirish yo'q — "O'chirish" hodimni noaktiv qiladi va ro'yxatdan yashiradi.

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

export type Staff = {
  id: string; name: string; phone: string; role: Role; active: boolean; avatar?: string; createdAt: string;
  /** Backend: foydalanuvchi id, filial (null — butun tarmoq), kirish ma'lumotlari (faqat qo'shilganda bir marta beriladi) */
  userId?: number; venueId?: number | null; login?: string; tempPassword?: string;
};
export type Branch = {
  id: string; name: string; address: string; lat: number; lng: number;
  from: string; to: string; phone: string; managerId?: string; createdAt: string;
  venueId?: number;
};
/** Backend rol slug'i ↔ frontend lavozimi */
const ROLE_SLUG: Record<Role, string> = { oshpaz: "cook", ofitsiant: "waiter", menejer: "manager", admin: "admin", qoriqchi: "security", "oshpaz-yordamchisi": "cook_assistant" };
const roleFromSlug = (slug: string) => (Object.keys(ROLE_SLUG) as Role[]).find((r) => ROLE_SLUG[r] === slug);

const STAFF = "bazmly:partner:staff";
const BRANCHES = "bazmly:partner:branches";
const REMOVED = "bazmly:partner:staff-removed";

export const readStaff = () => cacheRead<Staff[]>(accountKey(STAFF), []);
const writeStaff = (v: Staff[]) => cacheWrite(accountKey(STAFF), v);
const removedIds = () => cacheRead<string[]>(accountKey(REMOVED), []);

type BStaff = { id: number; venue_id: number | null; staff_role_id: number; role_name: string; is_active: boolean; user: { id: number; first_name: string; last_name: string; avatar_url: string | null } };

/** Hodimlarni backend'dan oladi (egasi ro'yxatga kirmaydi) */
export async function syncStaff(): Promise<Staff[]> {
  const c = ctx();
  if (!c) return readStaff();
  const [list, roles] = await Promise.all([api<BStaff[]>("/v1/venue/staff", { query: { group_id: c.groupId } }), staffRoles()]);
  const prev = new Map(readStaff().map((x) => [x.id, x]));
  const venues = new Set([c.venueId, ...readBranches().map((b) => b.venueId)]);
  const hidden = new Set(removedIds());
  const out: Staff[] = [];
  for (const b of list) {
    const role = roleFromSlug(roles.find((r) => r.id === b.staff_role_id)?.slug ?? "");
    if (!role || (b.venue_id !== null && !venues.has(b.venue_id))) continue;
    const id = String(b.id);
    if (hidden.has(id)) continue;
    const old = prev.get(id);
    out.push({
      id, name: `${b.user.first_name} ${b.user.last_name}`.trim(), phone: old?.phone ?? "", role, active: b.is_active,
      avatar: b.user.avatar_url ?? old?.avatar, createdAt: old?.createdAt ?? "", userId: b.user.id, venueId: b.venue_id,
      login: old?.login, tempPassword: old?.tempPassword,
    });
  }
  return writeStaff(out);
}

const nameParts = (n: string) => { const [first = "", ...rest] = n.trim().split(/\s+/); return { first_name: first, last_name: rest.join(" ") || first }; };

/** Hodim qo'shish (taklifnoma) yoki tahrirlash. Yangilangan ro'yxat qaytariladi; xatolikda istisno. */
export async function saveStaff(s: Omit<Staff, "id" | "createdAt"> & { id?: string }): Promise<Staff[]> {
  const c = ctx();
  if (!c) throw new Error("Akkaunt topilmadi");
  const roles = await staffRoles();
  const role = roles.find((r) => r.slug === ROLE_SLUG[s.role]);
  if (!role) throw new Error("Lavozim topilmadi");
  const q = { group_id: c.groupId, venue_id: c.venueId };
  if (s.id) {
    await api(`/v1/venue/staff/${s.id}`, { method: "PATCH", query: { venue_id: c.venueId }, body: { ...nameParts(s.name), staff_role_id: role.id, is_active: s.active } });
    const list = await syncStaff();
    return writeStaff(list.map((x) => (x.id === s.id ? { ...x, phone: s.phone } : x)));
  }
  const before = new Set(readStaff().map((x) => x.id));
  const inv = await api<{ login: string; temporary_password: string | null }>("/v1/venue/staff/invitations", {
    method: "POST", query: q,
    body: { full_name: s.name, phone: s.phone, staff_role_id: role.id, venue_id: role.scope === "venue" ? c.venueId : null },
  });
  let list = await syncStaff();
  const added = list.filter((x) => !before.has(x.id));
  const mine = added.length === 1 ? added[0] : added.find((x) => x.name === s.name);
  if (mine) {
    if (!s.active) await api(`/v1/venue/staff/${mine.id}/active`, { method: "PATCH", query: { venue_id: c.venueId, is_active: false } }).catch(() => {});
    list = writeStaff(list.map((x) => (x.id === mine.id ? { ...x, phone: s.phone, active: s.active, createdAt: new Date().toISOString(), login: inv.login, tempPassword: inv.temporary_password ?? undefined } : x)));
  }
  return list;
}
/** O'chirish: backend'da noaktiv qilinadi va ro'yxatdan yashiriladi */
export async function removeStaff(id: string): Promise<Staff[]> {
  const c = ctx();
  if (c) await api(`/v1/venue/staff/${id}/active`, { method: "PATCH", query: { venue_id: c.venueId, is_active: false } });
  cacheWrite(accountKey(REMOVED), [...removedIds(), id]);
  return writeStaff(readStaff().filter((x) => x.id !== id));
}
/** Faollikni o'zgartirish */
export async function setStaffActive(id: string, active: boolean): Promise<Staff[]> {
  const c = ctx();
  if (c) await api(`/v1/venue/staff/${id}/active`, { method: "PATCH", query: { venue_id: c.venueId, is_active: active } });
  return writeStaff(readStaff().map((x) => (x.id === id ? { ...x, active } : x)));
}
export const phoneTaken = (phone: string, exceptId?: string) => readStaff().some((x) => x.phone === phone && x.id !== exceptId);

// ---------- Filiallar ----------
export const readBranches = () => cacheRead<Branch[]>(accountKey(BRANCHES), []);

/** Faol akkaunt turidagi qolgan filiallar (akkauntning o'zi — "Asosiy" — ro'yxatga kirmaydi) */
export async function syncBranches(): Promise<Branch[]> {
  const c = ctx(); const acc = readAccount();
  if (!c || !acc) return readBranches();
  const venues = await api<BVenue[]>("/v1/venue/venues", { query: { group_id: c.groupId } });
  const prev = new Map(readBranches().map((b) => [b.id, b]));
  const mine = venues.filter((v) => v.venue_type === acc.kind && v.id !== c.venueId).sort((a, b) => a.id - b.id);
  const out = await Promise.all(mine.map(async (v): Promise<Branch> => {
    const det = await api<BVenueDetail>(`/v1/venues/${v.id}`).catch(() => null);
    const wh = det ? fromWorkingDays(det.working_hours) : {};
    const old = prev.get(`v${v.id}`);
    return {
      id: `v${v.id}`, venueId: v.id, name: v.name,
      address: [v.street, v.house_number !== "-" ? v.house_number : ""].filter(Boolean).join(" "),
      lat: Number(v.latitude), lng: Number(v.longitude), from: wh.hours?.from ?? "09:00", to: wh.hours?.to ?? "23:00",
      phone: v.phone, managerId: old?.managerId, createdAt: old?.createdAt ?? "",
    };
  }));
  return cacheWrite(accountKey(BRANCHES), out);
}

export async function addBranch(b: Omit<Branch, "id" | "createdAt">): Promise<Branch[]> {
  const c = ctx(); const acc = readAccount();
  if (!c || !acc || acc.kind === "barchasi") throw new Error("Akkaunt topilmadi");
  const district_id = await nearestDistrict(b.lat, b.lng);
  const manager = readStaff().find((s) => s.id === b.managerId);
  const v = await api<BVenue>("/v1/venue/venues", {
    method: "POST", query: { group_id: c.groupId },
    body: {
      district_id, street: b.address, house_number: "-", latitude: Number(b.lat.toFixed(6)), longitude: Number(b.lng.toFixed(6)),
      phone: b.phone, name: b.name, venue_type: acc.kind, manager_user_id: manager?.userId ?? null,
    },
  });
  const q = { venue_id: v.id };
  await putWorkingHours(v.id, { from: 0, to: 6 }, { from: b.from, to: b.to });
  for (const step of ["tables-done", "services-done", "media-done"]) await api(`/v1/venue/venues/${v.id}/onboarding/${step}`, { method: "PATCH", query: q }).catch(() => {});
  await api(`/v1/venue/venues/${v.id}/onboarding/finish`, { method: "POST", query: q }).catch(() => {});
  const list = await syncBranches();
  return cacheWrite(accountKey(BRANCHES), list.map((x) => (x.venueId === v.id ? { ...x, managerId: b.managerId, createdAt: new Date().toISOString() } : x)));
}

/** "+998901234567" → "+998 90 123 45 67" */
export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, "").replace(/^998/, "");
  return `+998 ${[d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ")}`;
};
