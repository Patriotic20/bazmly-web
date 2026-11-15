"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ClockIcon } from "@bazmly/ui/icons";
import { fieldLabel } from "./PartnerCard";

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

// Figma: "Ish boshlash vaqti" — soat belgili maydon; bosilganda 30 daqiqalik vaqtlar ro'yxati ochiladi
export function TimeField({ label, value, onChange, className = "" }: { label: string; value?: string; onChange: (v: string) => void; className?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => { if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const show = () => { setActive(value ? TIME_SLOTS.indexOf(value) : 18); setOpen(true); };
  const pick = (i: number) => { onChange(TIME_SLOTS[i]); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) show(); else setActive((a) => Math.min(TIME_SLOTS.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); pick(active); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <span id={`${id}-l`} className={fieldLabel}>{label}</span>
      <button
        type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={onKey}
        className={`mt-[15.5px] flex h-[55px] w-full items-center justify-between rounded-[8px] border bg-white pl-[16.5px] pr-[16px] text-left text-[20px] transition-colors ${open ? "border-brand" : "border-[#D0D5DD] hover:border-brand"}`}
      >
        <span id={`${id}-v`} className={value ? "text-black tabular-nums" : "text-[#A6A6A6]"}>{value?.replace(/^0(\d)/, "$1") || "Vaqtni tanlang"}</span>
        <ClockIcon className="size-[22px] shrink-0 text-[#292D32]" />
      </button>
      {open && (
        <ul ref={list} role="listbox" aria-labelledby={`${id}-l`} className="absolute inset-x-0 top-[calc(100%+4px)] z-30 max-h-[232px] overflow-y-auto rounded-[12px] border border-[#E4E4E4] bg-white py-1 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
          {TIME_SLOTS.map((t, i) => (
            <li
              key={t} role="option" aria-selected={t === value}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(i)} onMouseEnter={() => setActive(i)}
              className={`flex h-[44px] cursor-pointer items-center justify-between px-[16px] text-[17px] tabular-nums ${i === active ? "bg-brand-50" : ""} ${t === value ? "font-semibold text-brand" : "text-black"}`}
            >
              {t.replace(/^0(\d)/, "$1")}
              {t === value && <span aria-hidden>✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
