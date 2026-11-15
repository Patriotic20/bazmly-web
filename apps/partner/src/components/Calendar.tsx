"use client";

import { useState } from "react";

// Figma: kalendar oynasi (Roboto) — kunlar ko'rinishi va oy tanlash ko'rinishi ("Feb 2023 >" bosilganda)
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Figma'dagi qalinroq strelkalar
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 10 18" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8.5 1.5L1.5 9l7 7.5" /></svg>
);
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 10 18" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1.5 1.5l7 7.5-7 7.5" /></svg>
);

const arrow = "grid size-[32px] place-items-center rounded-full text-[#FF6A00] hover:bg-[#FFF0E5]";

export function Calendar({ value, onChange, today = new Date() }: { value: Date; onChange: (d: Date) => void; today?: Date }) {
  const [view, setView] = useState({ y: value.getFullYear(), m: value.getMonth() });
  const [mode, setMode] = useState<"days" | "months">("days");

  const shift = (n: number) => setView(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(view.y, view.m, 1);
  const start = new Date(view.y, view.m, 1 - first.getDay()); // yakshanbadan boshlanadi
  const weeks = Math.ceil((first.getDay() + new Date(view.y, view.m + 1, 0).getDate()) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));

  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step || mode !== "days") return;
    e.preventDefault();
    const d = new Date(value.getFullYear(), value.getMonth(), value.getDate() + step);
    onChange(d); setView({ y: d.getFullYear(), m: d.getMonth() });
    requestAnimationFrame(() => (document.querySelector(`[data-day="${d.toDateString()}"]`) as HTMLElement | null)?.focus());
  };

  return (
    <div className="font-roboto select-none" onKeyDown={onKey}>
      <div className="flex h-[32px] items-center justify-between pl-[15.5px] pr-[13px]">
        {mode === "days" ? (
          <button type="button" onClick={() => setMode("months")} aria-label="Oyni tanlash" className="flex items-center gap-[22px] text-[19px] font-medium text-[#FF6A00] hover:opacity-80">
            {MON_SHORT[view.m]} {view.y}
            <ChevronRightIcon className="h-[17px] w-[9px]" />
          </button>
        ) : (
          <div className="relative flex flex-1 items-center">
            <button type="button" onClick={() => setMode("days")} className="flex items-center gap-[20px] pl-[11.5px] text-[19px] font-medium text-[#FF6A00] hover:opacity-80">
              <ChevronLeftIcon className="h-[17px] w-[9px]" /> Back
            </button>
            <span className="absolute left-[174px] -translate-x-1/2 text-[19px] font-medium text-[#FF6A00]">{view.y}</span>
          </div>
        )}
        <div className="flex gap-[17.5px]">
          <button type="button" onClick={() => mode === "days" ? shift(-1) : shift(-12)} aria-label={mode === "days" ? "Oldingi oy" : "Oldingi yil"} className={arrow}>
            <ChevronLeftIcon className="h-[17px] w-[9px]" />
          </button>
          <button type="button" onClick={() => mode === "days" ? shift(1) : shift(12)} aria-label={mode === "days" ? "Keyingi oy" : "Keyingi yil"} className={arrow}>
            <ChevronRightIcon className="h-[17px] w-[9px]" />
          </button>
        </div>
      </div>

      {mode === "days" ? (
        <div className="px-[7px]">
          <div className="mt-[7.5px] grid grid-cols-7 text-center text-[16px] font-medium leading-[22px] text-[#C6C6C6]" aria-hidden>
            {WEEK.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div role="grid" aria-label={`${MON_SHORT[view.m]} ${view.y}`} className="grid grid-cols-7">
            {cells.map((d) => {
              const out = d.getMonth() !== view.m, sel = same(d, value), now = same(d, today);
              return (
                <span key={d.toISOString()} className="grid h-[56px] place-items-center" role="gridcell">
                  <button
                    type="button" data-day={d.toDateString()} tabIndex={sel ? 0 : -1} aria-selected={sel} aria-current={now ? "date" : undefined}
                    aria-label={`${d.getDate()} ${MON_SHORT[d.getMonth()]} ${d.getFullYear()}`}
                    onClick={() => { onChange(d); if (out) setView({ y: d.getFullYear(), m: d.getMonth() }); }}
                    className={`grid size-[37.5px] place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]/40 focus-visible:ring-offset-1 text-[19px] leading-none transition-colors ${
                      sel ? "bg-[#FF6A00] text-white" : now ? "bg-[#9E9E9E] text-white" : out ? "text-[#9E9E9E] hover:bg-[#F5F5F5]" : "text-black hover:bg-[#FFF0E5]"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-[27.5px] grid grid-cols-[repeat(3,86px)] justify-center gap-x-[43.5px] gap-y-[38px] pb-[2px]">
          {MON.map((name, i) => {
            const sel = i === value.getMonth() && view.y === value.getFullYear();
            const cur = i === view.m;
            return (
              <button
                key={name} type="button" aria-pressed={sel}
                onClick={() => { setView({ y: view.y, m: i }); setMode("days"); }}
                className={`h-[37px] rounded-[8px] text-[19px] leading-none transition-colors ${sel ? "bg-[#FF6A00] text-white" : cur ? "text-[#FF6A00] hover:bg-[#FFF0E5]" : "text-black hover:bg-[#FFF0E5]"}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
