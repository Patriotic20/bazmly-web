"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { readAccount, type PartnerAccount } from "@bazmly/api/partner";
import { growth, iso, monthCount, MONTHS_UZ, readBookings, twoWeeks, type PartnerBooking } from "@bazmly/api/partnerBookings";
import { Fit } from "@bazmly/ui/Fit";
import { ChevronRightIcon, ClockIcon } from "@bazmly/ui/icons";
import { readBranches, readStaff } from "@bazmly/api/staff";
import { StoreIcon, TrendIcon, UsersOutlineIcon } from "@/components/panelIcons";
import { HallHome } from "@/components/hall/HallHome";

const hh = (t: string) => t.replace(/^0(\d)/, "$1");
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Hozir ochiqmi: ish kuni oralig'ida va ish vaqti ichida (tungi ish vaqti ham hisobga olinadi) */
function isOpen(acc: PartnerAccount, now = new Date()) {
  const from = acc.hours?.from ?? "09:00", to = acc.hours?.to ?? "23:00";
  const day = (now.getDay() + 6) % 7; // 0 = Dushanba
  const d = acc.days ?? { from: 0, to: 6 };
  if (day < d.from || day > d.to) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  return toMin(from) <= toMin(to) ? m >= toMin(from) && m < toMin(to) : m >= toMin(from) || m < toMin(to);
}

// Figma: hamkor paneli — "Asosiy" (ish vaqti, hozirgi navbat, haftalik grafik, umumiy ko'rsatkichlar)
export default function Dashboard() {
  const [acc, setAcc] = useState<PartnerAccount | null>(null);
  const [list, setList] = useState<PartnerBooking[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [counts, setCounts] = useState({ branches: 1, staff: 0 });

  useEffect(() => {
    setAcc(readAccount()); setList(readBookings()); setNow(new Date());
    // Restoranlar: asosiy joy + filiallar
    setCounts({ branches: 1 + readBranches().length, staff: readStaff().length });
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const weeks = useMemo(() => (now ? twoWeeks(now) : []), [now]);
  const chart = useRef<HTMLDivElement>(null);
  // Telefonda grafik suriladi — bugungi ustun ko'rinadigan joyga keltiriladi
  useEffect(() => {
    const el = chart.current, on = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (el && on && el.scrollWidth > el.clientWidth) el.scrollLeft = on.offsetLeft - el.clientWidth / 2 + on.offsetWidth / 2;
  }, [weeks.length]);
  if (!acc || !now) return null;
  // To'yxona: CRM ko'rsatkichlari (tadbirlar, so'rovlar, tushum, qarz)
  if (acc.kind === "toyxona") return <HallHome acc={acc} />;

  const today = iso(now);
  const queue = list.filter((b) => b.date === today && b.status === "kutilmoqda").length;
  const yesterdayQueue = list.filter((b) => b.date === iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))).length;
  const sel = weeks.find((d) => d.iso === (pick ?? today)) ?? weeks[0];
  const max = Math.max(...weeks.map((d) => d.count));
  const week1 = weeks.slice(0, 7).reduce((s, d) => s + d.count, 0), week2 = weeks.slice(7).reduce((s, d) => s + d.count, 0);
  const month = monthCount(now.getFullYear(), now.getMonth());
  const prevMonth = monthCount(now.getFullYear(), now.getMonth() - 1);
  const open = isOpen(acc, now);
  const sign = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;

  return (
    <main className="container-page pt-8 md:pt-[57px] lg:pt-[min(57px,4svh)]">
      <Fit gap={24}>
      {/* Ish vaqti */}
      <div className="flex items-center gap-[13px] text-[16px] leading-[20px] text-black">
        <ClockIcon className="size-[21px] shrink-0" />
        Ish vaqti:
      </div>
      <div className="mt-[14px] flex flex-wrap gap-[10px] text-[18px] font-medium leading-[24px]">
        <span className="flex h-[40px] min-w-[70px] items-center justify-center rounded-[8px] bg-[#F0F0F0] px-[12px] tabular-nums">{hh(acc.hours?.from ?? "09:00")}</span>
        <span className="flex h-[40px] min-w-[70px] items-center justify-center rounded-[8px] bg-[#F0F0F0] px-[12px] tabular-nums">{hh(acc.hours?.to ?? "23:00")}</span>
        <span className={`flex h-[40px] min-w-[89px] items-center justify-center rounded-[8px] px-[12px] ${open ? "bg-[#DCFCE7] text-[#22C55E]" : "bg-[#FEE4E2] text-[#D92D20]"}`}>
          {open ? "Ochiq" : "Yopiq"}
        </span>
      </div>

      {/* Hozirgi navbat */}
      <Link href="/panel/kutilayotgan" className="group mt-[26px] fit-tight:mt-[16px] flex h-[127px] fit-tight:h-[100px] items-center justify-between rounded-[20px] bg-[#FF6A00] px-[20px] text-white transition-colors hover:bg-[#F06300] md:px-[26px]">
        <div>
          <span className="flex items-center gap-[14px] text-[18px] leading-[22px]">Hozirgi navbat <ChevronRightIcon className="h-[16px] w-[8px] transition-transform group-hover:translate-x-0.5" /></span>
          <p className="mt-[8px] text-[32px] font-semibold leading-[40px]">{queue} ta</p>
          <p className="mt-[2px] text-[14px] leading-[18px] text-white/90">mijoz band qilgan</p>
        </div>
        <span className="flex items-center gap-[8px] text-[14px]">{sign(growth(queue, yesterdayQueue || queue))} <TrendIcon className="size-[20px] text-white" /></span>
      </Link>

      {/* 1 haftalik band qilishlar */}
      <section className="mt-[16px] overflow-hidden rounded-[20px] bg-[#F8EBE2] md:h-[268px] md:fit-tight:h-[224px]" aria-label="1 haftalik band qilishlar">
        <div className="flex items-start justify-between px-[20px] pt-[25.5px] md:px-[25px]">
          <div>
            <h2 className="text-[16px] leading-[20px] text-black">1 haftalik band qilishlar</h2>
            <p className="mt-[5px] text-[26px] leading-[34px] text-black md:text-[30px]">{sel.weekday}/<b className="font-semibold">{sel.count} ta</b></p>
          </div>
          <span className="mt-[20px] flex items-center gap-[8px] text-[14px] text-black">{sign(growth(week2, week1))} <TrendIcon className={`size-[20px] ${week2 >= week1 ? "text-[#22C55E]" : "text-[#D92D20]"}`} /></span>
        </div>
        <div ref={chart} className="no-scrollbar relative mt-[10px] overflow-x-auto px-[20px] pb-[10px]">
          <div className="flex h-[162px] fit-tight:h-[124px] min-w-[1180px]">
            {[weeks.slice(0, 7), weeks.slice(7)].map((half, h) => (
              <div key={h} className={`flex border-[#C6BCB5] ${h === 0 ? "flex-[601.7] border-x pl-[5px] pr-[20px]" : "flex-[631.5] border-r px-[22px]"} justify-between`}>
                {half.map((d) => {
                  const on = d.iso === sel.iso;
                  return (
                    <button
                      key={d.iso} type="button" onClick={() => setPick(d.iso)} aria-pressed={on}
                      aria-label={`${d.weekday}, ${d.label}: ${d.count} ta`}
                      className="group flex flex-col items-center"
                    >
                      <span className="flex h-[130px] fit-tight:h-[92px] items-end">
                        <span
                          style={{ height: `${((30 + Math.round((d.count / max) * 101)) / 130) * 100}%` }}
                          className={`w-[34.5px] rounded-[8px] pt-[9px] text-center text-[13px] leading-[16px] transition-colors ${on ? "bg-[#FF6A00] text-white" : "bg-white text-black group-hover:bg-[#FFE3CF]"}`}
                        >
                          {d.count}
                        </span>
                      </span>
                      <span className="mt-[5px] whitespace-nowrap text-[12px] leading-[14px] text-black">{d.weekday}<br />{d.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Restoranlar va hodimlar soni */}
      <div className="mt-[16px] grid gap-[16px] md:grid-cols-2 md:gap-[15px]">
        <Link href="/panel/filiallar" className="flex h-[91px] flex-col rounded-[20px] bg-[#F0F0F0] px-[15px] pt-[13px] text-left transition-colors hover:bg-[#EAEAEA]">
          <span className="flex w-full items-center justify-between pr-[4px] text-[16px] leading-[20px] text-black">Restoranlar soni <ChevronRightIcon className="h-[16px] w-[8px]" /></span>
          <span className="mt-[9px] flex items-center gap-[29px] text-[28px] font-semibold leading-[36px] text-black"><StoreIcon className="size-[28px] shrink-0" />{counts.branches} ta</span>
        </Link>
        <Link href="/panel/hodimlar" className="flex h-[91px] flex-col rounded-[20px] bg-[#F0F0F0] px-[15px] pt-[13px] transition-colors hover:bg-[#EAEAEA]">
          <span className="flex items-center justify-between pr-[4px] text-[16px] leading-[20px] text-black">Hodimlar soni <ChevronRightIcon className="h-[16px] w-[8px]" /></span>
          <span className="mt-[9px] flex items-center gap-[29px] text-[28px] font-semibold leading-[36px] text-black"><UsersOutlineIcon className="size-[28px] shrink-0" />{counts.staff} ta</span>
        </Link>
      </div>

      {/* 1 oylik band qilishlar */}
      <section className="mt-[16px] flex h-[116px] items-stretch justify-between rounded-[20px] bg-[#F0F0F0] px-[15px] pb-[13px] pt-[15px]">
        <div className="flex flex-col">
          <h2 className="text-[16px] leading-[20px] text-black">1 oylik band qilishlar</h2>
          <p className="mt-[12.5px] text-[34px] font-semibold leading-[36px] text-black">{month} ta</p>
          <p className="text-[14px] leading-[18px] text-black">mijoz band qildi</p>
        </div>
        <div className="flex flex-col items-end justify-between">
          <span className="text-[16px] leading-[20px] text-black">{MONTHS_UZ[now.getMonth()]}</span>
          <span className="flex items-center gap-[8px] text-[14px] text-black">{sign(growth(month, prevMonth))} <TrendIcon className={`size-[20px] ${month >= prevMonth ? "text-[#22C55E]" : "text-[#D92D20]"}`} /></span>
        </div>
      </section>
      </Fit>
    </main>
  );
}
