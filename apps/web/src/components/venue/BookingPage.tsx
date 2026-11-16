"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, MinusIcon, PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { nextDays, readDraft, saveDraft, TIMES } from "@bazmly/api/booking";
import { type FreeTable, freeTables } from "@bazmly/api/bookings";
import type { VenueDetails } from "@bazmly/api/venues";
import { Stepper } from "./Stepper";
import { useCart } from "./useCart";
import { VenueLayout } from "./VenueLayout";

// Stollar backenddan: tanlangan sana va vaqtda (vaqt tanlanmagan bo'lsa — 12:00) bo'sh stollar ko'rsatiladi
const PROBE_TIME = "12:00";

const Title = ({ children }: { children: React.ReactNode }) => (
  <h2 className="h-[15px] text-[18px] font-semibold leading-[15px] text-[#1F1F1F] dark:text-[#FFFFFF] sm:text-[20px]">{children}</h2>
);

// Figma: "Kun va vaqtni belgilang" bosqichi (3402:2170)
export function BookingPage({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const toast = useToast();
  const cart = useCart(v.id, v.menu);
  const days = useRef(nextDays(30)).current;
  const [people, setPeople] = useState(0);
  const [table, setTable] = useState<number | null>(null);
  const [date, setDate] = useState(days[0].iso);
  const [time, setTime] = useState<string | null>(null);
  const [tables, setTables] = useState<FreeTable[]>([]);

  useEffect(() => {
    const d = readDraft(v.id);
    if (d.people) setPeople(d.people);
    if (d.table) setTable(d.table);
    if (d.date && days.some((x) => x.iso === d.date)) setDate(d.date);
    if (d.time) setTime(d.time);
  }, [v.id, days]);

  useEffect(() => {
    let alive = true;
    freeTables(v.id, date, time ?? PROBE_TIME, people || undefined)
      .then((list) => { if (alive) setTables(list); })
      .catch(() => { if (alive) setTables([]); });
    return () => { alive = false; };
  }, [v.id, date, time, people]);
  const TABLES = tables.map((t) => t.number);

  // tanlangan sana / vaqt ko'rinadigan joyga suriladi
  useEffect(() => {
    document.querySelector(`[data-date="${date}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [date]);
  useEffect(() => {
    if (time) document.querySelector(`[data-time="${time}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [time]);

  const set = <T,>(setter: (x: T) => void, key: "people" | "table" | "date" | "time") => (x: T) => {
    setter(x);
    saveDraft(v.id, { [key]: x });
  };

  const next = () => {
    if (people < 1) return toast("Necha kishi uchun ekanini belgilang");
    const free = tables.find((t) => t.number === table);
    if (!table || !free) return toast("Joyni (stolni) belgilang");
    if (!time) return toast("Vaqtni belgilang");
    saveDraft(v.id, { people, table, tableId: free.id, date, time });
    router.push(`/${v.type === "toyxona" ? "toyxonalar" : "restoranlar"}/${v.id}/bron/tasdiqlash`);
  };

  const steps = [v.type === "toyxona" ? "To‘yxonani belgilang" : "Restoranni belgilang", "Menu", "Kun va vaqtni belgilang", "Ma‘lumotlarni tasdiqlash"];

  return (
    <VenueLayout fit lines={cart.lines} total={cart.total} count={cart.count} onAdd={cart.add} onDec={cart.dec} onNext={next}>
      <div className="lg:pt-[34px]">
        <Stepper steps={steps} current={3} />
      </div>

      <div className="mt-10 lg:ml-[11px] lg:mt-[97px] lg:max-w-[1129px]">
        {/* Necha kishi uchun */}
        <div className="flex h-[36px] items-center justify-between">
          <Title>Necha kishi uchun</Title>
          <div className="flex items-center">
            <button type="button" onClick={() => set(setPeople, "people")(Math.max(0, people - 1))} disabled={people === 0} aria-label="Kamaytirish" className="grid size-[36px] place-items-center rounded-full bg-[#F2F2F2] dark:bg-[#393939] text-[#181818] dark:text-[#FFFFFF] transition-colors hover:bg-[#E6E6E6] dark:hover:bg-[#393939] disabled:opacity-50">
              <MinusIcon className="size-[20px]" />
            </button>
            <span className="w-[50px] text-center text-[24px] font-medium tabular-nums" aria-live="polite">{people}</span>
            <button type="button" onClick={() => set(setPeople, "people")(Math.min(500, people + 1))} aria-label="Ko‘paytirish" className="grid size-[36px] place-items-center rounded-full bg-[#F2F2F2] dark:bg-[#393939] text-[#181818] dark:text-[#FFFFFF] transition-colors hover:bg-[#E6E6E6] dark:hover:bg-[#393939]">
              <PlusIcon className="size-[20px]" />
            </button>
          </div>
        </div>

        {/* Joyni belgilash */}
        <section className="mt-[30px]">
          <Title>Joyni belgilash</Title>
          <div role="radiogroup" aria-label="Stol raqami" className="no-scrollbar -mx-4 mt-[24px] flex h-[86px] items-center gap-[20px] overflow-x-auto px-4 md:mx-0 md:px-0">
            {TABLES.map((n) => {
              const on = table === n;
              // Dark (Figma): bo'sh joylar to'q sariq, band — oq
              const free = true;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${n}-stol`}
                  onClick={() => set(setTable, "table")(n)}
                  className={`flex shrink-0 flex-col items-center justify-center leading-none transition-colors ${
                    on ? "h-[86px] w-[59px] gap-[12px] rounded-[8px] bg-brand text-white" : `h-[86px] text-[#D8D8D8] ${free ? "dark:text-brand" : "dark:text-[#FFFFFF]"} hover:text-brand`
                  }`}
                >
                  {on && <CheckIcon className="h-[8px] w-[10px]" />}
                  <span className="text-[40px] font-medium">{n}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sanani belgilash */}
        <section className="mt-[30px]">
          <Title>Sanani belgilash</Title>
          <div role="radiogroup" aria-label="Sana" className="no-scrollbar -mx-4 mt-[24px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0">
            {days.map((d) => {
              const on = date === d.iso;
              const free = true;
              return (
                <button
                  key={d.iso}
                  data-date={d.iso}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${d.weekday}, ${d.day}`}
                  onClick={() => set(setDate, "date")(d.iso)}
                  className={`group relative h-[111px] w-[56px] shrink-0 rounded-[10px] transition-colors ${on ? "bg-brand text-white" : `bg-[#F2F2F2] dark:bg-[#393939] text-[#CDCDCD] ${free ? "dark:text-brand" : "dark:text-[#FFFFFF]"} hover:text-brand`}`}
                >
                  {on && <CheckIcon className="absolute left-1/2 top-[14px] h-[8px] w-[10px] -translate-x-1/2" />}
                  <span className="absolute inset-x-0 top-[31px] text-[12px] font-medium">{d.weekday}</span>
                  <span className="absolute inset-x-0 top-[49px] text-[24px] font-medium">{d.day}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Vaqtni belgilash */}
        <section className="mt-[30px]">
          <Title>Vaqtni belgilash</Title>
          <div role="radiogroup" aria-label="Vaqt" className="no-scrollbar -mx-4 mt-[24px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0">
            {TIMES.map((t) => {
              const on = time === t;
              const free = true;
              return (
                <button
                  key={t}
                  data-time={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set(setTime, "time")(t)}
                  className={`flex h-[44px] shrink-0 items-center gap-[6px] rounded-[10px] text-[15px] font-medium tabular-nums transition-colors ${
                    on ? "bg-brand px-[15.5px] text-white" : `bg-[#F2F2F2] dark:bg-[#393939] px-[24px] text-[#B3B3B3] ${free ? "dark:text-brand" : "dark:text-[#FFFFFF]"} hover:text-brand`
                  }`}
                >
                  {on && <CheckIcon className="h-[9px] w-[12px]" />}
                  {t}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </VenueLayout>
  );
}
