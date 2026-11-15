"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_CHECKLIST, defaultTimeline, EVENT_TYPES, fromIsoDay, getEvent, num, paid, quote, readEvents, readSettings, saveEvent,
  stageInfo, staffBusy, tablesNeeded, waitersNeeded, type Check, type HallEvent, type HallSettings, type TimeItem,
} from "@bazmly/api/hall";
import { MONTHS_UZ, WEEKDAYS_UZ } from "@bazmly/api/partnerBookings";
import { readStaff, roleLabel, type Role, type Staff } from "@bazmly/api/staff";
import { ChevronLeftIcon, PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { StageBadge } from "@/components/hall/CrmTabs";
import { TIME_SLOTS } from "@/components/TimeField";

const card = "rounded-[16px] border border-[#EEF0F3] bg-white p-4 sm:p-5 print:break-inside-avoid print:border-[#CBD5E1]";
const ROLE_ORDER: Role[] = ["ofitsiant", "oshpaz", "oshpaz-yordamchisi", "menejer", "qoriqchi", "admin"];
const fmtQty = (n: number, unit: string) => (unit === "dona" ? Math.ceil(n).toString() : n >= 10 ? Math.ceil(n).toString() : (Math.round(n * 10) / 10).toString().replace(".", ","));

// Tadbir rejasi: stollar va ofitsiantlar soni, hodimlarni biriktirish, vaqt jadvali, oshxona uchun mahsulot hisobi, tayyorgarlik ro'yxati
export function EventDay() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const id = params.get("id") ?? "";
  const [s, setS] = useState<HallSettings | null>(null);
  const [e, setE] = useState<HallEvent | null | undefined>(undefined);
  const [all, setAll] = useState<HallEvent[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newCheck, setNewCheck] = useState("");
  useEffect(() => { setS(readSettings()); setE(getEvent(id) ?? null); setAll(readEvents()); setStaff(readStaff().filter((x) => x.active)); }, [id]);

  if (e === null) return (
    <main className="container-page pt-16 text-center font-inter">
      <p className="text-[16px] text-[#64748B]">Tadbir topilmadi.</p>
      <Link href="/panel/toyxona/bronlar" className="mt-4 inline-block text-[#FF6A00] hover:underline">Bronlarga qaytish</Link>
    </main>
  );
  if (!s || !e) return null;

  const update = (p: Partial<HallEvent>) => { const next = saveEvent({ ...e, ...p }); setE(next); setAll(readEvents()); };
  const d = fromIsoDay(e.date);
  const hall = s.halls.find((h) => h.id === e.hallId);
  const session = s.sessions.find((x) => x.id === e.session);
  const q = quote(s, e);
  const rest = Math.max(0, q.total - paid(e));
  const tables = tablesNeeded(s, e.guests);
  const needW = waitersNeeded(s, e.guests);
  const assigned = e.staff ?? [];
  const waiters = assigned.filter((sid) => staff.find((x) => x.id === sid)?.role === "ofitsiant").length;
  const timeline = e.timeline ?? defaultTimeline(e);
  const checklist = e.checklist ?? DEFAULT_CHECKLIST;
  const pkg = q.pkg;

  const toggleStaff = (sid: string) => {
    const on = assigned.includes(sid);
    const busy = staffBusy(all, e, sid);
    if (!on && busy) toast(`Diqqat: bu hodim shu vaqtda “${busy.name}” tadbiriga ham biriktirilgan`);
    update({ staff: on ? assigned.filter((x) => x !== sid) : [...assigned, sid] });
  };
  const setTimeline = (t: TimeItem[]) => update({ timeline: [...t].sort((a, b) => a.time.localeCompare(b.time)) });
  const setChecklist = (c: Check[]) => update({ checklist: c });
  const groups = ROLE_ORDER.map((r) => ({ r, list: staff.filter((x) => x.role === r) })).filter((g) => g.list.length);

  return (
    <main className="container-page pb-24 pt-6 font-inter md:pt-8 lg:pt-[min(32px,3svh)] print:w-full print:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => router.push(`/panel/toyxona/bron?id=${e.id}`)} aria-label="Orqaga" className="-ml-[9px] grid grid-cols-[minmax(0,1fr)] size-[40px] shrink-0 place-items-center rounded-full text-[#FF6A00] hover:bg-[#FFF0E5] print:hidden">
            <ChevronLeftIcon className="h-[20px] w-[10px]" />
          </button>
          <div>
            <p className="text-[13px] font-medium uppercase tracking-wide text-[#FF6A00]">Tadbir rejasi</p>
            <h1 className="font-sans text-[22px] font-bold leading-[30px] text-[#0F172A]">{e.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-[#64748B]">
              <StageBadge {...stageInfo(e.stage)} />
              {d.getDate()} {MONTHS_UZ[d.getMonth()]}, {WEEKDAYS_UZ[d.getDay()]} · {session?.label} {session?.from}–{session?.to} · {hall?.name} · {EVENT_TYPES.find((x) => x.id === e.eventType)?.label}
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href={`/panel/toyxona/bron?id=${e.id}`} className="flex h-[42px] items-center rounded-full border border-[#E2E8F0] px-4 text-[14px] text-[#475569] hover:bg-[#F8FAFC]">Bron kartasi</Link>
          <button type="button" onClick={() => window.print()} className="h-[42px] rounded-full bg-[#0F172A] px-5 text-[14px] text-white hover:bg-[#1E293B]">Chop etish</button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Big title="Mehmonlar" value={`${e.guests}`} sub={`${hall?.name} · ${hall?.capacity} kishigacha`} />
        <Big title="Stollar" value={`${tables}`} sub={`${s.tableSize} kishidan`} />
        <Big title="Ofitsiantlar" value={`${waiters} / ${needW}`} sub={waiters >= needW ? "Yetarli" : `Yana ${needW - waiters} ta kerak`} tone={waiters >= needW ? "green" : "red"} />
        <Big title="Qolgan to‘lov" value={rest ? num(rest) : "To‘langan"} sub={rest ? "so‘m" : "To‘liq"} tone={rest ? "red" : "green"} />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2 lg:items-start print:grid-cols-2">
        <section className={card} aria-labelledby="h-staff">
          <h2 id="h-staff" className="font-sans text-[16px] font-bold text-[#0F172A]">Hodimlar <span className="text-[14px] font-normal text-[#64748B]">· {assigned.length} ta biriktirilgan</span></h2>
          {!groups.length && <p className="mt-3 text-[14px] text-[#94A3B8]">Aktiv hodimlar yo‘q. <Link href="/panel/hodimlar/yangi" className="text-[#FF6A00] hover:underline">Hodim qo‘shish</Link></p>}
          <div className="mt-3 space-y-4">
            {groups.map(({ r, list }) => (
              <div key={r}>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#94A3B8]">{roleLabel(r)} · {list.filter((x) => assigned.includes(x.id)).length}/{list.length}</p>
                <ul className="mt-1.5 grid grid-cols-[minmax(0,1fr)] gap-1.5 sm:grid-cols-2">
                  {list.map((x) => {
                    const on = assigned.includes(x.id);
                    const busy = staffBusy(all, e, x.id);
                    return (
                      <li key={x.id} className={on ? "" : "print:hidden"}>
                        <label className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2 text-[14px] transition-colors ${on ? "border-[#FFC9A3] bg-[#FFF8F3]" : "border-[#EEF0F3] hover:border-[#E2E8F0]"}`}>
                          <input type="checkbox" checked={on} onChange={() => toggleStaff(x.id)} className="size-4 accent-[#FF6A00]" />
                          <span className="min-w-0 flex-1 truncate text-[#0F172A]">{x.name}</span>
                          {busy && <span title={`Shu vaqtda: ${busy.name}`} className="shrink-0 rounded-[6px] bg-[#FFF8EB] px-1.5 text-[11px] text-[#B45309]">band</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={card} aria-labelledby="h-time">
          <div className="flex items-center justify-between">
            <h2 id="h-time" className="font-sans text-[16px] font-bold text-[#0F172A]">Vaqt jadvali</h2>
            <button type="button" onClick={() => { update({ timeline: undefined }); toast("Standart jadval tiklandi"); }} className="text-[13px] text-[#94A3B8] hover:text-[#475569] print:hidden">Standart jadval</button>
          </div>
          <ol className="mt-3 space-y-2">
            {timeline.map((t, i) => (
              <li key={i} className="flex gap-2">
                <select value={t.time} onChange={(ev) => setTimeline(timeline.map((x, j) => (j === i ? { ...x, time: ev.target.value } : x)))} aria-label="Vaqt"
                  className="h-[40px] w-[92px] shrink-0 rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-[14px] font-semibold tabular-nums text-[#FF6A00] outline-none focus:border-[#FF6A00]">
                  {[...new Set([...TIME_SLOTS, t.time])].sort().map((x) => <option key={x}>{x}</option>)}
                </select>
                <input value={t.text} onChange={(ev) => setTimeline(timeline.map((x, j) => (j === i ? { ...x, text: ev.target.value } : x)))} aria-label="Tadbir bosqichi"
                  className="h-[40px] min-w-0 flex-1 rounded-[10px] border border-[#E2E8F0] px-3 text-[14px] outline-none focus:border-[#FF6A00]" />
                <button type="button" onClick={() => setTimeline(timeline.filter((_, j) => j !== i))} aria-label="O‘chirish" className="grid grid-cols-[minmax(0,1fr)] size-[40px] shrink-0 place-items-center rounded-[10px] text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] print:hidden">✕</button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setTimeline([...timeline, { time: timeline.at(-1)?.time ?? "18:00", text: "" }])} className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-[#FF6A00] hover:underline print:hidden"><PlusIcon className="size-[12px]" />Qator qo‘shish</button>
        </section>

        <section className={card} aria-labelledby="h-kitchen">
          <h2 id="h-kitchen" className="font-sans text-[16px] font-bold text-[#0F172A]">Oshxona uchun mahsulotlar</h2>
          {pkg ? (
            <>
              <p className="mt-1 text-[14px] text-[#64748B]">{pkg.name} dasturxon · {e.guests} mehmon · {pkg.items}</p>
              {pkg.norms?.length ? (
                <table className="mt-3 w-full text-[14px]">
                  <thead><tr className="text-left text-[12px] text-[#94A3B8]"><th className="pb-2 font-medium">Mahsulot</th><th className="pb-2 text-right font-medium">1 kishiga</th><th className="pb-2 text-right font-medium">Jami</th></tr></thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {pkg.norms.map((n) => (
                      <tr key={n.name}>
                        <td className="py-2 text-[#0F172A]">{n.name}</td>
                        <td className="py-2 text-right tabular-nums text-[#64748B]">{String(n.qty).replace(".", ",")} {n.unit}</td>
                        <td className="py-2 text-right font-semibold tabular-nums text-[#0F172A]">{fmtQty(n.qty * e.guests, n.unit)} {n.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="mt-3 text-[14px] text-[#94A3B8]">Bu paket uchun me’yorlar kiritilmagan. <Link href="/panel/toyxona/paketlar" className="text-[#FF6A00] hover:underline">Zallar va narxlar</Link></p>}
              <p className="mt-3 text-[12px] text-[#94A3B8] print:hidden">Me’yorlarni “Zallar va narxlar” bo‘limida o‘zgartirasiz.</p>
            </>
          ) : <p className="mt-2 text-[14px] text-[#64748B]">Mijoz dasturxonni o‘zi olib keladi — oshxona hisobi kerak emas.</p>}
          {e.extras.length > 0 && (
            <div className="mt-4 border-t border-[#F1F5F9] pt-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#94A3B8]">Qo‘shimcha xizmatlar</p>
              <ul className="mt-1.5 space-y-1 text-[14px] text-[#0F172A]">{e.extras.map((x, i) => <li key={i}>• {x.name}</li>)}</ul>
            </div>
          )}
        </section>

        <section className={card} aria-labelledby="h-check">
          <h2 id="h-check" className="font-sans text-[16px] font-bold text-[#0F172A]">Tayyorgarlik <span className="text-[14px] font-normal text-[#64748B]">· {checklist.filter((c) => c.done).length}/{checklist.length}</span></h2>
          <ul className="mt-3 space-y-1.5">
            {checklist.map((c, i) => (
              <li key={i} className="group flex items-center gap-2">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-[14px] hover:bg-[#F8FAFC]">
                  <input type="checkbox" checked={c.done} onChange={() => setChecklist(checklist.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} className="size-4 accent-[#22C55E]" />
                  <span className={c.done ? "text-[#94A3B8] line-through" : "text-[#0F172A]"}>{c.text}</span>
                </label>
                <button type="button" onClick={() => setChecklist(checklist.filter((_, j) => j !== i))} aria-label="O‘chirish" className="grid grid-cols-[minmax(0,1fr)] size-8 place-items-center rounded-[8px] text-[#CBD5E1] opacity-0 hover:text-[#DC2626] group-hover:opacity-100 focus:opacity-100 print:hidden">✕</button>
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2 print:hidden" onSubmit={(ev) => { ev.preventDefault(); if (!newCheck.trim()) return; setChecklist([...checklist, { text: newCheck.trim(), done: false }]); setNewCheck(""); }}>
            <input value={newCheck} onChange={(ev) => setNewCheck(ev.target.value)} placeholder="Yangi ish (masalan: gullar keltirildi)" aria-label="Yangi tayyorgarlik ishi"
              className="h-[40px] min-w-0 flex-1 rounded-[10px] border border-[#E2E8F0] px-3 text-[14px] outline-none focus:border-[#FF6A00]" />
            <button type="submit" disabled={!newCheck.trim()} className="h-[40px] rounded-[10px] bg-[#FF6A00] px-4 text-[14px] text-white disabled:bg-[#FAD3B8]">Qo‘shish</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Big({ title, value, sub, tone }: { title: string; value: string; sub: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-[16px] bg-[#F6F7F9] p-4 print:border print:border-[#CBD5E1] print:bg-white">
      <p className="text-[13px] text-[#64748B]">{title}</p>
      <p className={`mt-1 font-sans text-[19px] font-bold tabular-nums sm:text-[24px] ${tone === "green" ? "text-[#16A34A]" : tone === "red" ? "text-[#DC2626]" : "text-[#0F172A]"}`}>{value}</p>
      <p className="text-[12px] text-[#94A3B8]">{sub}</p>
    </div>
  );
}
