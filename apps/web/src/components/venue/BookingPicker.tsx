"use client";

import { useEffect, useRef, useState } from "react";
import { defaultTime, nextDays, readDraft, saveDraft, TIMES } from "@bazmly/api/booking";

const ROW = 42; // Figma: qatorlar orasi 42px
const CENTER = 116; // tanlangan qator markazi (g'ildirak ichida)

/** Aylanadigan tanlagich (iOS uslubida) */
function Wheel({ items, value, onChange, label, offset, width }: {
  items: string[]; value: number; onChange: (i: number) => void; label: string; offset: number; width: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => { ref.current?.scrollTo({ top: value * ROW }); setPos(value); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = ref.current!;
    const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)));
    setPos(i);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(i), 120);
  };

  const pick = (i: number) => ref.current?.scrollTo({ top: i * ROW, behavior: "smooth" });

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); pick(Math.min(items.length - 1, pos + 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); pick(Math.max(0, pos - 1)); }
      }}
      className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto outline-none"
      style={{ paddingTop: CENTER - ROW / 2, paddingBottom: 224 - CENTER - ROW / 2, scrollPaddingTop: CENTER - ROW / 2 }}
    >
      {items.map((it, i) => {
        const d = Math.abs(i - pos);
        return (
          <button
            key={it + i}
            type="button"
            role="option"
            aria-selected={i === pos}
            onClick={() => pick(i)}
            className="block h-[42px] w-full snap-start text-[24px] leading-[42px] transition-colors"
            style={{ paddingLeft: offset, color: d === 0 ? "var(--wheel-0)" : d === 1 ? "var(--wheel-1)" : "var(--wheel-2)" }}
          >
            <span className="block text-center" style={{ width }}>{it}</span>
          </button>
        );
      })}
    </div>
  );
}

type Props = { venueId: string; onClose: () => void; onConfirm: () => void };

// Figma: "Partiya soni" + "Kun va vaqt" oynasi (3373:16054), 464×530
export function BookingPicker({ venueId, onClose, onConfirm }: Props) {
  const days = useRef(nextDays(14)).current;
  const draft = useRef(readDraft(venueId)).current;
  const [people, setPeople] = useState<number>(draft.people && draft.people <= 6 ? draft.people : 2);
  const [day, setDay] = useState(Math.max(0, days.findIndex((d) => d.iso === draft.date)));
  const [time, setTime] = useState(Math.max(0, TIMES.indexOf(draft.time ?? defaultTime())));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const confirm = () => {
    saveDraft(venueId, { people, date: days[day].iso, time: TIMES[time] });
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[464px] overflow-hidden rounded-[16px] bg-white dark:bg-[#2C2C2C] pb-[39px] pt-[36px]"
      >
        <div className="px-[22px]">
          <h2 id="picker-title" className="h-[15px] text-[20px] font-medium leading-[15px] text-[#1F1F1F] dark:text-[#FFFFFF]">Partiya soni</h2>
          <div role="radiogroup" aria-label="Necha kishi" className="mt-[10px] flex justify-between sm:justify-start sm:gap-[20px]">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={people === n}
                onClick={() => setPeople(n)}
                className={`h-[86px] w-[48px] rounded-[10px] text-[40px] leading-none transition-colors sm:w-[54px] ${
                  people === n ? "border-2 border-brand text-brand" : "border-2 border-transparent text-[#D8D8D8] dark:text-[#FFFFFF] hover:text-brand"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <h2 className="mt-[30px] h-[15px] px-[22px] text-[20px] font-medium leading-[15px] text-[#1F1F1F] dark:text-[#FFFFFF]">Kun va vaqt</h2>
        <div className="relative mt-[4px] h-[224px]">
          <div className="grid h-full grid-cols-2">
            <Wheel items={days.map((d) => d.weekday)} value={day} onChange={setDay} label="Kun" offset={76} width={58} />
            <Wheel items={TIMES} value={time} onChange={setTime} label="Vaqt" offset={83} width={72} />
          </div>
          {/* tanlangan qator chiziqlari va chetlardagi so'nish */}
          <div className="pointer-events-none absolute inset-x-0 top-[97px] h-[38px] border-y border-[#DADADA] dark:border-[#6C6C6C]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[41px] bg-gradient-to-b from-white dark:from-[#2C2C2C] to-white/0 dark:to-[#2C2C2C]/0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32px] bg-gradient-to-t from-white dark:from-[#2C2C2C] to-white/0 dark:to-[#2C2C2C]/0" />
        </div>

        <div className="mt-[15px] px-[28px]">
          <button type="button" onClick={confirm} className="h-[56px] w-full rounded-full bg-brand text-[20px] font-semibold text-white transition-colors hover:bg-brand-600">
            Tasdiqlash
          </button>
        </div>
        <p className="sr-only" aria-live="polite">{days[day].weekday}, {TIMES[time]}, {people} kishi</p>
      </div>
    </div>
  );
}
