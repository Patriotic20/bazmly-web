"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { longDate } from "@bazmly/api/partnerBookings";
import { errorText } from "@bazmly/api/client";
import { formatPhone, readStaff, removeStaff, roleLabel, setStaffActive, syncStaff, type Role, type Staff as StaffT } from "@bazmly/api/staff";
import { PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { PageHead } from "@/components/PageHead";

type Filter = "hammasi" | "admin" | "menejer" | "ofitsiant" | "noaktiv";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "hammasi", label: "Hammasi" }, { id: "admin", label: "Admin" }, { id: "menejer", label: "Menejer" },
  { id: "ofitsiant", label: "Ofitsiant" }, { id: "noaktiv", label: "Noaktiv" },
];
export const ROLE_BADGE: Record<Role, string> = {
  menejer: "bg-[#FFF0E5] text-[#FF6A00]",
  ofitsiant: "bg-[#EAF1FF] text-[#2563EB]",
  admin: "bg-[#F3E8FF] text-[#9333EA]",
  oshpaz: "bg-[#FFEDD5] text-[#EA580C]",
  qoriqchi: "bg-[#F1F5F9] text-[#475569]",
  "oshpaz-yordamchisi": "bg-[#FEF3C7] text-[#B45309]",
};
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ s, className = "" }: { s: Pick<StaffT, "name" | "avatar">; className?: string }) {
  return s.avatar
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={s.avatar} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
    : <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-[#FFE7D6] font-semibold text-[#E85102] ${className}`}>{initials(s.name)}</span>;
}

// Figma: "Hodimlar" — jami/aktiv/noaktiv, lavozim bo'yicha filtr, ro'yxat (⋮ — tahrirlash, holat, o'chirish)
export function Staff() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [list, setList] = useState<StaffT[] | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [confirm, setConfirm] = useState<StaffT | null>(null);
  useEffect(() => {
    setList(readStaff()); setToday(new Date());
    syncStaff().then(setList).catch(() => {});
  }, []);

  const filter = (params.get("lavozim") as Filter) || "hammasi";
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const set = (v: Filter) => {
    const sp = new URLSearchParams(params.toString());
    if (v === "hammasi") sp.delete("lavozim"); else sp.set("lavozim", v);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  if (!list || !today) return null;
  const active = list.filter((s) => s.active).length;
  const shown = list
    .filter((s) => filter === "hammasi" ? true : filter === "noaktiv" ? !s.active : s.role === filter)
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.phone.includes(q.replace(/\D/g, "") || "\u0000") || roleLabel(s.role).toLowerCase().includes(q));

  const toggle = async (s: StaffT) => {
    try { setList(await setStaffActive(s.id, !s.active)); } catch (e) { return toast(errorText(e)); }
    toast(s.active ? `${s.name} — noaktiv qilindi` : `${s.name} — aktiv qilindi`);
  };
  const remove = async (s: StaffT) => {
    setConfirm(null);
    try { setList(await removeStaff(s.id)); } catch (e) { return toast(errorText(e)); }
    toast(`${s.name} o‘chirildi`);
  };

  return (
    <main className="container-page pt-8 font-sans md:pt-[55px]">
      <PageHead
        title="Hodimlar" subtitle={longDate(today)}
        right={
          <Link href="/panel/hodimlar/yangi" className="mt-[2px] flex h-[36px] shrink-0 items-center gap-[8px] rounded-full bg-[#FF6A00] px-[17px] text-[15px] text-white transition-colors hover:bg-[#F06300]">
            Qo‘shish <PlusIcon className="size-[14px]" />
          </Link>
        }
      />

      <dl className="mt-[17.5px] flex flex-wrap items-baseline gap-x-[27px] gap-y-2 pl-[20.5px] text-[14px] text-[#6B7280]">
        <div className="flex items-baseline gap-[8px]"><dt>Jami:</dt><dd className="text-[18px] font-semibold text-[#FF6A00]">{list.length}</dd></div>
        <div className="flex items-baseline gap-[8px]"><dt>Aktiv:</dt><dd className="text-[18px] font-semibold text-[#2DCD47]">{active}</dd></div>
        <div className="flex items-baseline gap-[8px]"><dt>Noaktiv:</dt><dd className="text-[18px] font-semibold text-[#9CA3AF]">{list.length - active}</dd></div>
      </dl>

      <div className="no-scrollbar -mx-4 mt-[37.5px] flex gap-[14px] overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Lavozim bo‘yicha">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button key={f.id} type="button" aria-pressed={on} onClick={() => set(f.id)}
              className={`h-[34px] shrink-0 rounded-full border px-[16px] text-[15px] transition-colors ${on ? "border-[#FF6A00] bg-[#FF6A00] text-white" : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FFC9A3]"}`}>
              {f.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-[40px] space-y-[12px]">
        {shown.map((s) => (
          <li key={s.id} className={`relative flex min-h-[100px] focus-within:z-20 items-center gap-[12px] rounded-[12px] border border-[#F3F4F6] bg-white pb-3 pl-[16px] pr-[52px] ${s.active ? "" : "opacity-60"}`}>
            <Avatar s={s} className="size-[56px] text-[18px]" />
            <div className="min-w-0 self-start pt-[17px]">
              <p className="truncate text-[16px] font-semibold leading-[22px] text-[#111827]">{s.name}{!s.active && <span className="ml-2 text-[13px] font-medium text-[#9CA3AF]">· noaktiv</span>}</p>
              <p className="mt-[10px] flex flex-wrap items-center gap-x-[9px] gap-y-1 text-[14px] text-[#6B7280]">
                <span className={`flex h-[20px] items-center rounded-[4px] px-[8px] text-[13px] ${ROLE_BADGE[s.role]}`}>{roleLabel(s.role)}</span>
                <span aria-hidden className="size-[4px] rounded-full bg-[#9CA3AF]" />
                <a href={`tel:${s.phone}`} className="ml-[4px] tabular-nums hover:text-[#FF6A00]">{formatPhone(s.phone)}</a>
              </p>
            </div>
            <RowMenu s={s} onEdit={() => router.push(`/panel/hodimlar/yangi?id=${s.id}`)} onToggle={() => void toggle(s)} onRemove={() => setConfirm(s)} />
          </li>
        ))}
      </ul>
      <p className="mt-[26px] text-center text-[14px] text-[#94A3B8]">
        {shown.length ? `${shown.length} ta hodim ko‘rsatildi` : q ? `“${params.get("q")}” bo‘yicha hodim topilmadi` : "Bu lavozimda hodim yo‘q"}
      </p>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="del-t" className="w-full max-w-[380px] rounded-[20px] bg-white p-6 shadow-xl">
            <h2 id="del-t" className="text-[20px] font-bold text-[#111827]">Hodimni o‘chirasizmi?</h2>
            <p className="mt-2 text-[15px] text-[#6B7280]">{confirm.name} tizimdan o‘chiriladi va boshqa kira olmaydi.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" autoFocus onClick={() => setConfirm(null)} className="h-12 rounded-[12px] border border-[#E5E7EB] text-[16px] text-[#374151] hover:bg-[#F9FAFB]">Bekor qilish</button>
              <button type="button" onClick={() => void remove(confirm)} className="h-12 rounded-[12px] bg-[#D92D20] text-[16px] text-white hover:bg-[#B42318]">O‘chirish</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function RowMenu({ s, onEdit, onToggle, onRemove }: { s: StaffT; onEdit: () => void; onToggle: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const item = "w-full px-4 py-2.5 text-left text-[15px] hover:bg-[#F9FAFB]";
  return (
    <div ref={box} className="absolute inset-y-0 right-[6px] flex items-center">
      <button type="button" onClick={() => setOpen(!open)} aria-label={`${s.name} — amallar`} aria-haspopup="menu" aria-expanded={open}
        className="grid size-[40px] place-items-center rounded-full text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#4B5563]">
        <svg viewBox="0 0 4 16" className="h-[16px] w-[4px]" fill="currentColor" aria-hidden><circle cx="2" cy="2" r="2" /><circle cx="2" cy="8" r="2" /><circle cx="2" cy="14" r="2" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(50%+24px)] z-30 w-[200px] overflow-hidden rounded-[14px] border border-[#ECECEC] bg-white py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <button role="menuitem" type="button" className={`${item} text-[#111827]`} onClick={() => { setOpen(false); onEdit(); }}>Tahrirlash</button>
          <button role="menuitem" type="button" className={`${item} text-[#111827]`} onClick={() => { setOpen(false); onToggle(); }}>{s.active ? "Noaktiv qilish" : "Aktiv qilish"}</button>
          <button role="menuitem" type="button" className={`${item} text-[#D92D20]`} onClick={() => { setOpen(false); onRemove(); }}>O‘chirish</button>
        </div>
      )}
    </div>
  );
}
