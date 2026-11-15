"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  addBlock, BOOKED, EVENT_TYPES, fromIsoDay, isoDay, readBlocks, readEvents, readSettings, removeBlock, slotState,
  type Block, type HallEvent, type HallSettings, type SessionId, type SlotState,
} from "@bazmly/api/hall";
import { MONTHS_UZ, WEEKDAYS_UZ } from "@bazmly/api/partnerBookings";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { CrmTabs } from "@/components/hall/CrmTabs";

const WEEK = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
const STATE_STYLE: Record<SlotState["state"], string> = {
  band: "bg-[#FF6A00] text-white",
  ushlab: "border border-dashed border-[#F59E0B] bg-[#FFF8EB] text-[#B45309]",
  yopiq: "bg-[repeating-linear-gradient(135deg,#F1F5F9_0_6px,#E2E8F0_6px_12px)] text-[#64748B]",
  bosh: "border border-transparent text-[#CBD5E1] group-hover/day:border-[#E2E8F0] group-hover/day:text-[#94A3B8]",
};
const DOT: Record<SlotState["state"], string> = { band: "bg-[#FF6A00]", ushlab: "bg-[#F59E0B]", yopiq: "bg-[#94A3B8]", bosh: "bg-[#E2E8F0]" };
export const newLink = (date: string, session: SessionId, hallId: string) => `/panel/toyxona/bron?yangi=1&sana=${date}&seans=${session}&zal=${hallId}`;
const first = (n: string) => n.split(" ")[0];

// To'yxona kalendari: oy bo'yicha, har kunda kunduzgi va kechki seans; zal bo'yicha filtr
export function HallCalendar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; blocks: Block[]; today: Date } | null>(null);
  useEffect(() => { setData({ s: readSettings(), events: readEvents(), blocks: readBlocks(), today: new Date() }); }, []);

  const set = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) sp.delete(k); else sp.set(k, v); }
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const month = useMemo(() => {
    const m = params.get("oy"); // YYYY-MM
    const t = data?.today ?? new Date();
    return m ? new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1) : new Date(t.getFullYear(), t.getMonth(), 1);
  }, [params, data]);

  if (!data) return null;
  const { s, events, blocks, today } = data;
  const hallId = params.get("zal") ?? "all";
  const halls = hallId === "all" ? s.halls : s.halls.filter((h) => h.id === hallId);
  const day = params.get("kun");

  // Oy to'ri: dushanbadan boshlanadi, 6 hafta
  const startOffset = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - startOffset + i));
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const shift = (n: number) => set({ oy: monthKey(new Date(month.getFullYear(), month.getMonth() + n, 1)), kun: null });

  // Oy statistikasi
  const inMonth = cells.filter((d) => d.getMonth() === month.getMonth());
  let booked = 0, total = 0;
  for (const d of inMonth) for (const h of halls) for (const se of s.sessions) {
    total++; if (slotState(events, blocks, isoDay(d), h.id, se.id).state === "band") booked++;
  }
  const monthEvents = events.filter((e) => e.date.startsWith(monthKey(month)) && e.stage !== "bekor" && (hallId === "all" || e.hallId === hallId));
  const reqs = monthEvents.filter((e) => !BOOKED.includes(e.stage)).length;

  return (
    <main className="container-page pb-10 pt-6 font-inter md:pt-8 lg:flex lg:h-full lg:flex-col lg:pb-5 lg:pt-[min(32px,3svh)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CrmTabs />
        <Link href={newLink(isoDay(today), s.sessions[1]?.id ?? "kechki", halls[0]?.id ?? s.halls[0].id)}
          className="flex h-[40px] shrink-0 items-center gap-[8px] rounded-full bg-[#FF6A00] px-[18px] font-sans text-[15px] text-white transition-colors hover:bg-[#F06300]">
          Yangi bron <PlusIcon className="size-[14px]" />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-[min(20px,2svh)]">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label="Oldingi oy" className="grid grid-cols-[minmax(0,1fr)] size-[36px] place-items-center rounded-full border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"><ChevronLeftIcon className="h-[14px] w-[8px]" /></button>
          <h1 className="min-w-[150px] text-center font-sans text-[20px] font-bold text-[#0F172A]">{MONTHS_UZ[month.getMonth()]} {month.getFullYear()}</h1>
          <button type="button" onClick={() => shift(1)} aria-label="Keyingi oy" className="grid grid-cols-[minmax(0,1fr)] size-[36px] place-items-center rounded-full border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"><ChevronRightIcon className="h-[14px] w-[8px]" /></button>
          <button type="button" onClick={() => set({ oy: null, kun: null })} className="ml-1 h-[36px] rounded-full border border-[#E2E8F0] px-[14px] text-[14px] text-[#334155] hover:bg-[#F8FAFC]">Bugun</button>
        </div>
        <div role="group" aria-label="Zal" className="no-scrollbar flex gap-2 overflow-x-auto">
          {[{ id: "all", name: "Barcha zallar" }, ...s.halls].map((h) => {
            const on = hallId === h.id;
            return (
              <button key={h.id} type="button" aria-pressed={on} onClick={() => set({ zal: h.id === "all" ? null : h.id })}
                className={`h-[34px] shrink-0 rounded-full border px-[14px] text-[14px] transition-colors ${on ? "border-[#FF6A00] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FFC9A3]"}`}>
                {h.name}
              </button>
            );
          })}
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-[#64748B] lg:ml-auto">
          <div className="flex gap-1.5"><dt>Band:</dt><dd className="font-semibold text-[#0F172A]">{total ? Math.round((booked / total) * 100) : 0}%</dd></div>
          <div className="flex gap-1.5"><dt>Tadbirlar:</dt><dd className="font-semibold text-[#0F172A]">{monthEvents.length - reqs}</dd></div>
          <div className="flex gap-1.5"><dt>So‘rovlar:</dt><dd className="font-semibold text-[#F59E0B]">{reqs}</dd></div>
        </dl>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#64748B]" aria-label="Belgilar">
        <li className="flex items-center gap-1.5"><i className="size-[10px] rounded-[3px] bg-[#FF6A00]" />Band (depozit to‘langan)</li>
        <li className="flex items-center gap-1.5"><i className="size-[10px] rounded-[3px] border border-dashed border-[#F59E0B] bg-[#FFF8EB]" />Ushlab turilgan (so‘rov)</li>
        <li className="flex items-center gap-1.5"><i className="size-[10px] rounded-[3px] bg-[#CBD5E1]" />Yopiq</li>
        <li className="flex items-center gap-1.5"><i className="size-[10px] rounded-[3px] border border-[#E2E8F0]" />Bo‘sh</li>
      </ul>

      {/* Oy to'ri: kompyuterda ekranning qolgan balandligini egallaydi */}
      <div className="mt-3 grid grid-cols-7 overflow-hidden rounded-[14px] border border-[#E2E8F0] lg:min-h-0 lg:flex-1 lg:grid-rows-[auto_repeat(6,minmax(0,1fr))]">
        {WEEK.map((w, i) => (
          <div key={w} className={`border-b border-[#E2E8F0] bg-[#F8FAFC] py-2 text-center text-[12px] font-medium uppercase tracking-wide ${i >= 5 ? "text-[#FF6A00]" : "text-[#64748B]"}`}>{w}</div>
        ))}
        {cells.map((d, i) => {
          const iso = isoDay(d);
          const out = d.getMonth() !== month.getMonth();
          const isToday = iso === isoDay(today);
          const past = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <div key={iso} className={`group/day relative flex min-h-[64px] flex-col gap-[3px] border-[#EEF0F3] p-[4px] sm:min-h-[96px] sm:p-[6px] ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""} ${out ? "bg-[#FAFBFC]" : "bg-white"}`}>
              <button type="button" onClick={() => set({ kun: iso })} aria-label={`${d.getDate()} ${MONTHS_UZ[d.getMonth()]} — kun tafsilotlari`}
                className={`grid size-[26px] shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors ${isToday ? "bg-[#0F172A] text-white" : out ? "text-[#CBD5E1] hover:bg-[#F1F5F9]" : past ? "text-[#94A3B8] hover:bg-[#F1F5F9]" : "text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
                {d.getDate()}
              </button>
              {/* Telefonda — nuqtalar, kattaroq ekranda — seans bo'yicha yorliqlar */}
              <div className="flex flex-wrap gap-[3px] sm:hidden">
                {s.sessions.flatMap((se) => halls.map((h) => {
                  const st = slotState(events, blocks, iso, h.id, se.id);
                  return <i key={se.id + h.id} className={`size-[7px] rounded-full ${DOT[st.state]}`} />;
                }))}
              </div>
              <div className="hidden min-h-0 flex-1 flex-col gap-[3px] overflow-hidden sm:flex">
                {s.sessions.map((se) => {
                  const states = halls.map((h) => ({ h, st: slotState(events, blocks, iso, h.id, se.id) }));
                  if (halls.length === 1) {
                    const { h, st } = states[0];
                    const label = st.state === "band" || st.state === "ushlab" ? first(st.event!.name) : st.state === "yopiq" ? "Yopiq" : `+ ${se.label}`;
                    const href = st.event ? `/panel/toyxona/bron?id=${st.event.id}` : st.state === "bosh" && !past ? newLink(iso, se.id, h.id) : null;
                    const cls = `flex h-[22px] min-w-0 items-center gap-1 truncate rounded-[6px] px-[6px] text-[12px] leading-none transition-colors ${STATE_STYLE[st.state]} ${out ? "opacity-50" : ""}`;
                    const title = `${se.label}: ${st.event ? `${st.event.name} · ${st.event.guests} kishi` : st.state === "yopiq" ? st.block?.reason || "Yopiq" : "Bo‘sh"}`;
                    return href
                      ? <Link key={se.id} href={href} title={title} className={cls}><span className="shrink-0 opacity-70">{se.id === "kunduzgi" ? "☀" : "☾"}</span><span className="truncate">{label}</span></Link>
                      : <span key={se.id} title={title} className={cls}><span className="shrink-0 opacity-70">{se.id === "kunduzgi" ? "☀" : "☾"}</span><span className="truncate">{past && st.state === "bosh" ? "" : label}</span></span>;
                  }
                  // Barcha zallar: seans bo'yicha band zallar soni
                  const nBand = states.filter((x) => x.st.state === "band").length;
                  const nHold = states.filter((x) => x.st.state === "ushlab").length;
                  const nClosed = states.filter((x) => x.st.state === "yopiq").length;
                  const st: SlotState["state"] = nBand + nClosed === halls.length && nBand ? "band" : nBand ? "band" : nHold ? "ushlab" : nClosed === halls.length ? "yopiq" : "bosh";
                  const full = nBand + nClosed === halls.length;
                  return (
                    <button key={se.id} type="button" onClick={() => set({ kun: iso })}
                      title={`${se.label}: ${nBand} band, ${nHold} so‘rov, ${halls.length - nBand - nClosed - nHold} bo‘sh`}
                      className={`flex h-[22px] min-w-0 items-center gap-1 truncate rounded-[6px] px-[6px] text-left text-[12px] leading-none transition-colors ${STATE_STYLE[st]} ${st === "band" && !full ? "!bg-[#FFD8BD] !text-[#C2410C]" : ""} ${out ? "opacity-50" : ""}`}>
                      <span className="shrink-0 opacity-70">{se.id === "kunduzgi" ? "☀" : "☾"}</span>
                      <span className="truncate">{st === "bosh" ? (past ? "" : `+ ${se.label}`) : st === "yopiq" ? "Yopiq" : `${nBand}/${halls.length} band${nHold ? ` · ${nHold} so‘rov` : ""}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {day && <DayPanel date={day} s={s} events={events} blocks={blocks} today={today} onClose={() => set({ kun: null })} onBlocks={(b) => setData({ ...data, blocks: b })} />}
    </main>
  );
}

// Kun tafsilotlari: har bir zal va seans — holat, mijoz, amallar (bron qo'shish, yopish)
function DayPanel({ date, s, events, blocks, today, onClose, onBlocks }: {
  date: string; s: HallSettings; events: HallEvent[]; blocks: Block[]; today: Date; onClose: () => void; onBlocks: (b: Block[]) => void;
}) {
  const toast = useToast();
  const [closing, setClosing] = useState<{ hallId: string; session: SessionId } | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  const d = fromIsoDay(date);
  const past = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={`${d.getDate()} ${MONTHS_UZ[d.getMonth()]}`} className="flex h-full w-full max-w-[460px] flex-col bg-white font-inter shadow-[-12px_0_40px_rgba(15,23,42,0.12)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#EEF0F3] px-6 py-5">
          <div>
            <h2 className="font-sans text-[20px] font-bold text-[#0F172A]">{d.getDate()} {MONTHS_UZ[d.getMonth()]}, {WEEKDAYS_UZ[d.getDay()]}</h2>
            <p className="mt-1 text-[14px] text-[#64748B]">{past ? "O‘tgan kun" : d.getDay() === 0 || d.getDay() === 6 ? `Dam olish kuni · zal narxi +${s.weekendPct}%` : "Ish kuni"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid grid-cols-[minmax(0,1fr)] size-9 place-items-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]">✕</button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {s.halls.map((h) => (
            <section key={h.id}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">{h.name} · {h.capacity} kishigacha</h3>
              <ul className="mt-2 space-y-2">
                {s.sessions.map((se) => {
                  const st = slotState(events, blocks, date, h.id, se.id);
                  const e = st.event;
                  const type = e && EVENT_TYPES.find((t) => t.id === e.eventType)?.label;
                  return (
                    <li key={se.id} className="rounded-[12px] border border-[#EEF0F3] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-[#0F172A]">{se.label} <span className="font-normal text-[#94A3B8]">{se.from}–{se.to}</span></p>
                        <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${st.state === "band" ? "bg-[#FFF0E5] text-[#FF6A00]" : st.state === "ushlab" ? "bg-[#FFF8EB] text-[#B45309]" : st.state === "yopiq" ? "bg-[#F1F5F9] text-[#64748B]" : "bg-[#F0FDF4] text-[#16A34A]"}`}>
                          {st.state === "band" ? "Band" : st.state === "ushlab" ? "So‘rov" : st.state === "yopiq" ? "Yopiq" : "Bo‘sh"}
                        </span>
                      </div>
                      {e && (
                        <Link href={`/panel/toyxona/bron?id=${e.id}`} className="mt-2 flex items-center justify-between gap-3 rounded-[10px] bg-[#F8FAFC] px-3 py-2 hover:bg-[#F1F5F9]">
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold text-[#0F172A]">{e.name}</span>
                            <span className="block text-[13px] text-[#64748B]">{type} · {e.guests} kishi{st.holds.length > 1 ? ` · yana ${st.holds.length - 1} so‘rov` : ""}</span>
                          </span>
                          <ChevronRightIcon className="h-[14px] w-[8px] shrink-0 text-[#94A3B8]" />
                        </Link>
                      )}
                      {st.state === "band" && st.holds.length > 0 && <p className="mt-2 text-[12px] text-[#B45309]">Shu joyga yana {st.holds.length} ta so‘rov bor</p>}
                      {st.state === "yopiq" && (
                        <div className="mt-2 flex items-center justify-between gap-3 text-[13px] text-[#64748B]">
                          <span>{st.block?.reason || "Sabab ko‘rsatilmagan"}</span>
                          <button type="button" onClick={() => { onBlocks(removeBlock(st.block!.id)); toast("Joy qayta ochildi"); }} className="font-medium text-[#FF6A00] hover:underline">Ochish</button>
                        </div>
                      )}
                      {!past && (st.state === "bosh" || st.state === "ushlab") && (
                        closing?.hallId === h.id && closing.session === se.id ? (
                          <form className="mt-2 flex gap-2" onSubmit={(ev) => { ev.preventDefault(); onBlocks(addBlock({ date, hallId: h.id, session: se.id, reason: reason.trim() })); setClosing(null); setReason(""); toast("Joy yopildi"); }}>
                            <input autoFocus value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="Sabab (masalan: ta’mirlash)" aria-label="Yopish sababi"
                              className="h-[38px] min-w-0 flex-1 rounded-[10px] border border-[#E2E8F0] px-3 text-[14px] outline-none focus:border-[#FF6A00]" />
                            <button type="submit" className="h-[38px] rounded-[10px] bg-[#0F172A] px-3 text-[14px] text-white">Yopish</button>
                            <button type="button" onClick={() => setClosing(null)} className="h-[38px] rounded-[10px] px-2 text-[14px] text-[#64748B]">Bekor</button>
                          </form>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <Link href={newLink(date, se.id, h.id)} className="flex h-[36px] items-center gap-1.5 rounded-[10px] bg-[#FF6A00] px-3 text-[14px] text-white hover:bg-[#F06300]"><PlusIcon className="size-[12px]" />Bron qo‘shish</Link>
                            {st.state === "bosh" && <button type="button" onClick={() => setClosing({ hallId: h.id, session: se.id })} className="h-[36px] rounded-[10px] border border-[#E2E8F0] px-3 text-[14px] text-[#475569] hover:bg-[#F8FAFC]">Yopish</button>}
                          </div>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
