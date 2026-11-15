"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, LocationIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { readLocation, regionById, REGIONS, saveLocation, type UserLocation } from "@bazmly/api/regions";

// Figma: "Toshkent" tugmasi → viloyat va tuman tanlash oynasi (415×488), pastda "Tasdiqlash"
export function LocationPicker() {
  const toast = useToast();
  const [loc, setLoc] = useState<UserLocation | null>(null);
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<string | undefined>();
  const [district, setDistrict] = useState<string | undefined>();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setLoc(readLocation()), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggle = () => {
    if (!open) { setRegion(undefined); setDistrict(undefined); } // Figma: oyna "Belgilash" holatida ochiladi
    setOpen(!open);
  };
  const confirm = () => {
    if (!region) return toast("Viloyatni belgilang");
    const next = { region, district };
    saveLocation(next); setLoc(next); setOpen(false);
    toast(`Joylashuv: ${regionById(region).short}${district ? `, ${district}` : ""}`);
  };

  const r = region ? regionById(region) : undefined;
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="dialog" className="flex h-[24px] items-center gap-[8px] text-[16px] text-black dark:text-[#FFFFFF] hover:text-brand">
        <LocationIcon className="size-[20px]" />
        {loc ? regionById(loc.region).short : "…"}
      </button>
      {open && (
        <div role="dialog" aria-label="Joylashuvni tanlash" className="absolute right-0 top-[calc(100%+3px)] z-40 flex h-[487.5px] w-[min(415.5px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border-2 border-[#D0D0D0] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] px-[20px] pb-[27.5px] pt-[28.5px] shadow-[0_8px_20px_rgba(0,0,0,0.03)] sm:px-[32.5px]">
          <Select
            label="Qaysi viloyat" value={r?.name}
            options={REGIONS.map((x) => ({ id: x.id, label: x.name }))}
            onChange={(id) => { setRegion(id); setDistrict(undefined); }}
          />
          <Select
            className="mt-[30px]" label="Tummani kiriting" value={district} disabled={!r}
            options={(r?.districts ?? []).map((d) => ({ id: d, label: d }))}
            onChange={setDistrict}
          />
          <button type="button" onClick={confirm} className="mx-auto mt-auto h-[55px] w-full max-w-[356.5px] rounded-[16px] bg-brand text-[22px] text-white transition-colors hover:bg-brand-600 sm:-mx-[5px] sm:w-[356.5px] sm:text-[24px]">
            Tasdiqlash
          </button>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, options, onChange, disabled, className = "" }: {
  label: string; value?: string; options: { id: string; label: string }[]; onChange: (id: string) => void; disabled?: boolean; className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => { if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [open, active]);

  const pick = (i: number) => { onChange(options[i].id); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) setOpen(true); else setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); pick(active); }
    else if (e.key === "Escape" && open) { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setOpen(false); }
  };

  return (
    <div className={`relative ${className}`}>
      <span id={`${id}-l`} className="block text-[14px] leading-[18px] text-black dark:text-[#FFFFFF]">{label}</span>
      <button
        type="button" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => { setOpen(!open); setActive(Math.max(0, options.findIndex((o) => o.label === value))); }}
        onKeyDown={onKey}
        className="mt-[3.5px] flex h-[52px] w-full items-center justify-between rounded-[8px] border border-[#9D9D9D] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] px-[12px] text-left text-[16px] text-black dark:text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span id={`${id}-v`} className="truncate">{value ?? "Belgilash"}</span>
        <ChevronDownIcon className={`size-[20px] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul ref={list} role="listbox" aria-labelledby={`${id}-l`} className="absolute inset-x-0 top-full z-10 max-h-[264px] overflow-y-auto rounded-b-[8px] bg-white dark:bg-[#2C2C2C] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {options.map((o, i) => (
            <li
              key={o.id} role="option" aria-selected={o.label === value}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(i)} onMouseEnter={() => setActive(i)}
              className={`flex h-[52px] cursor-pointer items-center border-b border-[#F2F2F2] dark:border-[#474747] px-[12px] text-[16px] text-black dark:text-[#FFFFFF] last:border-0 ${i === active ? "bg-brand-50 dark:bg-[#483126]" : ""}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
