"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  addPayment, conflict, EVENT_TYPES, fromIsoDay, getEvent, isoDay, num, paid, PAY_METHODS, quote, readBlocks, readEvents, readSettings,
  removeEvent, saveEvent, setStage, SOURCES, STAGES, stageInfo, isWeekend,
  type Block, type EventType, type HallEvent, type HallSettings, type PayMethod, type SessionId, type Source, type Stage,
} from "@bazmly/api/hall";
import { MONTHS_UZ, WEEKDAYS_UZ } from "@bazmly/api/partnerBookings";
import { formatPhone } from "@bazmly/api/staff";
import { ChevronLeftIcon, PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { PaidBar, StageBadge } from "@/components/hall/CrmTabs";

type Draft = Omit<HallEvent, "id" | "createdAt" | "updatedAt"> & { id?: string };
const label = "block text-[13px] font-medium text-[#475569]";
const input = "mt-1.5 h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-[15px] text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FF6A00]";
const card = "rounded-[16px] border border-[#EEF0F3] bg-white p-4 sm:p-5";
const money = (v: string) => Number(v.replace(/\D/g, "").slice(0, 11)) || 0;
const longDay = (iso: string) => { const d = fromIsoDay(iso); return `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}, ${WEEKDAYS_UZ[d.getDay()]}`; };
const shiftDays = (iso: string, n: number) => { const d = fromIsoDay(iso); return isoDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); };

function Chips<T extends string>({ items, value, onChange, name }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="mt-1.5 flex flex-wrap gap-2">
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button key={it.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(it.id)}
            className={`h-[36px] rounded-full border px-[14px] text-[14px] transition-colors ${on ? "border-[#FF6A00] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FFC9A3]"}`}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// Bron (mijoz) kartasi: mijoz, tadbir, paket va xizmatlar, narx hisobi, to'lovlar, bosqich, izohlar
export function EventEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const id = params.get("id");
  const [s, setS] = useState<HallSettings | null>(null);
  const [all, setAll] = useState<HallEvent[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [d, setD] = useState<Draft | null>(null);
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [note, setNote] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const st = readSettings();
    setS(st); setAll(readEvents()); setBlocks(readBlocks());
    if (id) {
      const e = getEvent(id);
      if (!e) { setMissing(true); return; }
      setD(e); setPhone(e.phone.replace(/\D/g, "").replace(/^998/, ""));
      return;
    }
    const date = params.get("sana") ?? isoDay(new Date(Date.now() + 14 * 864e5));
    setD({
      stage: "yangi", source: "telefon", name: "", phone: "", eventType: "toy",
      date, session: (params.get("seans") as SessionId) || "kechki", hallId: params.get("zal") ?? st.halls[0]?.id ?? "",
      guests: 200, cateringId: st.catering[0]?.id ?? null, extras: [], discount: 0, payments: [],
      dueDate: shiftDays(date, -st.dueDaysBefore), notes: [],
    });
  }, [id, params]);

  const q = useMemo(() => (s && d ? quote(s, d) : null), [s, d]);
  if (missing) return (
    <main className="container-page pt-16 text-center font-inter">
      <p className="text-[16px] text-[#64748B]">Bron topilmadi.</p>
      <Link href="/panel/toyxona/bronlar" className="mt-4 inline-block text-[#FF6A00] hover:underline">Bronlarga qaytish</Link>
    </main>
  );
  if (!s || !d || !q) return null;

  const patch = (p: Partial<Draft>) => setD({ ...d, ...p });
  const isNew = !d.id;
  const hall = s.halls.find((h) => h.id === d.hallId);
  const p = paid(d as HallEvent);
  const rest = Math.max(0, q.total - p);
  const nameOk = d.name.trim().length >= 2;
  const phoneOk = phone.length === 9;
  const clash = conflict(all, blocks, d);
  const overCap = hall && d.guests > hall.capacity;
  const today = isoDay(new Date());

  const save = () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return toast("Mijoz ismi va telefon raqamini kiriting");
    if (!d.guests) return toast("Mehmonlar sonini kiriting");
    if (d.stage !== "bekor" && clash?.level === "band") return toast(`Bu joy band: ${clash.with?.name}`);
    if (d.stage !== "bekor" && clash?.level === "yopiq") return toast("Bu kun va seans yopiq — kalendarda oching");
    const saved = saveEvent({ ...d, phone: `+998${phone}`, name: d.name.trim() });
    setAll(readEvents()); setD(saved);
    toast(isNew ? "Bron qo‘shildi" : "O‘zgarishlar saqlandi");
    if (isNew) router.replace(`/panel/toyxona/bron?id=${saved.id}`);
  };
  const changeStage = (st: Stage) => {
    if (isNew) return patch({ stage: st });
    if (st !== "bekor" && BOOKED_STAGES.includes(st) && clash?.level === "band") return toast(`Bu joy band: ${clash.with?.name}`);
    setStage(d.id!, st); const e = getEvent(d.id!)!; setD(e); setAll(readEvents());
    toast(`Bosqich: ${stageInfo(st).label}`);
  };
  const addNote = () => {
    if (!note.trim()) return;
    const n = { at: new Date().toISOString(), text: note.trim() };
    if (isNew) patch({ notes: [n, ...d.notes] });
    else { const e = saveEvent({ ...(getEvent(d.id!) as HallEvent), notes: [n, ...d.notes] }); setD(e); }
    setNote("");
  };

  return (
    <main className="container-page pb-28 pt-6 font-inter md:pt-8 lg:pt-[min(32px,3svh)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => router.push("/panel/toyxona/bronlar")} aria-label="Orqaga" className="-ml-[9px] grid grid-cols-[minmax(0,1fr)] size-[40px] shrink-0 place-items-center rounded-full text-[#FF6A00] hover:bg-[#FFF0E5]">
            <ChevronLeftIcon className="h-[20px] w-[10px]" />
          </button>
          <div>
            <h1 className="font-sans text-[22px] font-bold leading-[30px] text-[#0F172A]">{isNew ? "Yangi bron" : d.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-[#64748B]">
              {!isNew && <StageBadge {...stageInfo(d.stage)} />}
              {d.date && <span>{longDay(d.date)} · {s.sessions.find((x) => x.id === d.session)?.label} · {hall?.name}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && d.stage !== "bekor" && <Link href={`/panel/toyxona/tadbir?id=${d.id}`} className="flex h-[42px] items-center rounded-full border border-[#FFC9A3] bg-[#FFF8F3] px-4 text-[14px] font-medium text-[#FF6A00] hover:bg-[#FFF0E5]">Tadbir rejasi</Link>}
          {!isNew && d.stage !== "bekor" && <button type="button" onClick={() => changeStage("bekor")} className="h-[42px] rounded-full border border-[#E2E8F0] px-4 text-[14px] text-[#475569] hover:bg-[#F8FAFC]">Bekor qilish</button>}
          <button type="button" onClick={save} className="h-[42px] rounded-full bg-[#FF6A00] px-6 font-sans text-[15px] text-white hover:bg-[#F06300]">{isNew ? "Bronni saqlash" : "Saqlash"}</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-5">
          {/* Mijoz */}
          <section className={card} aria-labelledby="sec-client">
            <h2 id="sec-client" className="font-sans text-[16px] font-bold text-[#0F172A]">Mijoz</h2>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Ism familiya</span>
                <input value={d.name} onChange={(e) => patch({ name: e.target.value.slice(0, 60) })} placeholder="Masalan: Jasur Toshmatov" aria-invalid={touched && !nameOk} className={`${input} ${touched && !nameOk ? "border-red-400" : ""}`} />
              </label>
              <label className="block">
                <span className={label}>Telefon</span>
                <span className={`${input} flex items-center gap-1.5 focus-within:border-[#FF6A00] ${touched && !phoneOk ? "border-red-400" : ""}`}>
                  <span className="text-[#64748B]">+998</span>
                  <input type="tel" inputMode="numeric" value={formatPhone(phone).replace("+998 ", "").trim()} onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 9 && v.startsWith("998")) v = v.slice(3); setPhone(v.slice(0, 9)); }}
                    placeholder="90 123 45 67" aria-label="Telefon raqami" aria-invalid={touched && !phoneOk} className="h-full min-w-0 flex-1 bg-transparent outline-none tabular-nums" />
                </span>
              </label>
            </div>
            <div className="mt-4">
              <span className={label}>Qayerdan keldi</span>
              <Chips name="Manba" items={SOURCES} value={d.source} onChange={(v: Source) => patch({ source: v })} />
            </div>
            {!isNew && <a href={`tel:${d.phone}`} className="mt-4 inline-flex h-[38px] items-center rounded-[10px] bg-[#DCFBE7] px-4 text-[14px] font-medium text-[#16A34A] hover:bg-[#C6F6D5]">Qo‘ng‘iroq qilish</a>}
          </section>

          {/* Tadbir */}
          <section className={card} aria-labelledby="sec-event">
            <h2 id="sec-event" className="font-sans text-[16px] font-bold text-[#0F172A]">Tadbir</h2>
            <div className="mt-3">
              <span className={label}>Tadbir turi</span>
              <Chips name="Tadbir turi" items={EVENT_TYPES} value={d.eventType} onChange={(v: EventType) => patch({ eventType: v })} />
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Sana</span>
                <input type="date" value={d.date} onChange={(e) => e.target.value && patch({ date: e.target.value, dueDate: shiftDays(e.target.value, -s.dueDaysBefore) })} className={input} />
                {isWeekend(d.date) && <span className="mt-1 block text-[12px] text-[#B45309]">Dam olish kuni — zal narxi +{s.weekendPct}%</span>}
              </label>
              <label className="block">
                <span className={label}>Mehmonlar soni</span>
                <input inputMode="numeric" value={d.guests || ""} onChange={(e) => patch({ guests: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || 0 })} placeholder="200" className={`${input} tabular-nums`} />
                <span className={`mt-1 block text-[12px] ${overCap ? "text-[#DC2626]" : "text-[#64748B]"}`}>{overCap ? `${hall?.name} sig‘imi ${hall?.capacity} kishi` : `Narx toifasi: ${q.tier.label}`}</span>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <div>
                <span className={label}>Seans</span>
                <Chips name="Seans" items={s.sessions.map((x) => ({ id: x.id, label: `${x.label} ${x.from}–${x.to}` }))} value={d.session} onChange={(v) => patch({ session: v })} />
              </div>
              <div>
                <span className={label}>Zal</span>
                <Chips name="Zal" items={s.halls.map((h) => ({ id: h.id, label: `${h.name} · ${h.capacity}` }))} value={d.hallId} onChange={(v) => patch({ hallId: v })} />
              </div>
            </div>
            {clash && d.stage !== "bekor" && (
              <p role="alert" className={`mt-4 rounded-[10px] px-3 py-2.5 text-[14px] ${clash.level === "ushlab" ? "bg-[#FFF8EB] text-[#B45309]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                {clash.level === "band" && <>Bu kun va seans band: <Link className="font-semibold underline" href={`/panel/toyxona/bron?id=${clash.with?.id}`}>{clash.with?.name}</Link>. Boshqa sana, seans yoki zalni tanlang.</>}
                {clash.level === "yopiq" && <>Bu kun va seans yopilgan{clash.block?.reason ? ` (${clash.block.reason})` : ""}.</>}
                {clash.level === "ushlab" && <>Shu joyga yana so‘rov bor: <Link className="font-semibold underline" href={`/panel/toyxona/bron?id=${clash.with?.id}`}>{clash.with?.name}</Link>. Birinchi depozit to‘lagan band qiladi.</>}
              </p>
            )}
          </section>

          {/* Paket va xizmatlar */}
          <section className={card} aria-labelledby="sec-pkg">
            <h2 id="sec-pkg" className="font-sans text-[16px] font-bold text-[#0F172A]">Dasturxon va xizmatlar</h2>
            <div role="radiogroup" aria-label="Dasturxon" className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-3">
              {[{ id: null, name: "O‘zi olib keladi", perGuest: 0, items: "Faqat zal va xizmat" }, ...s.catering].map((c) => {
                const on = d.cateringId === c.id;
                return (
                  <button key={c.id ?? "self"} type="button" role="radio" aria-checked={on} onClick={() => patch({ cateringId: c.id })}
                    className={`rounded-[12px] border p-3 text-left transition-colors ${on ? "border-[#FF6A00] bg-[#FFF8F3]" : "border-[#E2E8F0] hover:border-[#FFC9A3]"}`}>
                    <span className="block text-[15px] font-semibold text-[#0F172A]">{c.name}</span>
                    <span className="mt-0.5 block text-[13px] text-[#FF6A00]">{c.perGuest ? `${num(c.perGuest)} so‘m / kishi` : "0 so‘m"}</span>
                    <span className="mt-1 block text-[12px] leading-[16px] text-[#64748B]">{c.items}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <span className={label}>Qo‘shimcha xizmatlar</span>
              <ul className="mt-1.5 space-y-2">
                {d.extras.map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <input value={x.name} onChange={(e) => patch({ extras: d.extras.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) })} placeholder="Masalan: Karnay-surnay" aria-label="Xizmat nomi" className={`${input} mt-0 min-w-0 flex-1`} />
                    <input inputMode="numeric" value={x.price ? num(x.price) : ""} onChange={(e) => patch({ extras: d.extras.map((y, j) => (j === i ? { ...y, price: money(e.target.value) } : y)) })} placeholder="Narxi" aria-label="Xizmat narxi" className={`${input} mt-0 !w-[120px] shrink-0 tabular-nums sm:!w-[150px]`} />
                    <button type="button" onClick={() => patch({ extras: d.extras.filter((_, j) => j !== i) })} aria-label="Xizmatni o‘chirish" className="grid grid-cols-[minmax(0,1fr)] size-[44px] shrink-0 place-items-center rounded-[10px] text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]">✕</button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => patch({ extras: [...d.extras, { name: "", price: 0 }] })} className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-[#FF6A00] hover:underline"><PlusIcon className="size-[12px]" />Xizmat qo‘shish</button>
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Chegirma (so‘m)</span>
                <input inputMode="numeric" value={d.discount ? num(d.discount) : ""} onChange={(e) => patch({ discount: money(e.target.value) })} placeholder="0" className={`${input} tabular-nums`} />
              </label>
              <label className="block">
                <span className={label}>Qolgan to‘lov muddati</span>
                <input type="date" value={d.dueDate ?? ""} onChange={(e) => patch({ dueDate: e.target.value || undefined })} className={input} />
              </label>
            </div>
          </section>
        </div>

        {/* O'ng ustun: narx, to'lovlar, bosqich, izohlar */}
        <div className="space-y-5 lg:sticky lg:top-4">
          <section className={card} aria-labelledby="sec-price">
            <h2 id="sec-price" className="font-sans text-[16px] font-bold text-[#0F172A]">Narx hisobi</h2>
            <dl className="mt-3 space-y-2 text-[14px]">
              <Row k={`Zal (${q.tier.label}${isWeekend(d.date) ? `, +${s.weekendPct}%` : ""})`} v={q.hall} />
              {q.pkg && <Row k={`Dasturxon: ${q.pkg.name} × ${d.guests}`} v={q.catering} />}
              <Row k="Xizmat haqi" v={q.service} />
              {q.extras > 0 && <Row k="Qo‘shimcha xizmatlar" v={q.extras} />}
              {d.discount > 0 && <Row k="Chegirma" v={-d.discount} />}
              <div className="flex items-baseline justify-between border-t border-[#EEF0F3] pt-3">
                <dt className="font-semibold text-[#0F172A]">Jami</dt><dd className="font-sans text-[20px] font-bold text-[#0F172A] tabular-nums">{num(q.total)} so‘m</dd>
              </div>
              <Row k={`Depozit (${s.depositPct}%)`} v={q.deposit} muted />
            </dl>
          </section>

          <section className={card} aria-labelledby="sec-pay">
            <div className="flex items-center justify-between">
              <h2 id="sec-pay" className="font-sans text-[16px] font-bold text-[#0F172A]">To‘lovlar</h2>
              {!isNew && rest > 0 && d.stage !== "bekor" && <button type="button" onClick={() => setPayOpen(true)} className="flex h-[34px] items-center gap-1.5 rounded-full bg-[#0F172A] px-3 text-[13px] text-white hover:bg-[#1E293B]"><PlusIcon className="size-[11px]" />To‘lov</button>}
            </div>
            <div className="mt-3 flex items-baseline justify-between text-[14px]">
              <span className="text-[#64748B]">To‘langan: <b className="text-[#0F172A] tabular-nums">{num(p)}</b></span>
              <span className={rest ? "font-semibold text-[#DC2626] tabular-nums" : "font-semibold text-[#16A34A]"}>{rest ? `Qoldiq: ${num(rest)}` : "To‘liq to‘langan"}</span>
            </div>
            <div className="mt-2"><PaidBar paid={p} total={q.total} /></div>
            {d.dueDate && rest > 0 && <p className={`mt-2 text-[12px] ${d.dueDate < today ? "text-[#DC2626]" : "text-[#64748B]"}`}>Muddat: {longDay(d.dueDate)}{d.dueDate < today ? " — o‘tib ketdi" : ""}</p>}
            <ul className="mt-3 divide-y divide-[#F1F5F9]">
              {d.payments.map((x) => (
                <li key={x.id} className="flex items-center justify-between py-2 text-[14px]">
                  <span><span className="text-[#0F172A]">{x.note || "To‘lov"}</span> <span className="text-[12px] text-[#94A3B8]">· {PAY_METHODS.find((m) => m.id === x.method)?.label} · {longDay(x.date).split(",")[0]}</span></span>
                  <b className="font-semibold text-[#0F172A] tabular-nums">{num(x.amount)}</b>
                </li>
              ))}
              {!d.payments.length && <li className="py-2 text-[13px] text-[#94A3B8]">{isNew ? "To‘lovni bron saqlangandan keyin qo‘shasiz" : "Hali to‘lov yo‘q"}</li>}
            </ul>
          </section>

          <section className={card} aria-labelledby="sec-stage">
            <h2 id="sec-stage" className="font-sans text-[16px] font-bold text-[#0F172A]">Bosqich</h2>
            <div role="radiogroup" aria-label="Bosqich" className="mt-3 flex flex-wrap gap-2">
              {STAGES.map((st) => {
                const on = st.id === d.stage;
                return (
                  <button key={st.id} type="button" role="radio" aria-checked={on} onClick={() => changeStage(st.id)}
                    className={`h-[32px] rounded-full border px-3 text-[13px] transition-colors ${on ? "text-white" : "border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"}`}
                    style={on ? { background: st.color, borderColor: st.color } : undefined}>
                    {st.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={card} aria-labelledby="sec-notes">
            <h2 id="sec-notes" className="font-sans text-[16px] font-bold text-[#0F172A]">Izohlar va tarix</h2>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addNote(); }}>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Izoh yozing (masalan: qo‘ng‘iroq qildim)" aria-label="Izoh" className={`${input} mt-0 min-w-0 flex-1`} />
              <button type="submit" disabled={!note.trim()} className="h-[44px] rounded-[10px] bg-[#FF6A00] px-4 text-[14px] text-white disabled:bg-[#FAD3B8]">Qo‘shish</button>
            </form>
            <ul className="mt-3 max-h-[260px] space-y-3 overflow-y-auto">
              {d.notes.map((n, i) => (
                <li key={i} className="border-l-2 border-[#FFD8BD] pl-3 text-[14px]">
                  <p className="text-[#0F172A]">{n.text}</p>
                  <p className="text-[12px] text-[#94A3B8]">{new Date(n.at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                </li>
              ))}
              {!d.notes.length && <li className="text-[13px] text-[#94A3B8]">Hali izoh yo‘q</li>}
            </ul>
          </section>

          {!isNew && (
            confirmDel ? (
              <div className="flex items-center justify-between rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[14px]">
                <span className="text-[#DC2626]">Bron butunlay o‘chirilsinmi?</span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => setConfirmDel(false)} className="px-2 text-[#64748B]">Yo‘q</button>
                  <button type="button" onClick={() => { removeEvent(d.id!); toast("Bron o‘chirildi"); router.push("/panel/toyxona/bronlar"); }} className="rounded-[8px] bg-[#DC2626] px-3 py-1 text-white">O‘chirish</button>
                </span>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDel(true)} className="w-full text-center text-[14px] text-[#94A3B8] hover:text-[#DC2626]">Bronni o‘chirish</button>
            )
          )}
        </div>
      </div>

      {payOpen && (
        <PaymentDialog
          suggested={p === 0 ? q.deposit : rest} max={rest} first={p === 0}
          onClose={() => setPayOpen(false)}
          onSave={(amount, method, date, noteText) => {
            addPayment(d.id!, { amount, method, date, note: noteText });
            const e = getEvent(d.id!)!; setD(e); setAll(readEvents()); setPayOpen(false);
            toast(`To‘lov qo‘shildi: ${num(amount)} so‘m`);
          }}
        />
      )}
    </main>
  );
}

const BOOKED_STAGES: Stage[] = ["depozit", "otdi", "yakunlandi"];

function Row({ k, v, muted }: { k: string; v: number; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={muted ? "text-[#94A3B8]" : "text-[#64748B]"}>{k}</dt>
      <dd className={`shrink-0 tabular-nums ${muted ? "text-[#94A3B8]" : v < 0 ? "text-[#16A34A]" : "text-[#0F172A]"}`}>{v < 0 ? "−" : ""}{num(Math.abs(v))}</dd>
    </div>
  );
}

export function PaymentDialog({ suggested, max, first, onClose, onSave, title }: {
  suggested: number; max: number; first: boolean; title?: string;
  onClose: () => void; onSave: (amount: number, method: PayMethod, date: string, note: string) => void;
}) {
  const [amount, setAmount] = useState(suggested);
  const [method, setMethod] = useState<PayMethod>("naqd");
  const [date, setDate] = useState(isoDay(new Date()));
  const [note, setNote] = useState(first ? "Depozit" : amount >= max ? "Qolgan to‘lov" : "Qisman to‘lov");
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  const ok = amount > 0 && amount <= max;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-label="To‘lov qo‘shish" onSubmit={(e) => { e.preventDefault(); if (ok) onSave(amount, method, date, note.trim()); }}
        className="w-full rounded-t-[20px] bg-white p-5 font-inter sm:max-w-[420px] sm:rounded-[20px] sm:p-6">
        <h2 className="font-sans text-[18px] font-bold text-[#0F172A]">{title ?? "To‘lov qo‘shish"}</h2>
        <label className="mt-4 block">
          <span className={label}>Summa (so‘m)</span>
          <input autoFocus inputMode="numeric" value={amount ? num(amount) : ""} onChange={(e) => setAmount(money(e.target.value))} className={`${input} text-[18px] font-semibold tabular-nums`} />
          <span className="mt-1 flex gap-3 text-[12px]">
            <span className="text-[#64748B]">Qoldiq: {num(max)}</span>
            <button type="button" onClick={() => { setAmount(max); setNote("Qolgan to‘lov"); }} className="font-medium text-[#FF6A00] hover:underline">To‘liq</button>
          </span>
          {amount > max && <span className="mt-1 block text-[12px] text-[#DC2626]">Qoldiqdan ko‘p bo‘lishi mumkin emas</span>}
        </label>
        <div className="mt-4">
          <span className={label}>To‘lov turi</span>
          <Chips name="To‘lov turi" items={PAY_METHODS.filter((m) => m.id !== "bazmly")} value={method} onChange={setMethod} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block"><span className={label}>Sana</span><input type="date" value={date} onChange={(e) => setDate(e.target.value || date)} className={input} /></label>
          <label className="block"><span className={label}>Izoh</span><input value={note} onChange={(e) => setNote(e.target.value)} className={input} /></label>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-[46px] rounded-[12px] border border-[#E2E8F0] text-[15px] text-[#475569]">Bekor qilish</button>
          <button type="submit" disabled={!ok} className="h-[46px] rounded-[12px] bg-[#FF6A00] text-[15px] text-white disabled:bg-[#FAD3B8]">Saqlash</button>
        </div>
      </form>
    </div>
  );
}
