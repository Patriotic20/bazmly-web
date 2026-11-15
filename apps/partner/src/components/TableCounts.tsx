"use client";

import { TABLE_SIZES, type Tables } from "@bazmly/api/partner";
import { fieldLabel } from "./PartnerCard";

const GRID: Record<number, [number, number]> = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 8: [3, 3], 10: [3, 3] };

export function TableIcon({ n }: { n: number }) {
  const [c, r] = GRID[n];
  const g = 1.2, w = (20 - g * (c - 1)) / c, h = (20 - g * (r - 1)) / r;
  return (
    <svg viewBox="0 0 20 20" className="size-[22px] shrink-0 text-[#CDD2DB]" aria-hidden>
      <defs><clipPath id={`t${n}`}><rect width="20" height="20" rx="5" /></clipPath></defs>
      <g clipPath={`url(#t${n})`} fill="currentColor">
        {Array.from({ length: c * r }, (_, i) => <rect key={i} x={(i % c) * (w + g)} y={Math.floor(i / c) * (h + g)} width={w} height={h} />)}
      </g>
    </svg>
  );
}

/** Figma: "Joylar soni" / "Stollar" — 2, 4, 6, 8, 10+ kishilik stollar soni */
export function TableCounts({ value, onChange, className = "" }: { value: Tables; onChange: (t: Tables) => void; className?: string }) {
  const set = (n: number, v: string) => {
    const num = v.replace(/\D/g, "").slice(0, 4);
    onChange({ ...value, [n]: num === "" ? undefined : Number(num) });
  };
  return (
    <div className={`mx-auto w-full max-w-[356.5px] space-y-[22.5px] fit-tight:space-y-[12px] ${className}`}>
      {TABLE_SIZES.map((n) => (
        <label key={n} className="block">
          <span className={fieldLabel}>{n === 10 ? "10+" : n} kishilik sig‘imdagi stollar soni</span>
          <span className="mt-[15.5px] fit-tight:mt-[8px] flex h-[55px] fit-tight:h-[48px] items-center rounded-[12px] border border-[#D0D5DD] bg-white pl-[16px] pr-[16px] focus-within:border-brand">
            <input
              inputMode="numeric" placeholder="0" value={value[n] ?? ""} onChange={(e) => set(n, e.target.value)}
              aria-label={`${n === 10 ? "10+" : n} kishilik stollar soni`}
              className="w-full bg-transparent text-[20px] text-black outline-none placeholder:text-[#9A9A9A] tabular-nums"
            />
            <TableIcon n={n} />
          </span>
        </label>
      ))}
    </div>
  );
}
