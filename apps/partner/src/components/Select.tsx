"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@bazmly/ui/icons";

// Figma: ochilganda ro'yxat pastdagi maydonlarni suradi (4 qator ko'rinadi, qolgani aylantiriladi)
export function Select({ label, value, options, onChange, disabled, className = "" }: {
  label: string; value?: string; options: string[]; onChange: (v: string) => void; disabled?: boolean; className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (i: number) => { onChange(options[i]); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) setOpen(true); else setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); pick(active); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className={className}>
      <span id={`${id}-l`} className="block text-[14px] leading-[18px] text-black">{label}</span>
      <button
        type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => { setOpen(!open); setActive(Math.max(0, options.indexOf(value ?? ""))); }} onKeyDown={onKey}
        className={`flex w-full items-center justify-between rounded-[8px] border bg-white px-[12px] text-left text-[16px] text-black transition-colors disabled:cursor-not-allowed ${
          open ? "mt-[9.5px] h-[51px] border-[1.5px] border-brand" : "mt-[3.5px] h-[52px] border-[#9D9D9D]"
        }`}
      >
        <span id={`${id}-v`} className="truncate">{value || "Belgilash"}</span>
        <ChevronDownIcon className={`size-[20px] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul ref={list} role="listbox" aria-labelledby={`${id}-l`} className="max-h-[216px] overflow-y-auto rounded-b-[8px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
          {options.map((o, i) => (
            <li
              key={o} role="option" aria-selected={o === value}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(i)} onMouseEnter={() => setActive(i)}
              className={`flex h-[54px] cursor-pointer items-center border-b border-[#F2F2F2] px-[12px] text-[16px] text-black last:border-0 ${i === active ? "bg-brand-50" : ""}`}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
