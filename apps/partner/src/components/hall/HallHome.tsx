"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BOOKED, EVENT_TYPES, fromIsoDay, HOLD, reminders, isoDay, mln, paid, quote, readBlocks, readEvents, readSettings, slotState,
  type HallEvent, type HallSettings,
} from "@bazmly/api/hall";
import type { PartnerAccount } from "@bazmly/api/partner";
import { MONTHS_SHORT, MONTHS_UZ, WEEKDAYS_UZ } from "@bazmly/api/partnerBookings";
import { ChevronRightIcon, PlusIcon } from "@bazmly/ui/icons";
import { PaidBar } from "./CrmTabs";

const dayLabel = (iso: string, today: string) => {
  if (iso === today) return "Bugun";
  const d = fromIsoDay(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${WEEKDAYS_UZ[d.getDay()]}`;
};

// To'yxona uchun "Asosiy": yaqin tadbir, oy ko'rsatkichlari, yaqin 7 kun, javob kutayotgan so'rovlar
export function HallHome({ acc }: { acc: PartnerAccount }) {
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; now: Date } | null>(null);
  useEffect(() => { setData({ s: readSettings(), events: readEvents(), now: new Date() }); }, []);
  if (!data) return null;
  const { s, events, now } = data;
  const today = isoDay(now);
  const mKey = today.slice(0, 7);
  const booked = events.filter((e) => BOOKED.includes(e.stage));
  const upcoming = booked.filter((e) => e.date >= today).sort((a, b) => (a.date + a.session).localeCompare(b.date + b.session));
  const next = upcoming[0];
  const week = upcoming.filter((e) => e.date <= isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)));
  const requests = events.filter((e) => HOLD.includes(e.stage) && e.date >= today).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const income = events.flatMap((e) => e.payments).filter((p) => p.date.startsWith(mKey)).reduce((a, p) => a + p.amount, 0);
  const debt = booked.reduce((a, e) => a + Math.max(0, quote(s, e).total - paid(e)), 0);
  const overdue = booked.filter((e) => e.dueDate && e.dueDate < today && quote(s, e).total > paid(e)).length;
  // Shu oy: band seanslar ulushi
  const blocks = readBlocks();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let b = 0, t = 0;
  for (let i = 1; i <= days; i++) {
    const iso = isoDay(new Date(now.getFullYear(), now.getMonth(), i));
    for (const h of s.halls) for (const se of s.sessions) { t++; if (slotState(events, blocks, iso, h.id, se.id).state === "band") b++; }
  }
  const todo = reminders(events, s, today);
  const hallName = (id: string) => s.halls.find((h) => h.id === id)?.name ?? "";
  const sessionName = (id: string) => s.sessions.find((x) => x.id === id)?.label ?? "";

  return (
    <main className="container-page pb-12 pt-8 font-inter md:pt-[57px] lg:pt-[min(48px,4svh)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-[22px] font-bold text-[#0F172A]">{acc.name}</h1>
          <p className="mt-1 text-[14px] text-[#64748B]">{now.getDate()} {MONTHS_UZ[now.getMonth()]}, {WEEKDAYS_UZ[now.getDay()]}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/panel/toyxona" className="flex h-[40px] items-center rounded-full border border-[#E2E8F0] px-4 text-[14px] text-[#334155] hover:bg-[#F8FAFC]">Kalendar</Link>
          <Link href="/panel/toyxona/bron?yangi=1" className="flex h-[40px] items-center gap-2 rounded-full bg-[#FF6A00] px-4 font-sans text-[15px] text-white hover:bg-[#F06300]">Yangi bron <PlusIcon className="size-[13px]" /></Link>
        </div>
      </div>

      {next ? (
        <Link href={`/panel/toyxona/bron?id=${next.id}`} className="group mt-6 flex items-center justify-between gap-4 rounded-[20px] bg-[#FF6A00] px-5 py-5 text-white transition-colors hover:bg-[#F06300] md:px-7">
          <span className="min-w-0">
            <span className="text-[15px] text-white/85">{next.date === today ? "Bugungi tadbir" : "Yaqin tadbir"} · {dayLabel(next.date, today)}</span>
            <span className="mt-1 block truncate font-sans text-[26px] font-semibold leading-tight md:text-[30px]">{next.name}</span>
            <span className="mt-1 block text-[14px] text-white/90">{EVENT_TYPES.find((x) => x.id === next.eventType)?.label} · {next.guests} kishi · {hallName(next.hallId)} · {sessionName(next.session)}</span>
          </span>
          <ChevronRightIcon className="h-[18px] w-[9px] shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <div className="mt-6 rounded-[20px] bg-[#FFF0E5] px-6 py-6 text-[15px] text-[#C2410C]">Yaqin kunlarda tadbir yo‘q</div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat href="/panel/toyxona/tolovlar?bolim=tarix" title={`${MONTHS_UZ[now.getMonth()]} tushumi`} value={`${mln(income)} so‘m`} />
        <Stat href="/panel/toyxona" title="Band seanslar (shu oy)" value={`${t ? Math.round((b / t) * 100) : 0}%`} sub={`${b} / ${t}`} />
        <Stat href="/panel/toyxona/bronlar" title="Javob kutayotgan so‘rovlar" value={`${requests.length} ta`} tone={requests.length ? "amber" : undefined} />
        <Stat href="/panel/toyxona/tolovlar" title="Umumiy qarz" value={`${mln(debt)} so‘m`} sub={overdue ? `${overdue} ta muddati o‘tgan` : undefined} tone={overdue ? "red" : undefined} />
      </div>

      {todo.length > 0 && (
        <section aria-labelledby="h-todo" className="mt-4 rounded-[20px] border border-[#FFD8BD] bg-[#FFF8F3] p-4 md:p-5">
          <h2 id="h-todo" className="flex items-center justify-between text-[16px] font-semibold text-[#0F172A]">
            Bugungi ishlar <span className="ml-2 rounded-full bg-[#FF6A00] px-2 text-[12px] text-white">{todo.length}</span>
            <Link href="/panel/toyxona/eslatmalar" className="ml-auto text-[14px] font-normal text-[#FF6A00] hover:underline">Barcha eslatmalar</Link>
          </h2>
          <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 md:grid-cols-3">
            {todo.slice(0, 3).map((r) => (
              <li key={r.key}>
                <Link href={r.kind === "tayyorgarlik" ? `/panel/toyxona/tadbir?id=${r.event.id}` : `/panel/toyxona/bron?id=${r.event.id}`} className="block h-full rounded-[14px] bg-white p-3 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
                  <span className={`block text-[14px] font-semibold ${r.urgent ? "text-[#DC2626]" : "text-[#0F172A]"}`}>{r.title}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-[#475569]">{r.event.name}</span>
                  <span className="block text-[12px] text-[#94A3B8]">{r.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <section aria-labelledby="h-week" className="rounded-[20px] bg-[#F6F7F9] p-4 md:p-5">
          <h2 id="h-week" className="flex items-center justify-between text-[16px] font-semibold text-[#0F172A]">Yaqin 7 kun <span className="text-[14px] font-normal text-[#64748B]">{week.length} ta tadbir</span></h2>
          <ul className="mt-3 space-y-2">
            {week.map((e) => {
              const total = quote(s, e).total; const p = paid(e);
              return (
                <li key={e.id}>
                  <Link href={`/panel/toyxona/bron?id=${e.id}`} className="block rounded-[14px] bg-white p-3 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[15px] font-semibold text-[#0F172A]">{e.name}</span>
                      <span className="shrink-0 text-[13px] text-[#FF6A00]">{dayLabel(e.date, today)}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] text-[#64748B]">{e.guests} kishi · {hallName(e.hallId)} · {sessionName(e.session)}</span>
                    <span className="mt-2 block"><PaidBar paid={p} total={total} /></span>
                  </Link>
                </li>
              );
            })}
            {!week.length && <li className="py-6 text-center text-[14px] text-[#94A3B8]">Bu hafta tadbir yo‘q</li>}
          </ul>
        </section>
        <section aria-labelledby="h-req" className="rounded-[20px] bg-[#F6F7F9] p-4 md:p-5">
          <h2 id="h-req" className="flex items-center justify-between text-[16px] font-semibold text-[#0F172A]">
            Javob kutayotgan so‘rovlar <Link href="/panel/toyxona/bronlar" className="text-[14px] font-normal text-[#FF6A00] hover:underline">Barchasi</Link>
          </h2>
          <ul className="mt-3 space-y-2">
            {requests.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-[14px] bg-white p-3">
                <Link href={`/panel/toyxona/bron?id=${e.id}`} className="min-w-0 flex-1 hover:text-[#FF6A00]">
                  <span className="block truncate text-[15px] font-semibold text-[#0F172A]">{e.name}</span>
                  <span className="block text-[13px] text-[#64748B]">{dayLabel(e.date, today)} · {e.guests} kishi · {hallName(e.hallId)}</span>
                </Link>
                <a href={`tel:${e.phone}`} aria-label={`${e.name}ga qo‘ng‘iroq`} className="grid grid-cols-[minmax(0,1fr)] size-[38px] shrink-0 place-items-center rounded-[10px] bg-[#DCFBE7] text-[#16A34A] hover:bg-[#C6F6D5]">✆</a>
              </li>
            ))}
            {!requests.length && <li className="py-6 text-center text-[14px] text-[#94A3B8]">Yangi so‘rov yo‘q</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ href, title, value, sub, tone }: { href: string; title: string; value: string; sub?: string; tone?: "red" | "amber" }) {
  return (
    <Link href={href} className="rounded-[20px] bg-[#F0F0F0] px-4 py-3.5 transition-colors hover:bg-[#EAEAEA]">
      <span className="flex items-center justify-between text-[14px] text-[#475569]">{title}<ChevronRightIcon className="h-[12px] w-[6px]" /></span>
      <span className={`mt-1 block font-sans text-[19px] font-semibold sm:text-[24px] ${tone === "red" ? "text-[#DC2626]" : tone === "amber" ? "text-[#B45309]" : "text-black"}`}>{value}</span>
      {sub && <span className="block text-[12px] text-[#64748B]">{sub}</span>}
    </Link>
  );
}
