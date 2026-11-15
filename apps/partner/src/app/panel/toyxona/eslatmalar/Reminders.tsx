"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addTask, dismiss, fromIsoDay, isoDay, readEvents, readSettings, readTasks, reminders, removeTask, toggleTask,
  type HallEvent, type HallSettings, type Reminder, type ReminderKind, type Task,
} from "@bazmly/api/hall";
import { MONTHS_SHORT } from "@bazmly/api/partnerBookings";
import { PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { CrmTabs } from "@/components/hall/CrmTabs";

const KIND: Record<ReminderKind, { icon: string; bg: string; fg: string }> = {
  javob: { icon: "✆", bg: "bg-[#EFF6FF]", fg: "text-[#2563EB]" },
  qayta: { icon: "↻", bg: "bg-[#F5F3FF]", fg: "text-[#7C3AED]" },
  tolov: { icon: "₸", bg: "bg-[#FEF2F2]", fg: "text-[#DC2626]" },
  tayyorgarlik: { icon: "✓", bg: "bg-[#FFF0E5]", fg: "text-[#FF6A00]" },
  bosqich: { icon: "→", bg: "bg-[#F0FDFA]", fg: "text-[#0D9488]" },
};
const short = (iso: string) => { const d = fromIsoDay(iso); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };

// Eslatmalar: bronlar holatidan avtomatik hisoblanadigan ishlar + o'z vazifalaringiz
export function Reminders() {
  const toast = useToast();
  const [data, setData] = useState<{ s: HallSettings; events: HallEvent[]; tasks: Task[]; today: string; list: Reminder[] } | null>(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [eventId, setEventId] = useState("");
  const load = () => { const s = readSettings(), events = readEvents(), today = isoDay(new Date()); setData({ s, events, tasks: readTasks(), today, list: reminders(events, s, today) }); setDate((d) => d || today); };
  useEffect(load, []);
  if (!data) return null;
  const { events, tasks, today, list } = data;
  const open = tasks.filter((t) => !t.done).sort((a, b) => a.date.localeCompare(b.date));
  const done = tasks.filter((t) => t.done);
  const upcoming = events.filter((e) => e.stage !== "bekor" && e.date >= today && !e.id.startsWith("hx")).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="container-page pb-20 pt-6 font-inter md:pt-8 lg:pt-[min(32px,3svh)]">
      <CrmTabs />
      <h1 className="mt-5 font-sans text-[20px] font-bold text-[#0F172A]">Eslatmalar</h1>
      <p className="mt-1 text-[14px] text-[#64748B]">Bronlar holatiga qarab avtomatik tuziladi: javob kutayotgan so‘rovlar, to‘lov muddatlari, yaqin tadbirlar tayyorgarligi.</p>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="h-auto">
          <h2 id="h-auto" className="text-[15px] font-semibold text-[#0F172A]">Bajarilishi kerak <span className="ml-1 rounded-full bg-[#FF6A00] px-2 text-[12px] text-white">{list.length}</span></h2>
          <ul className="mt-3 space-y-2">
            {list.map((r) => {
              const k = KIND[r.kind];
              const href = r.kind === "tayyorgarlik" ? `/panel/toyxona/tadbir?id=${r.event.id}` : `/panel/toyxona/bron?id=${r.event.id}`;
              return (
                <li key={r.key} className={`flex items-start gap-3 rounded-[14px] border bg-white p-3.5 ${r.urgent ? "border-[#FECACA]" : "border-[#EEF0F3]"}`}>
                  <span className={`grid size-[36px] shrink-0 place-items-center rounded-full text-[16px] font-semibold ${k.bg} ${k.fg}`} aria-hidden>{k.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-[#0F172A]">{r.title}{r.urgent && <span className="ml-2 rounded-[6px] bg-[#FEF2F2] px-1.5 py-0.5 text-[11px] font-medium text-[#DC2626]">Shoshilinch</span>}</p>
                    <Link href={href} className="mt-0.5 block truncate text-[14px] text-[#475569] hover:text-[#FF6A00]">{r.event.name} · tadbir {short(r.event.date)}</Link>
                    <p className="text-[13px] text-[#94A3B8]">{r.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`tel:${r.event.phone}`} className="flex h-[32px] items-center rounded-[8px] bg-[#DCFBE7] px-3 text-[13px] font-medium text-[#16A34A] hover:bg-[#C6F6D5]">Qo‘ng‘iroq</a>
                      <Link href={href} className="flex h-[32px] items-center rounded-[8px] border border-[#E2E8F0] px-3 text-[13px] text-[#475569] hover:bg-[#F8FAFC]">{r.kind === "tayyorgarlik" ? "Tadbir rejasi" : "Ochish"}</Link>
                      <button type="button" onClick={() => { dismiss(r.key); load(); toast("Bajarildi deb belgilandi"); }} className="h-[32px] rounded-[8px] px-3 text-[13px] text-[#64748B] hover:bg-[#F1F5F9]">Bajarildi</button>
                    </div>
                  </div>
                </li>
              );
            })}
            {!list.length && <li className="rounded-[14px] bg-[#F0FDF4] px-4 py-8 text-center text-[15px] text-[#16A34A]">Hamma ishlar bajarilgan 🎉</li>}
          </ul>
        </section>

        <section aria-labelledby="h-tasks" className="rounded-[16px] bg-[#F6F7F9] p-4 sm:p-5">
          <h2 id="h-tasks" className="text-[15px] font-semibold text-[#0F172A]">Mening vazifalarim</h2>
          <form className="mt-3 space-y-2" onSubmit={(e) => {
            e.preventDefault(); if (!text.trim()) return;
            setData({ ...data, tasks: addTask({ text: text.trim(), date, eventId: eventId || undefined }) }); setText(""); setEventId(""); toast("Vazifa qo‘shildi");
          }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Masalan: Gul do‘koniga qo‘ng‘iroq" aria-label="Vazifa"
              className="h-[42px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-[14px] outline-none focus:border-[#FF6A00]" />
            <div className="flex gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} aria-label="Sana" className="h-[42px] w-[150px] shrink-0 rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-[14px] outline-none focus:border-[#FF6A00]" />
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Bron (ixtiyoriy)" className="h-[42px] min-w-0 flex-1 rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-[14px] outline-none focus:border-[#FF6A00]">
                <option value="">Bronsiz</option>
                {upcoming.map((e) => <option key={e.id} value={e.id}>{e.name} · {short(e.date)}</option>)}
              </select>
              <button type="submit" disabled={!text.trim()} aria-label="Vazifa qo‘shish" className="grid grid-cols-[minmax(0,1fr)] size-[42px] shrink-0 place-items-center rounded-[10px] bg-[#FF6A00] text-white disabled:bg-[#FAD3B8]"><PlusIcon className="size-[14px]" /></button>
            </div>
          </form>
          <ul className="mt-4 space-y-1.5">
            {[...open, ...done].map((t) => {
              const ev = t.eventId ? events.find((e) => e.id === t.eventId) : undefined;
              const late = !t.done && t.date < today;
              return (
                <li key={t.id} className="group flex items-start gap-2.5 rounded-[10px] bg-white px-3 py-2.5">
                  <input type="checkbox" checked={t.done} onChange={() => setData({ ...data, tasks: toggleTask(t.id) })} aria-label={`${t.text} — bajarildi`} className="mt-0.5 size-4 shrink-0 accent-[#22C55E]" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] ${t.done ? "text-[#94A3B8] line-through" : "text-[#0F172A]"}`}>{t.text}</p>
                    <p className={`text-[12px] ${late ? "text-[#DC2626]" : "text-[#94A3B8]"}`}>
                      {t.date === today ? "Bugun" : short(t.date)}{late ? " · muddati o‘tdi" : ""}
                      {ev && <> · <Link href={`/panel/toyxona/bron?id=${ev.id}`} className="hover:text-[#FF6A00]">{ev.name}</Link></>}
                    </p>
                  </div>
                  <button type="button" onClick={() => setData({ ...data, tasks: removeTask(t.id) })} aria-label="Vazifani o‘chirish" className="grid grid-cols-[minmax(0,1fr)] size-7 place-items-center rounded-[6px] text-[#CBD5E1] opacity-0 hover:text-[#DC2626] group-hover:opacity-100 focus:opacity-100">✕</button>
                </li>
              );
            })}
            {!tasks.length && <li className="py-6 text-center text-[13px] text-[#94A3B8]">Vazifalar yo‘q</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
