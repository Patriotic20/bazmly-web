"use client";

import { useEffect, useRef } from "react";

// 6 xonali SMS kod kataklari: avtomatik keyingi katak, Backspace, paste
export function OtpBoxes({ value, onChange, error, autoFocus = true, large = false }: {
  value: string[]; onChange: (v: string[]) => void; error?: boolean; autoFocus?: boolean; large?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const LEN = value.length;

  useEffect(() => { if (autoFocus) refs.current[0]?.focus(); }, [autoFocus]);

  const fill = (start: number, digits: string) => {
    const next = [...value];
    let i = start;
    for (const d of digits) { if (i >= LEN) break; next[i++] = d; }
    onChange(next);
    refs.current[Math.min(i, LEN - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-1.5" role="group" aria-label="Tasdiqlash kodi">
      {value.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={LEN}
          aria-label={`${i + 1}-raqam`}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) { const n = [...value]; n[i] = ""; onChange(n); return; }
            fill(i, digits);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              e.preventDefault(); const n = [...value]; n[i - 1] = ""; onChange(n); refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData("text").replace(/\D/g, "")); }}
          className={`h-[56px] w-full min-w-0 flex-1 rounded-[12px] border bg-[#FDFAFE] dark:bg-[#2C2C2C] text-center text-[24px] font-medium text-brand caret-brand outline-none transition-colors focus:border-brand dark:text-white dark:caret-white dark:focus:border-white ${large ? "max-w-[69.5px] sm:h-[78px] sm:text-[32px]" : "max-w-[55px] sm:h-[62px]"} ${
            d ? "border-brand dark:border-white" : error ? "border-red-500" : "border-[#D0D5DD] dark:border-[#6C6C6C]"
          }`}
        />
      ))}
    </div>
  );
}

export const focusFirstEmpty = (value: string[]) =>
  (document.querySelectorAll<HTMLInputElement>('[role=group][aria-label="Tasdiqlash kodi"] input')[value.findIndex((d) => !d)])?.focus();
