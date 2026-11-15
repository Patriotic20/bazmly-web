"use client";

import { useEffect, useRef, useState } from "react";
import { daysText, WEEK_DAYS, type DayRange } from "@bazmly/api/partner";
import { CalendarEditIcon } from "@bazmly/ui/icons";
import { fieldLabel } from "./PartnerCard";

/**
 * Figma: "Hafta davomidagi ish kunlarini kiriting" — maydon bosilganda kunlar paneli ochiladi.
 * 1-bosish — boshlanish kuni, 2-bosish — tugash kuni (teskari tanlansa almashtiriladi), 3-bosish — qaytadan.
 */
export function DaysPicker({ value, onChange, onDone, className = "" }: {
  value?: DayRange; onChange: (r: DayRange | null) => void;
  /** "Belgilash" bosilganda (panel yopiladi) */
  onDone?: (r: DayRange) => void; className?: string;
}) {
  const [range, setRange] = useState<{ from?: number; to?: number }>(value ?? {});
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => { if (value) setRange(value); }, [value?.from, value?.to]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const full: DayRange | null = range.from === undefined ? null : { from: range.from, to: range.to ?? range.from };
  const pick = (i: number) => {
    const r = range;
    const next = r.from === undefined || r.to !== undefined ? { from: i } : i < r.from ? { from: i, to: r.from } : { from: r.from, to: i };
    setRange(next);
    onChange({ from: next.from, to: next.to ?? next.from });
  };
  const text = full ? daysText(full, "/") : "";

  return (
    <div ref={wrap} className={className}>
      <span id="lbl-days" className={`${fieldLabel} tracking-[-0.3px]`}>Hafta davomidagi ish kunlarini kiriting</span>
      <button
        type="button" aria-labelledby="lbl-days" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`mt-[14.5px] flex h-[55px] w-full items-center justify-between rounded-[8px] border bg-white pl-[16.5px] pr-[16px] text-left text-[20px] transition-colors ${
          open ? "border-2 border-brand" : "border-[#D0D5DD] hover:border-brand"
        }`}
      >
        <span className={text ? "text-black" : "text-[#9A9A9A]"}>{text || "Dush/"}</span>
        <CalendarEditIcon className="size-[21px] shrink-0 text-[#292D32]" />
      </button>

      {open && (
        <div role="dialog" aria-label="Ish kunlarini tanlash" className="sm:-mx-[5.25px]">
          <div className="mt-[4px] rounded-[12px] border border-[#D9D9D9] bg-white px-[9.5px] pb-[19px] pt-[12.5px]">
            <div className="grid grid-cols-5 gap-x-[6px] gap-y-[13px] sm:gap-x-[9.5px]">
              {WEEK_DAYS.map((name, i) => {
                const end = i === range.from || i === range.to;
                const inside = range.from !== undefined && range.to !== undefined && i > range.from && i < range.to;
                return (
                  <button
                    key={name} type="button" aria-pressed={end || inside} onClick={() => pick(i)}
                    className={`h-[52.5px] rounded-[8px] border text-[16px] font-medium transition-colors ${
                      end ? "border-brand bg-brand text-white"
                        : inside ? "border-brand bg-white text-brand"
                        : "border-[#1F1F1F] bg-white text-black hover:border-brand hover:text-brand"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-[13px] flex justify-end">
            <button
              type="button" disabled={!full} onClick={() => { setOpen(false); if (full) onDone?.(full); }}
              className="h-[48px] mr-[1.5px] w-[118.5px] rounded-[12px] bg-brand text-[20px] text-white transition-colors hover:bg-brand-600 disabled:bg-[#F8D9C8]"
            >
              Belgilash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
