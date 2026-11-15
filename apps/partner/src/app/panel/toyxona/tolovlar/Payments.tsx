"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addPayment, BOOKED, fromIsoDay, HOLD, isoDay, num, mln, paid, PAY_METHODS, quote, readEvents, readSettings,
  type HallEvent, type HallSettings,
} from "@bazmly/api/hall";
import { MONTHS_SHORT, MONTHS_UZ } from "@bazmly/api/partnerBookings";
import { ChevronLeftIcon, ChevronRightIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { CrmTabs, PaidBar } from "@/components/hall/CrmTabs";
import { PaymentDialog } from "../bron/EventEditor";

const short = (iso: string) => { const d = fromIsoDay(iso); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };

// To'lovlar: oy tushumi, umumiy qarz, muddati o'tganlar; qarzdorlar ro'yxati va to'lovlar tarixi
export function Payments() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; today: Date } | null>(null);
  const [pay, setPay] = useState<HallEvent | null>(null);
  useEffect(() => { setData({ s: readSettings(), events: readEvents(), today: new Date() }); }, []);
  if (!data) return null;
  const { s, events, today } = data;
  const t = isoDay(today);
  const tab = params.get("bolim") === "tarix" ? "tarix" : "qarz";
  const set = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v === null) sp.delete(k); else sp.set(k, v);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const m = params.get("oy");
  const month = m ? new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1) : new Date(today.getFullYear(), today.getMonth(), 1);
  const mKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const shift = (n: number) => { const d = new Date(month.getFullYear(), month.getMonth() + n, 1); set("oy", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };

  const rows = events.filter((e) => BOOKED.includes(e.stage)).map((e) => {
    const total = quote(s, e).total; const p = paid(e);
    return { e, total, p, rest: Math.max(0, total - p), overdue: !!e.dueDate && e.dueDate < t && total > p };
  });
  const debtors = rows.filter((r) => r.rest > 0).sort((a, b) => (a.e.dueDate ?? a.e.date).localeCompare(b.e.dueDate ?? b.e.date));
  const totalDebt = debtors.reduce((a, r) => a + r.rest, 0);
  const overdue = debtors.filter((r) => r.overdue);
  const history = events.flatMap((e) => e.payments.map((p) => ({ e, p }))).filter((x) => x.p.date.startsWith(mKey)).sort((a, b) => b.p.date.localeCompare(a.p.date));
  const income = history.reduce((a, x) => a + x.p.amount, 0);
  const holds = events.filter((e) => HOLD.includes(e.stage) && e.date >= t);
  const holdValue = holds.reduce((a, e) => a + quote(s, e).deposit, 0);

  return (
    <main className="container-page pb-16 pt-6 font-inter md:pt-8 lg:pt-[min(32px,3svh)]">
      <CrmTabs />
      <h1 className="mt-5 font-sans text-[20px] font-bold text-[#0F172A]">To‘lovlar</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat title={`${MONTHS_UZ[month.getMonth()]} tushumi`} value={`${mln(income)} so‘m`} sub={`${history.length} ta to‘lov`} tone="green" />
        <Stat title="Umumiy qarz" value={`${mln(totalDebt)} so‘m`} sub={`${debtors.length} ta mijoz`} tone="dark" />
        <Stat title="Muddati o‘tgan" value={`${mln(overdue.reduce((a, r) => a + r.rest, 0))} so‘m`} sub={`${overdue.length} ta mijoz`} tone={overdue.length ? "red" : "dark"} />
        <Stat title="Kutilayotgan depozitlar" value={`${mln(holdValue)} so‘m`} sub={`${holds.length} ta so‘rov`} tone="amber" />
      </div>

      <div role="tablist" aria-label="Bo‘lim" className="mt-6 flex gap-2">
        {[{ id: "qarz", label: `Qarzdorlar (${debtors.length})` }, { id: "tarix", label: "To‘lovlar tarixi" }].map((x) => (
          <button key={x.id} role="tab" type="button" aria-selected={tab === x.id} onClick={() => set("bolim", x.id === "qarz" ? null : x.id)}
            className={`h-[36px] rounded-full border px-4 text-[14px] transition-colors ${tab === x.id ? "border-[#FF6A00] bg-[#FF6A00] text-white" : "border-[#E2E8F0] text-[#475569] hover:border-[#FFC9A3]"}`}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === "qarz" ? (
        <ul className="mt-4 space-y-2">
          {debtors.map(({ e, total, p, rest, overdue: late }) => (
            <li key={e.id} className="grid grid-cols-[minmax(0,1fr)] items-center gap-3 rounded-[14px] border border-[#EEF0F3] bg-white p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
              <Link href={`/panel/toyxona/bron?id=${e.id}`} className="min-w-0 hover:text-[#FF6A00]">
                <span className="block truncate text-[15px] font-semibold text-[#0F172A]">{e.name}</span>
                <span className="block text-[13px] text-[#64748B]">Tadbir: {short(e.date)} · {s.halls.find((h) => h.id === e.hallId)?.name}</span>
              </Link>
              <div>
                <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">{num(p)} / {num(total)}</span></div>
                <div className="mt-1.5"><PaidBar paid={p} total={total} /></div>
                <p className={`mt-1 text-[12px] ${late ? "font-medium text-[#DC2626]" : "text-[#64748B]"}`}>{e.dueDate ? `Muddat: ${short(e.dueDate)}${late ? " — o‘tib ketdi" : ""}` : "Muddat belgilanmagan"}</p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-right"><span className="block text-[12px] text-[#64748B]">Qoldiq</span><b className="font-sans text-[16px] text-[#DC2626] tabular-nums">{num(rest)}</b></span>
                <a href={`tel:${e.phone}`} aria-label={`${e.name}ga qo‘ng‘iroq`} className="grid grid-cols-[minmax(0,1fr)] size-[40px] place-items-center rounded-[10px] bg-[#DCFBE7] text-[#16A34A] hover:bg-[#C6F6D5]">✆</a>
                <button type="button" onClick={() => setPay(e)} className="h-[40px] rounded-[10px] bg-[#0F172A] px-4 text-[14px] text-white hover:bg-[#1E293B]">To‘lov</button>
              </div>
            </li>
          ))}
          {!debtors.length && <li className="py-12 text-center text-[15px] text-[#94A3B8]">Qarzdorlar yo‘q — barcha bronlar to‘langan</li>}
        </ul>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={() => shift(-1)} aria-label="Oldingi oy" className="grid grid-cols-[minmax(0,1fr)] size-[34px] place-items-center rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC]"><ChevronLeftIcon className="h-[13px] w-[7px]" /></button>
            <span className="min-w-[130px] text-center text-[15px] font-semibold text-[#0F172A]">{MONTHS_UZ[month.getMonth()]} {month.getFullYear()}</span>
            <button type="button" onClick={() => shift(1)} aria-label="Keyingi oy" className="grid grid-cols-[minmax(0,1fr)] size-[34px] place-items-center rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC]"><ChevronRightIcon className="h-[13px] w-[7px]" /></button>
            <span className="ml-auto text-[14px] text-[#64748B]">Jami: <b className="text-[#16A34A] tabular-nums">{num(income)} so‘m</b></span>
          </div>
          <ul className="mt-3 divide-y divide-[#F1F5F9] rounded-[14px] border border-[#EEF0F3] bg-white">
            {history.map(({ e, p }) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={`/panel/toyxona/bron?id=${e.id}`} className="min-w-0 hover:text-[#FF6A00]">
                  <span className="block truncate text-[15px] text-[#0F172A]">{e.name}</span>
                  <span className="block text-[12px] text-[#94A3B8]">{short(p.date)} · {p.note || "To‘lov"} · {PAY_METHODS.find((x) => x.id === p.method)?.label}</span>
                </Link>
                <b className="shrink-0 font-semibold text-[#16A34A] tabular-nums">+{num(p.amount)}</b>
              </li>
            ))}
            {!history.length && <li className="py-10 text-center text-[14px] text-[#94A3B8]">Bu oyda to‘lov yo‘q</li>}
          </ul>
        </>
      )}

      {pay && (() => {
        const total = quote(s, pay).total; const p = paid(pay);
        return (
          <PaymentDialog title={`To‘lov: ${pay.name}`} suggested={total - p} max={total - p} first={p === 0} onClose={() => setPay(null)}
            onSave={(amount, method, date, note) => { setData({ ...data, events: addPayment(pay.id, { amount, method, date, note }) }); setPay(null); toast(`To‘lov qo‘shildi: ${num(amount)} so‘m`); }} />
        );
      })()}
    </main>
  );
}

function Stat({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: "green" | "dark" | "red" | "amber" }) {
  const c = { green: "text-[#16A34A]", dark: "text-[#0F172A]", red: "text-[#DC2626]", amber: "text-[#B45309]" }[tone];
  return (
    <div className="rounded-[16px] bg-[#F6F7F9] p-4">
      <p className="text-[13px] text-[#64748B]">{title}</p>
      <p className={`mt-1 font-sans text-[18px] font-bold ${c} tabular-nums sm:text-[22px]`}>{value}</p>
      <p className="mt-0.5 text-[12px] text-[#94A3B8]">{sub}</p>
    </div>
  );
}
