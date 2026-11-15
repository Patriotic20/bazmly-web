"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BOOKED, EVENT_TYPES, isoDay, mln, num, quote, readBlocks, readEvents, readSettings, slotState, SOURCES,
  type HallEvent, type HallSettings,
} from "@bazmly/api/hall";
import { MONTHS_SHORT, MONTHS_UZ } from "@bazmly/api/partnerBookings";
import { CrmTabs } from "@/components/hall/CrmTabs";

type Period = "oy" | "otgan" | "chorak" | "yil";
const PERIODS: { id: Period; label: string }[] = [
  { id: "oy", label: "Shu oy" }, { id: "otgan", label: "O‘tgan oy" }, { id: "chorak", label: "So‘nggi 3 oy" }, { id: "yil", label: "So‘nggi 12 oy" },
];
const BRAND = "#FF6A00";
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function range(p: Period, now: Date): [string, string, string] {
  const y = now.getFullYear(), m = now.getMonth();
  const start = p === "oy" ? new Date(y, m, 1) : p === "otgan" ? new Date(y, m - 1, 1) : p === "chorak" ? new Date(y, m - 2, 1) : new Date(y, m - 11, 1);
  const end = p === "otgan" ? new Date(y, m, 0) : new Date(y, m + 1, 0);
  const label = p === "oy" ? `${MONTHS_UZ[m]} ${y}` : p === "otgan" ? `${MONTHS_UZ[start.getMonth()]} ${start.getFullYear()}` : `${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  return [isoDay(start), isoDay(end), label];
}

// Hisobotlar: tushum, tadbirlar, o'rtacha chek, konversiya, oylik tushum grafigi, manbalar, tadbir turlari, zallar bandligi
export function Reports() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; now: Date } | null>(null);
  useEffect(() => { setData({ s: readSettings(), events: readEvents(), now: new Date() }); }, []);
  if (!data) return null;
  const { s, events, now } = data;
  const period = (params.get("davr") as Period) || "oy";
  const [from, to, label] = range(period, now);
  const inP = (d: string) => d >= from && d <= to;

  const payments = events.flatMap((e) => e.payments);
  const income = payments.filter((p) => inP(p.date)).reduce((a, p) => a + p.amount, 0);
  const booked = events.filter((e) => inP(e.date) && BOOKED.includes(e.stage));
  const cancelled = events.filter((e) => inP(e.date) && e.stage === "bekor");
  const revenue = booked.reduce((a, e) => a + quote(s, e).total, 0);
  const avg = booked.length ? Math.round(revenue / booked.length) : 0;
  const leads = events.filter((e) => inP(isoDay(new Date(e.createdAt))));
  const won = (e: HallEvent) => BOOKED.includes(e.stage) || (e.stage === "bekor" && e.payments.length > 0);
  const conv = leads.length ? Math.round((leads.filter(won).length / leads.length) * 100) : 0;

  // Zallar bandligi (davr ichidagi seanslar)
  const blocks = readBlocks();
  const days: string[] = [];
  for (let d = new Date(from); isoDay(d) <= to; d.setDate(d.getDate() + 1)) days.push(isoDay(d));
  const halls = s.halls.map((h) => {
    let b = 0; const t = days.length * s.sessions.length;
    for (const d of days) for (const se of s.sessions) if (slotState(events, blocks, d, h.id, se.id).state === "band") b++;
    return { label: h.name, value: t ? Math.round((b / t) * 100) : 0, sub: `${b} / ${t} seans` };
  });
  const occ = halls.length ? Math.round(halls.reduce((a, h) => a + h.value, 0) / halls.length) : 0;

  // Oylik tushum: so'nggi 12 oy
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
  const monthly = months.map((d) => ({ key: ym(d), label: MONTHS_SHORT[d.getMonth()], value: payments.filter((p) => p.date.startsWith(ym(d))).reduce((a, p) => a + p.amount, 0) }));
  const sources = SOURCES.map((x) => {
    const l = leads.filter((e) => e.source === x.id);
    const w = l.filter(won).length;
    return { label: x.label, value: l.length, sub: l.length ? `${Math.round((w / l.length) * 100)}% bron bo‘ldi` : "—" };
  }).sort((a, b) => b.value - a.value);
  const types = EVENT_TYPES.map((x) => ({ label: x.label, value: booked.filter((e) => e.eventType === x.id).length, sub: "" })).filter((x) => x.value).sort((a, b) => b.value - a.value);

  const set = (p: Period) => {
    const sp = new URLSearchParams(params.toString());
    if (p === "oy") sp.delete("davr"); else sp.set("davr", p);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  return (
    <main className="container-page pb-20 pt-6 font-inter md:pt-8 lg:pt-[min(32px,3svh)]">
      <CrmTabs />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-[20px] font-bold text-[#0F172A]">Hisobotlar</h1>
          <p className="mt-0.5 text-[14px] text-[#64748B]">{label}</p>
        </div>
        <div role="group" aria-label="Davr" className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-[12px] bg-[#F4F5F7] p-1">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" aria-pressed={period === p.id} onClick={() => set(p.id)}
              className={`h-[34px] whitespace-nowrap rounded-[9px] px-3 text-[13px] font-medium transition-colors ${period === p.id ? "bg-white text-[#0F172A] shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-[#64748B] hover:text-[#0F172A]"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi title="Tushum" value={`${mln(income)} so‘m`} sub="to‘lovlar bo‘yicha" />
        <Kpi title="Tadbirlar" value={`${booked.length} ta`} sub={`${mln(revenue)} so‘mlik`} />
        <Kpi title="O‘rtacha chek" value={`${mln(avg)} so‘m`} sub="bitta tadbir" />
        <Kpi title="Konversiya" value={`${conv}%`} sub={`${leads.length} ta so‘rovdan`} />
        <Kpi title="Band seanslar" value={`${occ}%`} sub="barcha zallar" />
        <Kpi title="Bekor qilingan" value={`${cancelled.length} ta`} sub="tadbir sanasi bo‘yicha" />
      </div>

      <section aria-labelledby="h-month" className="mt-5 rounded-[16px] border border-[#EEF0F3] bg-white p-4 sm:p-5">
        <h2 id="h-month" className="text-[15px] font-semibold text-[#0F172A]">Oylik tushum <span className="font-normal text-[#94A3B8]">· so‘nggi 12 oy</span></h2>
        <MonthBars data={monthly} from={from.slice(0, 7)} to={to.slice(0, 7)} />
      </section>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        <HBars title="So‘rovlar qayerdan keladi" note="Davr ichida tushgan so‘rovlar" data={sources} unit="ta" />
        <HBars title="Tadbir turlari" note="Bo‘lib o‘tgan va bron qilingan" data={types} unit="ta" />
        <HBars title="Zallar bandligi" note="Band seanslar ulushi" data={halls} unit="%" max={100} />
      </div>
    </main>
  );
}

function Kpi({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-[16px] bg-[#F6F7F9] p-4">
      <p className="text-[13px] text-[#64748B]">{title}</p>
      <p className="mt-1 font-sans text-[18px] font-bold text-[#0F172A] tabular-nums sm:text-[22px]">{value}</p>
      <p className="text-[12px] text-[#94A3B8]">{sub}</p>
    </div>
  );
}

/** Vertikal ustunlar: bitta rang, tanlangan davr to'q, qolgani och; hover — aniq summa */
function MonthBars({ data, from, to }: { data: { key: string; label: string; value: number }[]; from: string; to: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((a, d) => (d.value > a.value ? d : a), data[0]);
  return (
    <div className="mt-4">
      <div className="relative flex h-[200px] items-end gap-[2px] border-b border-[#E2E8F0] sm:gap-2">
        {[0.5, 1].map((g) => <span key={g} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#F1F5F9]" style={{ bottom: `${g * 100}%` }} />)}
        {data.map((d) => {
          const on = d.key >= from && d.key <= to;
          return (
            <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0} aria-label={`${d.label}: ${num(d.value)} so‘m`}>
              <div className="w-full max-w-[44px] rounded-t-[4px] transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(d.value ? 2 : 0, (d.value / max) * 100)}%`, background: on ? BRAND : "#FFD3B3" }} />
              {d.key === peak.key && d.value > 0 && <span className="absolute text-[11px] font-medium text-[#475569]" style={{ bottom: `calc(${(d.value / max) * 100}% + 4px)` }}>{mln(d.value)}</span>}
              <span role="tooltip" className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-[8px] bg-[#0F172A] px-2.5 py-1.5 text-[12px] text-white shadow-lg group-hover:block group-focus:block">
                {d.label}: <b>{num(d.value)}</b> so‘m
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px] sm:gap-2">
        {data.map((d) => <span key={d.key} className={`flex-1 text-center text-[11px] ${d.key >= from && d.key <= to ? "font-semibold text-[#0F172A]" : "text-[#94A3B8]"}`}>{d.label}</span>)}
      </div>
    </div>
  );
}

/** Gorizontal ustunlar: nom · chiziq · qiymat (bitta rang) */
function HBars({ title, note, data, unit, max }: { title: string; note: string; data: { label: string; value: number; sub: string }[]; unit: string; max?: number }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <section className="rounded-[16px] border border-[#EEF0F3] bg-white p-4 sm:p-5">
      <h2 className="text-[15px] font-semibold text-[#0F172A]">{title}</h2>
      <p className="text-[12px] text-[#94A3B8]">{note}</p>
      <ul className="mt-3 space-y-3">
        {data.map((d) => (
          <li key={d.label} title={d.sub || undefined}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-[#0F172A]">{d.label}</span>
              <span className="tabular-nums"><b className="font-semibold text-[#0F172A]">{d.value}</b> <span className="text-[#94A3B8]">{unit}</span></span>
            </div>
            <div className="mt-1 h-[8px] overflow-hidden rounded-full bg-[#F1F5F9]">
              <div className="h-full rounded-full" style={{ width: `${(d.value / top) * 100}%`, background: BRAND }} />
            </div>
            {d.sub && <p className="mt-0.5 text-[12px] text-[#94A3B8]">{d.sub}</p>}
          </li>
        ))}
        {!data.length && <li className="py-6 text-center text-[13px] text-[#94A3B8]">Bu davrda ma’lumot yo‘q</li>}
      </ul>
    </section>
  );
}
