"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addPayment, EVENT_TYPES, fromIsoDay, isoDay, num, paid, quote, readEvents, readSettings, setStage, stageInfo,
  type HallEvent, type HallSettings,
} from "@bazmly/api/hall";
import { longDate } from "@bazmly/api/partnerBookings";
import { ChevronLeftIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { ClockOutlineIcon, FilterLinesIcon, GroupFillIcon, StoreIcon } from "@/components/panelIcons";
import { CalendarDialog } from "@/app/panel/kutilayotgan/Waiting";
import { PaymentDialog } from "@/app/panel/toyxona/bron/EventEditor";
import { PaidBar } from "./CrmTabs";

type Day = "bugun" | "ertaga" | "hafta";
const DAYS: { id: Day; label: string }[] = [{ id: "bugun", label: "Bugun" }, { id: "ertaga", label: "Ertaga" }, { id: "hafta", label: "Shu hafta" }];
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// To'yxona: "Kutilayotgan tadbirlar" — bugun / ertaga / shu hafta, zal bo'yicha filtr; tadbir rejasi, tadbir o'tdi, to'lov
export function HallUpcoming() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; today: Date } | null>(null);
  const [pay, setPay] = useState<HallEvent | null>(null);
  useEffect(() => { setData({ s: readSettings(), events: readEvents(), today: new Date() }); }, []);
  if (!data) return null;
  const { s, events, today } = data;

  const set = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) sp.delete(k); else sp.set(k, v); }
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const sana = params.get("sana");
  const day: Day | null = sana ? null : ((params.get("kun") as Day) || "bugun");
  const hallId = params.get("zal") ?? "all";
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const t = isoDay(today);
  const [from, to] = sana ? [sana, sana] : day === "ertaga" ? [isoDay(addDays(today, 1)), isoDay(addDays(today, 1))] : day === "hafta" ? [t, isoDay(addDays(today, 6))] : [t, t];

  const shown = events
    .filter((e) => (e.stage === "depozit" || e.stage === "otdi") && e.date >= from && e.date <= to)
    .filter((e) => hallId === "all" || e.hallId === hallId)
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.phone.includes(q.replace(/\D/g, "") || "\u0000"))
    .sort((a, b) => (a.date + (a.session === "kunduzgi" ? "0" : "1")).localeCompare(b.date + (b.session === "kunduzgi" ? "0" : "1")));
  const guests = shown.reduce((a, e) => a + e.guests, 0);

  return (
    <main className="container-page pb-16 pt-8 font-inter md:pt-[55px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-[6px] md:gap-[13px]">
          <button type="button" onClick={() => router.push("/panel")} aria-label="Orqaga" className="-ml-[9px] mt-[1px] grid size-[40px] shrink-0 place-items-center rounded-full text-[#FF6A00] hover:bg-[#FFF0E5]">
            <ChevronLeftIcon className="h-[20px] w-[10px]" />
          </button>
          <div>
            <h1 className="font-sans text-[22px] font-bold leading-[30px] text-[#0F172A] md:text-[24px] md:leading-[32px]">Kutilayotgan tadbirlar</h1>
            <p className="mt-[9px] text-[14px] leading-[20px] text-[#64748B]">
              {from === to ? longDate(fromIsoDay(from)) : `${longDate(fromIsoDay(from)).split(",")[0]} – ${longDate(fromIsoDay(to)).split(",")[0]}`}
              {shown.length > 0 && <> · {shown.length} ta tadbir, {guests} mehmon</>}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => set({ kalendar: "1" })} aria-label="Sana tanlash" aria-haspopup="dialog"
          className="mt-[2px] grid size-[44px] shrink-0 place-items-center rounded-full border border-[#F1F5F9] bg-white text-[#FF6A00] shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:bg-[#FFF0E5]">
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

      <div className="no-scrollbar -mx-4 mt-[20px] flex gap-[11.5px] overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Zal">
        {[{ id: "all", name: "Barcha zallar" }, ...s.halls].map((h) => {
          const on = hallId === h.id;
          const n = events.filter((e) => (e.stage === "depozit" || e.stage === "otdi") && e.date >= from && e.date <= to && (h.id === "all" || e.hallId === h.id)).length;
          return (
            <button key={h.id} type="button" aria-pressed={on} onClick={() => set({ zal: h.id === "all" ? null : h.id })}
              className={`flex h-[38px] shrink-0 items-center gap-[8px] rounded-full border px-[20.5px] text-[14px] font-medium transition-colors ${on ? "border-[#FFF0E5] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FFC9A3]"}`}>
              {h.name}
              {n > 0 && <span className={`grid size-[20.5px] place-items-center rounded-full text-[12px] font-semibold ${on ? "bg-[#FF6A00] text-white" : "bg-[#F1F5F9] text-[#475569]"}`}>{n}</span>}
            </button>
          );
        })}
      </div>

      <ul className="mt-[32px] space-y-[10px]">
        {shown.map((e) => {
          const total = quote(s, e).total; const p = paid(e); const rest = Math.max(0, total - p);
          const se = s.sessions.find((x) => x.id === e.session);
          const done = e.stage === "otdi";
          return (
            <li key={e.id}>
              <article className={`relative rounded-[16px] border border-[#F1F5F9] px-[18px] pb-[14px] pt-[14px] ${done ? "bg-[#F9FBFD]" : "bg-white"}`}>
                <span className={`absolute right-[12px] top-[16px] flex h-[26px] items-center rounded-[6px] px-[13px] text-[12px] font-bold md:right-[17.5px] ${done ? "bg-[#E6FAF7] text-[#0D9488]" : "bg-[#FFF0E5] text-[#FF6A00]"}`}>{done ? "Tadbir o‘tdi" : "Kutilmoqda"}</span>
                <Link href={`/panel/toyxona/bron?id=${e.id}`} className="block pr-[120px] text-[18px] font-bold leading-[26px] text-[#0F1729] hover:text-[#FF6A00]">{e.name}</Link>
                <p className="mt-[9px] flex flex-wrap items-center gap-x-[10px] gap-y-1 text-[14px] leading-[20px] text-[#475569]">
                  <ClockOutlineIcon className="size-[16px] shrink-0 text-[#FF6A00]" />
                  <span className="tabular-nums">{from !== to ? `${longDate(fromIsoDay(e.date)).split(",")[0]}, ` : ""}{se?.label} {se?.from}–{se?.to}</span>
                  <span className="text-[#CBD5E1]">·</span>
                  <span>{EVENT_TYPES.find((x) => x.id === e.eventType)?.label}</span>
                </p>
                <div className="mt-[16px] flex flex-wrap gap-[12px] text-[15px] text-[#475569]">
                  <span className="flex h-[40px] items-center gap-[9px] rounded-[8px] bg-[#F8FAFB] px-[12px]"><GroupFillIcon className="size-[18px] text-[#94A3B8]" />{e.guests} kishi</span>
                  <span className="flex h-[40px] items-center gap-[9px] rounded-[8px] bg-[#F8FAFB] px-[12px]"><StoreIcon className="size-[18px] text-[#94A3B8]" />{s.halls.find((h) => h.id === e.hallId)?.name}</span>
                </div>
                <div className="mt-[14px] max-w-[420px]">
                  <p className="flex justify-between text-[13px]">
                    <span className="text-[#64748B]">To‘langan: <b className="font-semibold text-[#0F172A] tabular-nums">{num(p)}</b> / {num(total)}</span>
                    <span className={rest ? "font-semibold text-[#DC2626] tabular-nums" : "font-semibold text-[#16A34A]"}>{rest ? `Qoldiq: ${num(rest)}` : "To‘liq to‘langan"}</span>
                  </p>
                  <div className="mt-1.5"><PaidBar paid={p} total={total} /></div>
                </div>
                <div className="mt-[16px] flex flex-wrap items-center gap-[10px]">
                  <Link href={`/panel/toyxona/tadbir?id=${e.id}`} className="flex h-[48px] items-center rounded-[10px] bg-[#FF6A00] px-[18px] text-[15px] text-white transition-colors hover:bg-[#F06300]">Tadbir rejasi</Link>
                  {!done && e.date <= t && (
                    <button type="button" onClick={() => { setData({ ...data, events: setStage(e.id, "otdi") }); toast(`${e.name} — ${stageInfo("otdi").label}`); }}
                      className="h-[48px] rounded-[10px] border border-[#E2E7F0] bg-white px-[16px] text-[15px] font-medium text-[#475569] transition-colors hover:border-[#5EEAD4] hover:text-[#0D9488]">
                      Tadbir o‘tdi
                    </button>
                  )}
                  {rest > 0 && (
                    <button type="button" onClick={() => setPay(e)} className="h-[48px] rounded-[10px] border border-[#E2E7F0] bg-white px-[16px] text-[15px] font-medium text-[#475569] transition-colors hover:border-[#FFC9A3] hover:text-[#FF6A00]">
                      To‘lov qo‘shish
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      <p className="mt-[26px] text-center text-[14px] leading-[18px] text-[#94A3B8]">
        {shown.length ? "Barcha tadbirlar ko‘rsatildi" : q ? `“${params.get("q")}” bo‘yicha tadbir topilmadi` : "Bu kunlarda tadbir yo‘q"}
      </p>

      {params.get("kalendar") === "1" && (
        <CalendarDialog initial={sana ? fromIsoDay(sana) : today} today={today} onClose={() => set({ kalendar: null })} onPick={(d) => {
          const v = isoDay(d);
          if (v === t) set({ kalendar: null, sana: null, kun: null });
          else if (v === isoDay(addDays(today, 1))) set({ kalendar: null, sana: null, kun: "ertaga" });
          else set({ kalendar: null, sana: v, kun: null });
        }} />
      )}
      {pay && (() => {
        const total = quote(s, pay).total; const p = paid(pay);
        return (
          <PaymentDialog title={`To‘lov: ${pay.name}`} suggested={total - p} max={total - p} first={p === 0} onClose={() => setPay(null)}
            onSave={(amount, method, date, note) => { setData({ ...data, events: addPayment(pay.id, { amount, method, date, note }) }); setPay(null); toast(`To‘lov qo‘shildi: ${num(amount)} so‘m`); }} />
        );
      })()}
    </main>
  );
}
