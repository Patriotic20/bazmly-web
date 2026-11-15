"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays, fromIso, iso, longDate, readBookings, setBookingStatus, type BookingStatus, type PartnerBooking,
} from "@bazmly/api/partnerBookings";
import { openFromBooking } from "@bazmly/api/orders";
import { ChevronLeftIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { Calendar } from "@/components/Calendar";
import { primaryBtn } from "@/components/PartnerCard";
import { CheckCircleFillIcon, ClockOutlineIcon, FilterLinesIcon, GroupFillIcon, PhoneFillIcon, TableFillIcon } from "@/components/panelIcons";

type Day = "bugun" | "ertaga" | "barchasi";
type Filter = "hammasi" | BookingStatus;
const DAYS: { id: Day; label: string }[] = [{ id: "bugun", label: "Bugun" }, { id: "ertaga", label: "Ertaga" }, { id: "barchasi", label: "Barchasi" }];
const FILTERS: { id: Filter; label: string }[] = [
  { id: "hammasi", label: "Hammasi" }, { id: "kutilmoqda", label: "Kutilmoqda" }, { id: "keldi", label: "Keldi" }, { id: "bekor", label: "Bekor qilindi" },
];
const BADGE: Record<BookingStatus, { label: string; cls: string }> = {
  kutilmoqda: { label: "Kutilmoqda", cls: "border border-[#FDE5CC] bg-[#FFF5EB] text-[#FF6A00]" },
  keldi: { label: "Keldi", cls: "bg-[#DCFCE7] text-[#16A34A]" },
  bekor: { label: "Bekor qilindi", cls: "bg-[#FEE4E2] text-[#D92D20]" },
};
const ORDER: Record<BookingStatus, number> = { kutilmoqda: 0, keldi: 1, bekor: 2 };

// Figma: "Kutilayotgan mijozlar" — bugun / ertaga / barchasi, holat bo'yicha filtr, kalendar orqali sana tanlash
export function Waiting() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [list, setList] = useState<PartnerBooking[] | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => { setList(readBookings()); setToday(new Date()); }, []);

  const sana = params.get("sana");
  const day: Day | null = sana ? null : ((params.get("kun") as Day) || "bugun");
  const filter = (params.get("holat") as Filter) || "hammasi";
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const calOpen = params.get("kalendar") === "1";

  const set = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) sp.delete(k); else sp.set(k, v); }
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const date = useMemo(() => {
    if (!today) return null;
    if (sana) return fromIso(sana);
    return day === "ertaga" ? addDays(today, 1) : day === "bugun" ? today : null;
  }, [today, sana, day]);

  if (!list || !today) return null;

  const inScope = list.filter((b) => (date ? b.date === iso(date) : b.date >= iso(today)))
    .filter((b) => !q || b.name.toLowerCase().includes(q) || b.phone.includes(q) || b.table.toLowerCase().includes(q));
  const waiting = inScope.filter((b) => b.status === "kutilmoqda").length;
  const shown = inScope
    .filter((b) => filter === "hammasi" || b.status === filter)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.date + a.time).localeCompare(b.date + b.time));

  const act = (b: PartnerBooking, status: BookingStatus) => {
    setList(setBookingStatus(b.id, status));
    // Mijoz keldi — uning stoliga buyurtma ochiladi ("Buyurtmalar" bo'limida ko'rinadi)
    if (status === "keldi") openFromBooking(b);
    toast(status === "keldi" ? `${b.name} — keldi deb belgilandi` : `${b.name} — bron bekor qilindi`);
  };

  return (
    <main className="container-page pt-8 font-inter md:pt-[55px] lg:flex lg:h-full lg:flex-col lg:pt-[min(55px,4svh)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-[6px] md:gap-[13px]">
          <button type="button" onClick={() => router.push("/panel")} aria-label="Orqaga" className="-ml-[9px] mt-[1px] grid size-[40px] shrink-0 place-items-center rounded-full text-[#FF6A00] hover:bg-[#FFF0E5]">
            <ChevronLeftIcon className="h-[20px] w-[10px]" />
          </button>
          <div>
            <h1 className="font-sans text-[22px] font-bold leading-[30px] text-[#0F172A] md:text-[24px] md:leading-[32px]">Kutilayotgan mijozlar</h1>
            <p className="mt-[9px] text-[14px] leading-[20px] text-[#64748B]">
              {date ? longDate(date) : `${longDate(today)} dan boshlab`}
            </p>
          </div>
        </div>
        <button
          type="button" onClick={() => set({ kalendar: "1" })} aria-label="Sana tanlash" aria-haspopup="dialog"
          className="mt-[2px] grid size-[44px] shrink-0 place-items-center rounded-full border border-[#F1F5F9] bg-white text-[#FF6A00] shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:bg-[#FFF0E5]"
        >
          <FilterLinesIcon className="size-[22px]" />
        </button>
      </div>

      <div role="tablist" aria-label="Kun" className="mt-[20px] grid w-full max-w-[355px] grid-cols-3 rounded-[8px] border border-[#F1F5F9] bg-white px-[3px] pb-[5px] pt-[3px]">
        {DAYS.map((d) => {
          const on = day === d.id;
          return (
            <button key={d.id} role="tab" type="button" aria-selected={on} onClick={() => set({ kun: d.id === "bugun" ? null : d.id, sana: null })}
              className={`h-[36px] rounded-[6px] text-[15px] transition-colors ${on ? "bg-[#FF6A00] font-medium text-white" : "text-[#64748B] hover:text-[#0F172A]"}`}>
              {d.label}
            </button>
          );
        })}
      </div>

      <div className="no-scrollbar -mx-4 mt-[20px] flex gap-[11.5px] overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Holat bo‘yicha">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button key={f.id} type="button" aria-pressed={on} onClick={() => set({ holat: f.id === "hammasi" ? null : f.id })}
              className={`flex h-[38px] shrink-0 items-center gap-[8px] rounded-full border px-[20.5px] text-[14px] font-medium transition-colors ${
                on ? "border-[#FFF0E5] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FFC9A3]"
              }`}>
              {f.label}
              {f.id === "kutilmoqda" && waiting > 0 && (
                <span className="grid size-[20.5px] place-items-center rounded-full bg-[#FF6A00] text-[12px] font-semibold text-white">{waiting}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Kompyuterda ro'yxat o'z bo'limi ichida aylanadi */}
      <div className="mt-[40px] lg:mt-[min(40px,3svh)] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-6 lg:pr-1">
      <ul className="space-y-[10px]">
        {shown.map((b) => (
          <li key={b.id}>
            <Card b={b} showDate={!date} onArrive={() => act(b, "keldi")} onCancel={() => act(b, "bekor")} />
          </li>
        ))}
      </ul>
      <p className="mt-[26px] text-center text-[14px] leading-[18px] text-[#94A3B8]">
        {shown.length ? "Barcha buyurtmalar ko‘rsatildi" : q ? `“${params.get("q")}” bo‘yicha buyurtma topilmadi` : "Bu kun uchun buyurtmalar yo‘q"}
      </p>
      </div>

      {calOpen && <CalendarDialog initial={date ?? today} today={today} onClose={() => set({ kalendar: null })} onPick={(d) => {
        const v = iso(d);
        // Bugun yoki ertaga tanlansa — tegishli tab faollashadi
        if (v === iso(today)) set({ kalendar: null, sana: null, kun: null });
        else if (v === iso(addDays(today, 1))) set({ kalendar: null, sana: null, kun: "ertaga" });
        else set({ kalendar: null, sana: v, kun: null });
      }} />}
    </main>
  );
}

export function Card({ b, showDate, onArrive, onCancel }: { b: PartnerBooking; showDate: boolean; onArrive: () => void; onCancel: () => void }) {
  const wait = b.status === "kutilmoqda";
  const badge = BADGE[b.status];
  const dateText = showDate ? `${longDate(fromIso(b.date)).split(",")[0]}, ` : "";
  return (
    <article className={`relative rounded-[16px] border border-[#F1F5F9] pl-[18px] pr-4 md:pr-[15.5px] ${wait ? "bg-white pb-[10px] pt-[14px]" : "bg-[#F9FBFD] pb-[14px] pt-[14px] md:min-h-[130px]"}`}>
      <span className={`absolute right-[12px] top-[16px] flex h-[26px] items-center rounded-[6px] px-[13px] text-[12px] font-bold md:right-[17.5px] ${badge.cls}`}>{badge.label}</span>
      <h3 className={`pl-[7px] pr-[120px] text-[18px] font-bold leading-[26px] ${wait ? "text-[#0F1729]" : "text-[#334155]"}`}>{b.name}</h3>
      <p className="mt-[9px] flex items-center gap-[10px] pl-[7px] text-[14px] leading-[20px] text-[#475569]">
        <ClockOutlineIcon className={`size-[16px] shrink-0 ${wait ? "text-[#FF6A00]" : "text-black"}`} />
        <span className="tabular-nums">{dateText}{b.time}</span>
      </p>
      {wait ? (
        <>
          <div className="mt-[22.5px] flex flex-wrap gap-[19.5px] text-[15px] text-[#475569]">
            <span className="flex h-[40px] items-center gap-[9px] rounded-[8px] bg-[#F8FAFB] px-[12px]"><GroupFillIcon className="size-[18px] text-[#94A3B8]" />{b.people} kishi</span>
            <span className="flex h-[40px] items-center gap-[9px] rounded-[8px] bg-[#F8FAFB] px-[12px]"><TableFillIcon className="size-[18px] text-[#94A3B8]" />{b.table}</span>
          </div>
          <div className="mt-[20px] flex items-center gap-[13px]">
            <button type="button" onClick={onArrive} className="flex h-[66px] w-[114px] items-center justify-center gap-[10px] rounded-[10px] bg-[#FF6A00] text-[15px] text-white transition-colors hover:bg-[#F06300]">
              Keldi <CheckCircleFillIcon className="size-[20px]" />
            </button>
            <button type="button" onClick={onCancel} className="h-[66px] w-[114px] rounded-[10px] border border-[#E2E7F0] bg-white text-[15px] font-medium text-[#475569] transition-colors hover:border-[#FDA29B] hover:text-[#D92D20]">
              Bekor qilish
            </button>
            <a href={`tel:${b.phone}`} aria-label={`${b.name}ga qo‘ng‘iroq qilish`} className="grid h-[44px] w-[48px] place-items-center rounded-[10px] bg-[#DCFBE7] text-[#22C55E] transition-colors hover:bg-[#C6F6D5]">
              <PhoneFillIcon className="size-[22px]" />
            </a>
          </div>
        </>
      ) : (
        <p className="mt-[17.5px] flex items-center gap-[16px] pl-[7px] text-[14px] leading-[20px] text-[#64748B]">
          <span className="flex items-center gap-[8px]"><GroupFillIcon className="size-[18px]" />{b.people} kishi</span>
          <span className="flex items-center gap-[8px]"><TableFillIcon className="size-[18px]" />{b.table}</span>
        </p>
      )}
    </article>
  );
}

export function CalendarDialog({ initial, today, onClose, onPick }: { initial: Date; today: Date; onClose: () => void; onPick: (d: Date) => void }) {
  const [value, setValue] = useState(initial);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    requestAnimationFrame(() => box.current?.focus());
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-auto flex w-[min(373px,calc(100%-2rem))] flex-col items-center pb-10 pt-24 hd:pt-[351px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Sana tanlash" className="outline-none min-h-[379px] w-full rounded-[16px] bg-white pb-[13px] pt-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <Calendar value={value} onChange={setValue} today={today} />
        </div>
        <button type="button" onClick={() => onPick(value)} className={`${primaryBtn} mt-[40px] max-w-[357px] font-sans`}>Qidirish</button>
      </div>
    </div>
  );
}
