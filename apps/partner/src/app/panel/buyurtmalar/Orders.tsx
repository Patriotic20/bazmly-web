"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  elapsed, finishOrder, openFromBooking, orderTotal, readOrders, readTables, syncOrders, syncTables, tableStates, uzs, type Order, type TableState, type Zone,
} from "@bazmly/api/orders";
import { errorText } from "@bazmly/api/client";
import { fromIso, iso, longDate, nextDays, readBookings, setBookingStatus, syncBookings, type BookingStatus, type PartnerBooking } from "@bazmly/api/partnerBookings";
import { syncStaff } from "@bazmly/api/staff";
import { PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { CheckCircleFillIcon, ClockOutlineIcon, PersonFillIcon, FilterLinesIcon, GroupFillIcon, TableFillIcon } from "@/components/panelIcons";
import { CalendarDialog, Card as BookingCard } from "../kutilayotgan/Waiting";

type Tab = "stollar" | "barcha" | "kutilmoqda" | "jarayonda" | "yakunlandi";
const ZONES: { id: "umumiy" | Zone; label: string }[] = [{ id: "umumiy", label: "Umumiy" }, { id: "tashqari", label: "Tashqari" }, { id: "ichkari", label: "Ichkari" }];

const STATUS = {
  keldi: { label: "Keldi", badge: "bg-[#DCFCE7] text-[#16A34A]", circle: "bg-[#DCFCE7] text-[#16A34A]", chip: "bg-[#DCFCE7] text-[#16A34A]" },
  jarayonda: { label: "Jarayonda", badge: "bg-[#FFF0E5] text-[#FF6A00]", circle: "bg-[#FFF0E5] text-[#FF6A00]", chip: "bg-[#FFF0E5] text-[#FF6A00]" },
  tolov: { label: "To‘lov", badge: "bg-[#EFF6FF] text-[#2563EB]", circle: "bg-[#EFF6FF] text-[#2563EB]", chip: "bg-[#EFF6FF] text-[#2563EB]" },
  yakunlandi: { label: "Yakunlandi", badge: "bg-[#EFF6FF] text-[#2563EB]", circle: "bg-[#EFF6FF] text-[#2563EB]", chip: "bg-[#EFF6FF] text-[#2563EB]" },
} as const;

const chip = (on: boolean, blue = false) =>
  `flex h-[38px] shrink-0 items-center gap-[5px] rounded-full border px-[20.5px] text-[14px] transition-colors ${
    on ? (blue ? "border-[#EFF6FF] bg-[#EFF6FF] text-[#2563EB]" : "border-[#FFF0E5] bg-[#FFF0E5] text-[#FF6A00]") : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#FFC9A3]"
  }`;
const Count = ({ n, blue = false }: { n: number; blue?: boolean }) => (
  <span className={`grid h-[20.5px] min-w-[20.5px] place-items-center rounded-full px-[4px] text-[12px] font-medium text-white ${blue ? "bg-[#3B82F6]" : "bg-[#FF6A00]"}`}>{n}</span>
);

// Figma: "Buyurtmalar" — stollar holati, barcha / kelishi kutilmoqda / jarayonda / yakunlangan buyurtmalar
export function Orders() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [finish, setFinish] = useState<Order | null>(null);

  useEffect(() => {
    setOrders(readOrders()); setBookings(readBookings()); setNow(new Date());
    // Stollar, hodimlar (ofitsiant ismi) va bronlar (mijoz ismi) — so'ng cheklar
    const load = () => Promise.all([syncTables(), syncStaff().catch(() => []), syncBookings(nextDays(1)).then(setBookings)])
      .then(() => syncOrders()).then(setOrders).catch(() => {});
    void load();
    const t = setInterval(() => { setNow(new Date()); void syncOrders().then(setOrders).catch(() => {}); }, 30_000);
    return () => clearInterval(t);
  }, []);

  const tab = (params.get("bolim") as Tab) || "stollar";
  const zone = (params.get("zona") as "umumiy" | Zone) || "umumiy";
  const sana = params.get("sana");
  const stol = params.get("stol");
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const set = (p: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(p)) { if (v === null) sp.delete(k); else sp.set(k, v); }
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const date = useMemo(() => (sana ? fromIso(sana) : now), [sana, now]);
  if (!orders || !now || !date) return null;

  const day = iso(date);
  const isToday = day === iso(now);
  const zoneOf = new Map(readTables().map((t) => [t.no, t.zone]));
  const inZone = (table: number) => zone === "umumiy" || zoneOf.get(table) === zone;
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  const dayOrders = orders.filter((o) => o.date === day && inZone(o.table) && (!stol || o.table === Number(stol)))
    .filter((o) => match(`${o.customer} stol ${o.table} ${o.waiter}`));
  const active = dayOrders.filter((o) => o.status !== "yakunlandi");
  const working = dayOrders.filter((o) => o.status === "jarayonda" || o.status === "tolov");
  const done = dayOrders.filter((o) => o.status === "yakunlandi");
  const waiting = bookings.filter((b) => b.date === day && b.status === "kutilmoqda" && inZone(Number(b.table.match(/\d+/)?.[0] ?? 0)))
    .filter((b) => match(`${b.name} ${b.table}`));

  const act = async (b: PartnerBooking, status: BookingStatus) => {
    try { setBookings(await setBookingStatus(b.id, status)); } catch (e) { return toast(errorText(e)); }
    if (status === "keldi") setOrders(await openFromBooking(b).catch(() => readOrders()));
    toast(status === "keldi" ? `${b.name} — keldi, ${b.table.split(" (")[0]} ochildi` : `${b.name} — bron bekor qilindi`);
  };

  const TABS: { id: Tab; label: string; n?: number; blue?: boolean }[] = [
    { id: "stollar", label: "Stollar" },
    { id: "barcha", label: "Barcha Buyurtmalar", n: active.length },
    { id: "kutilmoqda", label: "Kelishi kutilmoqda", n: waiting.length },
    { id: "jarayonda", label: "Buyurtma Jarayonda", n: working.length },
    { id: "yakunlandi", label: "Yakunlandi", n: done.length, blue: true },
  ];
  const sorted = (l: Order[]) => [...l].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <main className="container-page pt-8 font-inter md:pt-[79px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-[20px] font-bold leading-[26px] text-[#0F172A]">Buyurtmalar</h1>
          <p className="mt-[25.5px] text-[14px] leading-[18px] text-[#64748B]">
            {longDate(date)}{stol && <> · Stol {stol} <button type="button" onClick={() => set({ stol: null })} className="ml-1 text-[#FF6A00] hover:underline">✕</button></>}
          </p>
        </div>
        <button type="button" onClick={() => set({ kalendar: "1" })} aria-label="Sana tanlash" aria-haspopup="dialog"
          className="mt-[-13px] grid size-[44px] shrink-0 place-items-center rounded-full border border-[#F1F5F9] bg-white text-[#FF6A00] shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:bg-[#FFF0E5]">
          <FilterLinesIcon className="size-[22px]" />
        </button>
      </div>

      <div role="tablist" aria-label="Bo‘lim" className="no-scrollbar -mx-4 mt-[15px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => set({ bolim: t.id === "stollar" ? null : t.id })} className={chip(tab === t.id, t.blue)}>
            {t.label}{t.n !== undefined && <Count n={t.n} blue={t.blue} />}
          </button>
        ))}
      </div>

      {(
        <p className="mt-[29px] flex flex-wrap items-center gap-x-[14px] gap-y-1 text-[14px] leading-[18px] text-black">
          <span className="flex items-center gap-[6px]"><i className="size-[7px] rounded-full bg-[#FF6A00]" />Buyurtma jarayonda</span>
          <span className="flex items-center gap-[6px]"><i className="size-[7px] rounded-full bg-[#64748B]" />Bo‘sh</span>
          <span className="flex items-center gap-[6px]"><i className="size-[7px] rounded-full bg-[#22C55E]" />Buyurtma yetkazildi</span>
        </p>
      )}
      <div className="no-scrollbar -mx-4 mt-[18px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Zona">
        {ZONES.map((z) => (
          <button key={z.id} type="button" aria-pressed={zone === z.id} onClick={() => set({ zona: z.id === "umumiy" ? null : z.id })}
            className={`h-[38px] shrink-0 rounded-full border px-[20.5px] text-[15px] transition-colors ${zone === z.id ? "border-[#FFAD73] bg-[#FFF0E5] md:px-[49px] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#111827] hover:border-[#FFC9A3]"}`}>
            {z.label}
          </button>
        ))}
      </div>

      <section className="mt-[20px]" aria-live="polite">
        {tab === "stollar" && <TablesGrid states={tableStates(orders.filter((o) => o.date === day), isToday ? now : new Date(`${day}T23:59`)).filter((s) => inZone(s.t.no))} onPick={(s) => {
          if (s.state === "bosh") toast(`Stol ${String(s.t.no).padStart(2, "0")} bo‘sh`);
          else set({ bolim: s.state === "yakunlangan" ? "yakunlandi" : "barcha", stol: String(s.t.no) });
        }} />}

        {tab === "barcha" && <List items={sorted(active)} empty="Faol buyurtmalar yo‘q" render={(o) => <OrderCard o={o} now={now} mode="summary" />} />}
        {tab === "jarayonda" && <List items={sorted(working)} empty="Jarayondagi buyurtmalar yo‘q" gap={16} render={(o) => <OrderCard o={o} now={now} mode="items" onFinish={() => setFinish(o)} />} />}
        {tab === "yakunlandi" && <List items={sorted(done)} empty="Yakunlangan buyurtmalar yo‘q" gap={16} render={(o) => <OrderCard o={o} now={now} mode="done" />} />}
        {tab === "kutilmoqda" && (
          <>
            <ul className="space-y-[16px]">
              {waiting.map((b) => <li key={b.id}><BookingCard b={b} showDate={false} onArrive={() => void act(b, "keldi")} onCancel={() => void act(b, "bekor")} /></li>)}
            </ul>
            <p className="mt-[34px] text-center text-[14px] text-[#94A3B8]">{waiting.length ? "Barcha buyurtmalar ko‘rsatildi" : "Kelishi kutilayotgan mijozlar yo‘q"}</p>
          </>
        )}
      </section>

      {params.get("kalendar") === "1" && (
        <CalendarDialog initial={date} today={now} onClose={() => set({ kalendar: null })}
          onPick={(d) => set({ kalendar: null, sana: iso(d) === iso(now) ? null : iso(d) })} />
      )}
      {finish && (
        <FinishDialog o={finish} onClose={() => setFinish(null)} onConfirm={async () => {
          const o = finish; setFinish(null);
          try { setOrders(await finishOrder(o.id)); } catch (e) { return toast(errorText(e)); }
          toast(`Stol ${o.table} yopildi — chek chop etildi`);
        }} />
      )}
    </main>
  );
}

function List({ items, render, empty, gap = 10 }: { items: Order[]; render: (o: Order) => React.ReactNode; empty: string; gap?: number }) {
  return (
    <>
      <ul className="flex flex-col" style={{ gap }}>{items.map((o) => <li key={o.id}>{render(o)}</li>)}</ul>
      <p className="mt-[26px] text-center text-[14px] text-[#94A3B8]">{items.length ? "Barcha buyurtmalar ko‘rsatildi" : empty}</p>
    </>
  );
}

// ——— Stollar ———
const TableIcon = ({ className = "" }: { className?: string }) => <TableFillIcon className={className} />;
const CashIcon = () => (
  <svg viewBox="0 0 24 20" className="h-[18px] w-[23px] text-[#3B82F6]" fill="currentColor" aria-hidden>
    <rect x="0" y="0" width="19" height="13" rx="2.5" /><circle cx="9.5" cy="6.5" r="3" fill="#fff" /><path d="M21.5 4v9.5a2.5 2.5 0 01-2.5 2.5H4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);
const CardPayIcon = () => (
  <svg viewBox="0 0 22 18" className="h-[17px] w-[21px] text-[#3B82F6]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="1" y="1" width="20" height="16" rx="2.5" /><path d="M1 6.5h20" /></svg>
);

function TablesGrid({ states, onPick }: { states: TableState[]; onPick: (s: TableState) => void }) {
  if (!states.length) return <p className="py-10 text-center text-[14px] text-[#94A3B8]">Bu zonada stol yo‘q</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-[20px] sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-[64px]">
      {states.map((s) => {
        const no = String(s.t.no).padStart(2, "0");
        const tone = {
          bosh: { border: "border border-[#F1F5F9]", badge: "bg-[#F1F5F9] text-[#475569]", label: "Bo‘sh", foot: "text-[#94A3B8]" },
          jarayonda: { border: "border-l-[4px] border-[#FF6A00]", badge: "bg-[#FFF0E5] text-[#FF6A00]", label: "Jarayonda", foot: "text-[#FF6A00]" },
          tolov: { border: "border-l-[4px] border-[#3B82F6]", badge: "bg-[#EFF6FF] text-[#2563EB]", label: "To‘lov", foot: "text-[#64748B]" },
          yakunlangan: { border: "border-l-[4px] border-[#4CCAA0]", badge: "bg-[#ECFDF5] text-[#059669]", label: "Yakunlangan", foot: "text-[#64748B]" },
        }[s.state];
        return (
          <li key={s.t.no}>
            <button type="button" onClick={() => onPick(s)} aria-label={`Stol ${no} — ${tone.label}`}
              className={`flex h-[169.5px] w-full flex-col items-center rounded-[16px] bg-white pb-[22px] pl-[22px] pr-[18px] pt-[19px] text-left transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] ${tone.border}`}>
              <span className="flex w-full items-start justify-between">
                <span className={`flex h-[22px] items-center rounded-[6px] px-[9px] text-[13px] ${tone.badge}`}>{tone.label}</span>
                {s.state === "bosh" && <TableIcon className="size-[22px] text-[#CBD5E1]" />}
                {s.state === "jarayonda" && s.order && <span className="mr-auto pl-[14px] text-[13px] text-[#94A3B8] tabular-nums">{s.order.time}</span>}
                {s.state === "tolov" && (s.order?.pay === "karta" ? <CardPayIcon /> : <CashIcon />)}
                {s.state === "yakunlangan" && <CheckCircleFillIcon className="mr-auto ml-[5px] -mt-[2px] size-[27px] text-[#10B981]" />}
              </span>
              <span className="mt-[21px] text-[36px] font-bold leading-[42px] text-[#0F172A] tabular-nums">{no}</span>
              <span className={`mt-auto flex items-center gap-[6px] text-[15px] ${tone.foot}`}>
                {s.state === "bosh" ? <PersonFillIcon className="size-[15px]" /> : <GroupFillIcon className="size-[17px]" />}{s.t.seats} kishilik stol
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ——— Buyurtma kartasi ———
function OrderCard({ o, now, mode, onFinish }: { o: Order; now: Date; mode: "summary" | "items" | "done"; onFinish?: () => void }) {
  const st = STATUS[o.status];
  const [open, setOpen] = useState(false);
  const total = orderTotal(o);
  const shown = open ? o.items : o.items.slice(0, 3);
  const head = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-[14px]">
        <span className={`grid size-[41px] place-items-center rounded-full text-[18px] font-semibold ${st.circle}`}>{o.table}</span>
        <span>
          <span className="block text-[16px] font-bold leading-[20px] text-[#0F172A]">Stol {o.table}</span>
          <span className="block text-[12px] leading-[16px] text-[#64748B]">Ofitsiant: {o.waiter}</span>
        </span>
      </div>
      <span className={`flex h-[24px] items-center gap-[6px] rounded-[6px] px-[9px] text-[12px] ${st.chip}`}>
        <ClockOutlineIcon className="size-[14px]" />{elapsed(o.startedAt, o.finishedAt ?? now.toISOString())}
      </span>
    </div>
  );
  const sum = (
    <div className="flex items-end justify-between pt-[18px]">
      <span className="pb-[2px] text-[14px] text-[#475569]">Jami summa:</span>
      <span className={`${mode === "items" ? "text-[22px]" : "text-[20px]"} font-bold leading-[26px] text-[#0F172A] tabular-nums`}>{total ? uzs(total) : "—"}</span>
    </div>
  );
  const meta = (
    <>
      <p className="mt-[10px] flex items-center gap-[10px] text-[14px] leading-[20px] text-[#475569]"><ClockOutlineIcon className="size-[16px] text-black" /><span className="tabular-nums">{o.time}</span></p>
      <p className="mt-[18px] flex items-center gap-[16px] text-[14px] leading-[20px] text-[#64748B]">
        <span className="flex items-center gap-[8px]"><GroupFillIcon className="size-[18px]" />{o.people} kishi</span>
        <span className="flex items-center gap-[8px]"><TableFillIcon className="size-[18px]" />Stol {String(o.table).padStart(2, "0")}</span>
      </p>
    </>
  );

  if (mode === "done") {
    return (
      <article className="relative rounded-[16px] border border-[#F1F5F9] bg-[#F9FBFD] px-[16.5px] pb-[14px] pt-[15px]">
        <span className={`absolute right-[16.5px] top-[18px] flex h-[26px] items-center rounded-[6px] px-[10px] text-[12px] font-bold ${st.badge}`}>{st.label}</span>
        <h3 className="pl-[8px] pr-[110px] text-[18px] font-bold leading-[24px] text-[#334155]">{o.customer}</h3>
        <div className="pl-[8px]">{meta}</div>
        <div className="mt-[13px] border-t border-[#E2E8F0]">{sum}</div>
      </article>
    );
  }
  if (mode === "summary") {
    return (
      <article className="rounded-[16px] border border-[#F1F5F9] bg-[#F9FBFD] px-[16.5px] pb-[14px] pt-[11.5px]">
        {head}
        <div className="relative mt-[31.5px]">
          <span className={`absolute right-0 top-[2px] flex h-[26px] items-center rounded-[6px] px-[10px] text-[12px] font-bold ${st.badge}`}>{st.label}</span>
          <h3 className="pr-[110px] text-[18px] font-bold leading-[24px] text-[#334155]">{o.customer}</h3>
          {meta}
        </div>
        <div className="mt-[13px] border-t border-[#E2E8F0]">{sum}</div>
      </article>
    );
  }
  return (
    <article className="rounded-[16px] border border-[#F1F5F9] bg-white pb-[17px]">
      <div className="border-b border-[#F1F5F9] px-[16.5px] pb-[20.5px] pt-[11.5px]">{head}</div>
      <div className="px-[16.5px]">
        {o.items.length ? (
          <ul className="mt-[15px] space-y-[10px] text-[15px] leading-[18px] text-[#334155]">
            {shown.map((i) => (
              <li key={i.dishId} className="flex justify-between gap-4">
                <span className="flex gap-[14px]"><span className="w-[18px] text-[#475569] tabular-nums">{i.qty}x</span>{i.name}</span>
                <span className="text-[#475569] tabular-nums">{(i.qty * i.price).toLocaleString("en-US")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-[16px] text-[14px] text-[#94A3B8]">Hali taom qo‘shilmagan</p>}
        {o.items.length > 3 && (
          <button type="button" onClick={() => setOpen(!open)} className="mt-[9px] text-[12px] text-[#94A3B8] hover:text-[#FF6A00]">
            {open ? "− yashirish" : `+ yana ${o.items.length - 3} ta mahsulot`}
          </button>
        )}
        <div className="mt-[12px] border-t border-[#E2E8F0]">{sum}</div>
        <div className="mt-[14.5px] flex flex-wrap gap-[10.5px]">
          <Link href={`/panel/menyu?buyurtma=${o.id}`} className="flex h-[62px] w-[155.5px] items-center justify-center gap-[12px] rounded-[8px] border border-[#FF6A00] bg-white text-[15px] text-[#FF6A00] transition-colors hover:bg-[#FFF8F3]">
            Qo‘shish <PlusIcon className="size-[15px]" />
          </Link>
          <button type="button" onClick={onFinish} className="flex h-[62px] w-[156.5px] items-center justify-center gap-[12px] rounded-[8px] bg-[#FF6A00] text-[15px] text-white transition-colors hover:bg-[#F06300]">
            Yakunlash
            <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1.5 6.5l4 4L14.5 1.5" /></svg>
          </button>
        </div>
      </div>
    </article>
  );
}

function FinishDialog({ o, onClose, onConfirm }: { o: Order; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="fin-t" className="w-full max-w-[340px] rounded-[20px] bg-white px-[24px] pb-[24px] pt-[24px] text-center font-inter">
        <span className="mx-auto grid size-[78px] place-items-center rounded-full bg-[#FDF4F0]" aria-hidden>
          <svg viewBox="0 0 32 32" className="size-[32px] text-[#FF6A00]" fill="currentColor">
            <path d="M8 2l2.4 2L13 2l2.6 2L18 2l2.6 2L23 2l2 1.6V25a3 3 0 01-3 3h-1V27h0a2 2 0 002-2V25H8V2z" />
            <rect x="11" y="8" width="7" height="2.2" rx=".6" fill="#fff" /><rect x="19.5" y="8" width="2.5" height="2.2" rx=".6" fill="#fff" />
            <rect x="11" y="12" width="7" height="2.2" rx=".6" fill="#fff" /><rect x="19.5" y="12" width="2.5" height="2.2" rx=".6" fill="#fff" />
            <path d="M3 21h17v5a2 2 0 002 2H6a3 3 0 01-3-3v-4z" />
          </svg>
        </span>
        <h2 id="fin-t" className="mt-[30px] text-[20px] font-bold leading-[26px] text-[#0F172A]">Buyurtmani yakunlaysizmi?</h2>
        <p className="mx-auto mt-[32px] max-w-[240px] text-[14px] leading-[18px] text-[#64748B]">Ushbu harakat stolni yopadi va chekni chop etadi.</p>
        <p className="sr-only">Stol {o.table}, {o.customer}</p>
        <button type="button" autoFocus onClick={onConfirm} className="mt-[33px] flex h-[52px] w-full items-center justify-center gap-[10px] rounded-[10px] bg-[#FF6A00] text-[16px] font-medium text-white hover:bg-[#F06300]">
          Ha, yakunlash
          <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1.5 6.5l4 4L14.5 1.5" /></svg>
        </button>
        <button type="button" onClick={onClose} className="mt-[22px] text-[16px] text-[#475569] hover:text-[#0F172A]">Bekor qilish</button>
      </div>
    </div>
  );
}
