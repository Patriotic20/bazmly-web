"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BOOKED, EVENT_TYPES, fromIsoDay, isoDay, mln, paid, quote, readEvents, readSettings, setStage, SOURCES, STAGES, stageInfo,
  type HallEvent, type HallSettings, type Stage,
} from "@bazmly/api/hall";
import { MONTHS_SHORT } from "@bazmly/api/partnerBookings";
import { PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { CrmTabs, PaidBar } from "@/components/hall/CrmTabs";

const FLOW: Stage[] = ["yangi", "boglanildi", "korik", "depozit", "otdi", "yakunlandi"];
const shortDate = (iso: string) => { const d = fromIsoDay(iso); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };

// Bronlar voronkasi: So'rov → Bog'lanildi → Zalni ko'rdi → Depozit → Tadbir o'tdi → Yakunlandi (kartani sudrab ko'chirish mumkin)
export function Pipeline() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; today: string } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  useEffect(() => { setData({ s: readSettings(), events: readEvents(), today: isoDay(new Date()) }); }, []);

  if (!data) return null;
  const { s, events, today } = data;
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const hallId = params.get("zal") ?? "all";
  const showCancelled = params.get("bekor") === "1";
  const set = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v === null) sp.delete(k); else sp.set(k, v);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const match = (e: HallEvent) => (hallId === "all" || e.hallId === hallId) && (!q || e.name.toLowerCase().includes(q) || e.phone.includes(q.replace(/\D/g, "") || "\u0000"));
  const shown = events.filter(match);
  const cols: Stage[] = showCancelled ? [...FLOW, "bekor"] : FLOW;
  const monthAgo = isoDay(new Date(Date.now() - 30 * 864e5));
  const cancelled = shown.filter((e) => e.stage === "bekor" && e.date >= monthAgo).length;

  const move = (id: string, stage: Stage) => {
    const e = events.find((x) => x.id === id);
    if (!e || e.stage === stage) return;
    setData({ ...data, events: setStage(id, stage) });
    toast(`${e.name} → ${stageInfo(stage).label}`);
  };

  return (
    <main className="container-page pb-10 pt-6 font-inter md:pt-8 lg:flex lg:h-full lg:flex-col lg:pb-5 lg:pt-[min(32px,3svh)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CrmTabs />
        <Link href="/panel/toyxona/bron?yangi=1" className="flex h-[40px] shrink-0 items-center gap-[8px] rounded-full bg-[#FF6A00] px-[18px] font-sans text-[15px] text-white transition-colors hover:bg-[#F06300]">
          Yangi bron <PlusIcon className="size-[14px]" />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-[min(20px,2svh)]">
        <h1 className="mr-2 font-sans text-[20px] font-bold text-[#0F172A]">Bronlar</h1>
        <div role="group" aria-label="Zal" className="no-scrollbar flex gap-2 overflow-x-auto">
          {[{ id: "all", name: "Barcha zallar" }, ...s.halls].map((h) => {
            const on = hallId === h.id;
            return (
              <button key={h.id} type="button" aria-pressed={on} onClick={() => set("zal", h.id === "all" ? null : h.id)}
                className={`h-[34px] shrink-0 rounded-full border px-[14px] text-[14px] transition-colors ${on ? "border-[#FF6A00] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FFC9A3]"}`}>
                {h.name}
              </button>
            );
          })}
        </div>
        <button type="button" aria-pressed={showCancelled} onClick={() => set("bekor", showCancelled ? null : "1")}
          className={`h-[34px] rounded-full border px-[14px] text-[14px] transition-colors ${showCancelled ? "border-[#94A3B8] bg-[#F1F5F9] text-[#334155]" : "border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"}`}>
          Bekor qilinganlar ({cancelled})
        </button>
        {q && <span className="text-[14px] text-[#64748B]">“{params.get("q")}” bo‘yicha</span>}
      </div>

      {/* Ustunlar: kompyuterda ekranning qolgan balandligi, har bir ustun ichida aylanadi */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 lg:min-h-0 lg:flex-1">
        {cols.map((st) => {
          const info = stageInfo(st);
          // Yakunlangan va bekor qilinganlar — faqat so'nggi 30 kun (eskilari Hisobotlarda)
          const old = (e: HallEvent) => (st === "yakunlandi" || st === "bekor") && e.date < monthAgo;
          const list = shown.filter((e) => e.stage === st && !old(e)).sort((a, b) => (st === "yakunlandi" || st === "bekor" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
          const sum = list.reduce((a, e) => a + quote(s, e).total, 0);
          return (
            <section key={st} aria-label={info.label}
              onDragOver={(e) => { if (drag) { e.preventDefault(); setOver(st); } }}
              onDragLeave={() => setOver((o) => (o === st ? null : o))}
              onDrop={(e) => { e.preventDefault(); if (drag) move(drag, st); setDrag(null); setOver(null); }}
              className={`flex w-[272px] shrink-0 flex-col rounded-[16px] p-2 transition-colors lg:min-h-0 lg:w-auto lg:min-w-[210px] lg:flex-1 ${over === st ? "bg-[#FFF0E5] ring-2 ring-[#FFC9A3]" : "bg-[#F6F7F9]"}`}>
              <header className="flex items-center justify-between px-2 pb-2 pt-1">
                <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A]"><i className="size-[8px] rounded-full" style={{ background: info.color }} />{info.label}</h2>
                <span className="rounded-full bg-white px-2 text-[12px] font-medium text-[#64748B]">{list.length}</span>
              </header>
              {list.length > 0 && <p className="px-2 pb-2 text-[12px] text-[#94A3B8]">{mln(sum)} so‘m</p>}
              <ul className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {list.map((e) => <EventCard key={e.id} e={e} s={s} today={today} onDrag={setDrag} onAdvance={(to) => move(e.id, to)} />)}
                {!list.length && <li className="rounded-[12px] border border-dashed border-[#DDE1E6] px-3 py-6 text-center text-[13px] text-[#94A3B8]">Bo‘sh</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function EventCard({ e, s, today, onDrag, onAdvance }: { e: HallEvent; s: HallSettings; today: string; onDrag: (id: string | null) => void; onAdvance: (s: Stage) => void }) {
  const q = quote(s, e);
  const p = paid(e);
  const hall = s.halls.find((h) => h.id === e.hallId)?.name ?? "";
  const session = s.sessions.find((x) => x.id === e.session)?.label ?? "";
  const type = EVENT_TYPES.find((t) => t.id === e.eventType)?.label;
  const src = SOURCES.find((x) => x.id === e.source)?.label;
  const overdue = BOOKED.includes(e.stage) && !!e.dueDate && e.dueDate < today && p < q.total;
  const i = FLOW.indexOf(e.stage);
  const next = i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
  return (
    <li draggable onDragStart={(ev) => { ev.dataTransfer.effectAllowed = "move"; onDrag(e.id); }} onDragEnd={() => onDrag(null)}
      className="group relative cursor-grab rounded-[12px] border border-[#EEF0F3] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] active:cursor-grabbing">
      <Link href={`/panel/toyxona/bron?id=${e.id}`} className="block after:absolute after:inset-0" aria-label={`${e.name} — bronni ochish`}>
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-[#0F172A]">{e.name}</span>
          <span className={`shrink-0 rounded-[6px] px-1.5 py-0.5 text-[11px] ${e.source === "bazmly" ? "bg-[#FFF0E5] text-[#FF6A00]" : "bg-[#F1F5F9] text-[#64748B]"}`}>{src}</span>
        </span>
      </Link>
      <p className="mt-1 text-[13px] text-[#475569]">{type} · {e.guests} kishi</p>
      <p className="mt-0.5 text-[13px] text-[#64748B]">{shortDate(e.date)} · {session} · {hall}</p>
      <p className="mt-2.5 text-[12px] text-[#64748B]">To‘langan: {mln(p)} / <b className="font-semibold text-[#0F172A]">{mln(q.total)}</b></p>
      <div className="mt-1.5"><PaidBar paid={p} total={q.total} /></div>
      {overdue && <p className="mt-1.5 text-[12px] font-medium text-[#DC2626]">To‘lov muddati o‘tdi</p>}
      {next && (
        <button type="button" onClick={() => onAdvance(next)} className="relative z-10 mt-2.5 w-full rounded-[8px] border border-[#EEF0F3] py-1.5 text-[12px] text-[#475569] opacity-100 transition-opacity hover:border-[#FFC9A3] hover:text-[#FF6A00] lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100">
          {stageInfo(next).label} →
        </button>
      )}
    </li>
  );
}
