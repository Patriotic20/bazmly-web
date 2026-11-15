"use client";

import { FlagUz } from "./FlagUz";

type Lang = "uz" | "en" | "ru";

const FlagUs = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 36 36" className={className} role="img" aria-label="AQSH">
    <defs><clipPath id="us-c"><circle cx="18" cy="18" r="18" /></clipPath></defs>
    <g clipPath="url(#us-c)">
      <rect width="36" height="36" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => <rect key={i} y={i * 5.54} width="36" height="2.77" fill="#BD3D44" />)}
      <rect width="17" height="19.4" fill="#192F5D" />
      {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={2 + (i % 5) * 3.3 + (Math.floor(i / 5) % 2) * 1.6} cy={2.2 + Math.floor(i / 5) * 4.6} r=".75" fill="#fff" />)}
    </g>
  </svg>
);
const FlagRu = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 36 36" className={className} role="img" aria-label="Rossiya">
    <defs><clipPath id="ru-c"><circle cx="18" cy="18" r="18" /></clipPath></defs>
    <g clipPath="url(#ru-c)">
      <rect width="36" height="12" fill="#fff" /><rect y="12" width="36" height="12" fill="#0039A6" /><rect y="24" width="36" height="12" fill="#D52B1E" />
    </g>
  </svg>
);
const FLAGS: Record<Lang, (p: { className?: string }) => React.ReactNode> = { uz: FlagUz, en: FlagUs, ru: FlagRu };

// Figma: "Til sozlamalari" — 357×65 tugmalar, tanlangani to'q sariq fonda va ✓ bilan
export function LangList({ items, value, onChange, className = "" }: {
  items: { id: Lang; label: string }[]; value: Lang; onChange: (l: Lang) => void; className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Til" className={`mx-auto w-full max-w-[357px] space-y-[17px] ${className}`}>
      {items.map((l) => {
        const on = l.id === value;
        const Flag = FLAGS[l.id];
        return (
          <button
            key={l.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(l.id)}
            className={`flex h-[64.5px] w-full items-center rounded-[16px] pl-[20px] pr-[18px] text-left text-[24px] font-semibold tracking-[-0.3px] transition-colors ${
              on ? "bg-brand text-white shadow-[0_4px_10px_rgba(232,81,2,0.25)]" : "bg-[#F2F2F2] dark:bg-[#393939] text-black dark:text-[#FFFFFF] hover:bg-[#EAEAEA] dark:hover:bg-[#393939]"
            }`}
          >
            <Flag className="size-[36px] shrink-0" />
            <span className="ml-[21px] flex-1">{l.label}</span>
            {on && (
              <svg viewBox="0 0 24 24" className="size-[26px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
