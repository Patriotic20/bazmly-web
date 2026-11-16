"use client";

import { useRouter } from "next/navigation";
import { Fit } from "@bazmly/ui/Fit";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { HALL_STEPS, nextDays, readDraft, saveDraft, TIMES } from "@bazmly/api/booking";
import { blockedDates } from "@bazmly/api/bookings";
import type { VenueDetails } from "@bazmly/api/venues";
import { Stepper } from "./Stepper";

const Title = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="h-[15px] text-[18px] font-semibold leading-[15px] text-[#1F1F1F] dark:text-[#FFFFFF] sm:text-[20px]">{children}</h2>
);

// Figma: o'ng pastda qotgan "Keyingisi" (249×56). Tanlov to'liq bo'lmasa — och rangda, bosilmaydi.
function NextButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 dark:bg-[#2C2C2C]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:inset-x-auto lg:bottom-[20px] lg:right-[33.5px] lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
      <button
        type="button"
        onClick={onClick}
        aria-disabled={disabled}
        className={`h-[56px] w-full rounded-[20px] text-[20px] font-semibold text-white transition-colors lg:w-[249px] ${disabled ? "cursor-not-allowed bg-[#FADCCC] dark:bg-[#5C3E2E] dark:text-white/30" : "bg-brand hover:bg-brand-600"}`}
      >
        Keyingisi
      </button>
    </div>
  );
}

function Shell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="container-page pb-32 lg:w-[min(1273px,calc(100%-3rem))] lg:pb-0">
      <main className="pt-5 md:pt-8 xl:pt-[min(40px,3.704svh)]">
        <Fit gap={112}>
        <div className="lg:pt-[34px] lg:fit-tight:pt-[10px]">
          <Stepper steps={HALL_STEPS} current={step} nowrap checkAll />
        </div>
        <div className="mt-10 lg:ml-[11px] lg:mt-[97px] lg:fit-tight:mt-[32px] lg:max-w-[1129px]">{children}</div>
        </Fit>
      </main>
    </div>
  );
}

// 2-bosqich: Kun va vaqtni belgilang
export function HallDateStep({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const toast = useToast();
  const days = useRef(nextDays(30)).current;
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  // Band kunlar — backend `/v1/venues/{id}/availability`. Soat bo'yicha bandlik API'da yo'q — barcha vaqtlar bo'sh.
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let alive = true;
    blockedDates(v.id, days[0].iso, days[days.length - 1].iso).then((b) => {
      if (!alive) return;
      setBlocked(b);
      const d = readDraft(v.id);
      const di = days.findIndex((x) => x.iso === d.date);
      if (di >= 0 && !b.has(days[di].iso)) {
        setDate(days[di].iso);
        const ti = TIMES.indexOf(d.time ?? "");
        if (ti >= 0) setTime(TIMES[ti]);
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, [v.id, days]);

  useEffect(() => {
    if (date) document.querySelector(`[data-date="${date}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [date]);

  const pickDate = (iso: string) => {
    setDate(iso);
    // boshqa kunda tanlangan vaqt band bo'lishi mumkin
    const ti = time ? TIMES.indexOf(time) : -1;
    const keep = ti >= 0;
    if (!keep) setTime(null);
    saveDraft(v.id, { date: iso, time: keep ? time ?? undefined : undefined });
  };
  const pickTime = (t: string) => { setTime(t); saveDraft(v.id, { time: t }); };

  const ready = !!date && !!time;
  const next = () => {
    if (!date) return toast("Sanani belgilang");
    if (!time) return toast("Vaqtni belgilang");
    router.push(`/toyxonalar/${v.id}/bron/mehmonlar`);
  };

  return (
    <Shell step={2}>
      <section aria-labelledby="h-date">
        <Title id="h-date">Sanani belgilash</Title>
        <div role="radiogroup" aria-labelledby="h-date" className="no-scrollbar -mx-4 mt-[24px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0">
          {days.map((d) => {
            const free = !blocked.has(d.iso);
            const on = date === d.iso;
            return (
              <button
                key={d.iso}
                data-date={d.iso}
                type="button"
                role="radio"
                aria-checked={on}
                aria-disabled={!free}
                aria-label={`${d.weekday}, ${d.day}${free ? "" : " — band"}`}
                onClick={() => (free ? pickDate(d.iso) : toast("Bu kun band — boshqa kunni tanlang"))}
                className={`relative h-[111px] w-[56px] shrink-0 rounded-[10px] transition-colors ${
                  on ? "bg-brand text-white" : free ? "bg-[#F2F2F2] dark:bg-[#393939] text-brand hover:bg-brand-50 dark:hover:bg-[#483126]" : "cursor-not-allowed bg-[#F2F2F2] dark:bg-[#393939] text-[#CDCDCD] dark:text-[#FFFFFF]"
                }`}
              >
                {on && <CheckIcon className="absolute left-1/2 top-[14px] h-[8px] w-[10px] -translate-x-1/2" />}
                <span className={`absolute inset-x-0 top-[31px] text-[12px] ${free ? "font-semibold" : "font-medium"}`}>{d.weekday}</span>
                <span className="absolute inset-x-0 top-[49px] text-[24px] font-semibold">{d.day}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="h-time" className="mt-[30px]">
        <Title id="h-time">Vaqtni belgilash</Title>
        <div role="radiogroup" aria-labelledby="h-time" className="no-scrollbar -mx-4 mt-[24px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0">
          {TIMES.map((t) => {
            const free = true;
            const on = time === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={on}
                aria-disabled={!free}
                aria-label={`${t}${free ? "" : " — band"}`}
                onClick={() => {
                  if (!free) return toast("Bu vaqt band");
                  if (!date) return toast("Avval sanani belgilang");
                  pickTime(t);
                }}
                className={`flex h-[44px] shrink-0 items-center gap-[6px] rounded-[10px] text-[15px] tabular-nums transition-colors ${
                  on ? "bg-brand px-[15.5px] font-semibold text-white"
                    : free ? "bg-[#F2F2F2] dark:bg-[#393939] px-[24px] font-semibold text-brand hover:bg-brand-50 dark:hover:bg-[#483126]"
                    : "cursor-not-allowed bg-[#F2F2F2] dark:bg-[#393939] px-[24px] font-medium text-[#B3B3B3] dark:text-[#FFFFFF]"
                }`}
              >
                {on && <CheckIcon className="h-[9px] w-[12px]" />}
                {t}
              </button>
            );
          })}
        </div>
      </section>

      <NextButton disabled={!ready} onClick={next} />
    </Shell>
  );
}
