"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, num, readEvents, readSettings, saveSettings, type HallSettings, type Norm } from "@bazmly/api/hall";
import { PlusIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { CrmTabs } from "@/components/hall/CrmTabs";
import { TIME_SLOTS } from "@/components/TimeField";

const label = "block text-[13px] font-medium text-[#475569]";
const input = "h-[42px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-[15px] text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FF6A00]";
const card = "rounded-[16px] border border-[#EEF0F3] bg-white p-4 sm:p-5";
const money = (v: string) => Number(v.replace(/\D/g, "").slice(0, 11)) || 0;
const del = "grid size-[42px] shrink-0 place-items-center rounded-[10px] text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:opacity-30 disabled:hover:bg-transparent";

// Zallar va narxlar: zallar, seans vaqtlari, mehmonlar soni bo'yicha narx, dasturxon paketlari, xizmat haqi, depozit
export function HallSettingsPage() {
  const toast = useToast();
  const [s, setS] = useState<HallSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => setS(readSettings()), []);
  if (!s) return null;
  const patch = (p: Partial<HallSettings>) => { setS({ ...s, ...p }); setDirty(true); };
  const used = new Set(readEvents().filter((e) => e.stage !== "bekor").map((e) => e.hallId));

  const save = () => {
    if (s.halls.some((h) => !h.name.trim() || !h.capacity)) return toast("Har bir zal uchun nom va sig‘imni kiriting");
    if (s.tiers.some((t) => !t.price || !t.max)) return toast("Narx jadvalida bo‘sh qator bor");
    if (s.catering.some((c) => !c.name.trim())) return toast("Dasturxon paketiga nom bering");
    const tiers = [...s.tiers].sort((a, b) => a.max - b.max);
    // Toifa nomlari chegaralardan avtomatik: "100 – 150 kishi", oxirgisi "300+ kishi"
    const named = tiers.map((t, i) => ({ ...t, label: i === tiers.length - 1 && i > 0 ? `${tiers[i - 1].max}+ kishi` : `${i ? tiers[i - 1].max : 0} – ${t.max} kishi` }));
    const next = { ...s, tiers: named };
    if (!saveSettings(next)) return toast("Saqlab bo‘lmadi");
    setS(next); setDirty(false); toast("Sozlamalar saqlandi");
  };

  return (
    <main className="container-page pb-28 pt-6 font-inter md:pt-8 lg:pt-[min(32px,3svh)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CrmTabs />
        <button type="button" onClick={save} disabled={!dirty} className="h-[40px] rounded-full bg-[#FF6A00] px-6 font-sans text-[15px] text-white hover:bg-[#F06300] disabled:bg-[#FAD3B8]">Saqlash</button>
      </div>
      <h1 className="mt-5 font-sans text-[20px] font-bold text-[#0F172A]">Zallar va narxlar</h1>
      <p className="mt-1 text-[14px] text-[#64748B]">Bu narxlar bron hisobida va Bazmly saytida mijozlarga ko‘rsatiladi.</p>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2 lg:items-start">
        <section className={card} aria-labelledby="h-halls">
          <h2 id="h-halls" className="font-sans text-[16px] font-bold text-[#0F172A]">Zallar</h2>
          <ul className="mt-3 space-y-2">
            {s.halls.map((h, i) => (
              <li key={h.id} className="flex gap-2">
                <input value={h.name} onChange={(e) => patch({ halls: s.halls.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="Zal nomi" aria-label="Zal nomi" className={`${input} min-w-0 flex-1`} />
                <span className={`${input} flex !w-[150px] shrink-0 items-center gap-1 focus-within:border-[#FF6A00]`}>
                  <input inputMode="numeric" value={h.capacity || ""} onChange={(e) => patch({ halls: s.halls.map((x, j) => (j === i ? { ...x, capacity: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || 0 } : x)) })} aria-label="Sig‘imi" className="w-full bg-transparent outline-none tabular-nums" />
                  <span className="text-[13px] text-[#94A3B8]">kishi</span>
                </span>
                <button type="button" disabled={s.halls.length < 2 || used.has(h.id)} title={used.has(h.id) ? "Bu zalda bronlar bor" : undefined}
                  onClick={() => patch({ halls: s.halls.filter((_, j) => j !== i) })} aria-label={`${h.name} — o‘chirish`} className={del}>✕</button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => patch({ halls: [...s.halls, { id: `z${Date.now()}`, name: "", capacity: 150 }] })} className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-[#FF6A00] hover:underline"><PlusIcon className="size-[12px]" />Zal qo‘shish</button>
        </section>

        <section className={card} aria-labelledby="h-sessions">
          <h2 id="h-sessions" className="font-sans text-[16px] font-bold text-[#0F172A]">Seanslar</h2>
          <ul className="mt-3 space-y-3">
            {s.sessions.map((se, i) => (
              <li key={se.id} className="grid grid-cols-[1fr_110px_110px] items-end gap-2">
                <span><span className={label}>{se.id === "kunduzgi" ? "Kunduzgi" : "Kechki"} seans</span><input value={se.label} onChange={(e) => patch({ sessions: s.sessions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} aria-label="Seans nomi" className={`${input} mt-1.5`} /></span>
                {(["from", "to"] as const).map((k) => (
                  <label key={k} className="block"><span className={label}>{k === "from" ? "Boshlanishi" : "Tugashi"}</span>
                    <select value={se[k]} onChange={(e) => patch({ sessions: s.sessions.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} className={`${input} mt-1.5`}>
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                ))}
              </li>
            ))}
          </ul>
        </section>

        <section className={card} aria-labelledby="h-tiers">
          <h2 id="h-tiers" className="font-sans text-[16px] font-bold text-[#0F172A]">Zal narxi (mehmonlar soni bo‘yicha)</h2>
          <div className="mt-3 grid grid-cols-[1fr_1fr_42px] gap-2 text-[12px] text-[#94A3B8]"><span>Mehmonlar (gacha)</span><span>Narx, so‘m</span><span /></div>
          <ul className="mt-1 space-y-2">
            {s.tiers.map((t, i) => (
              <li key={t.id} className="grid grid-cols-[1fr_1fr_42px] gap-2">
                <span className={`${input} flex items-center gap-1 focus-within:border-[#FF6A00]`}>
                  <input inputMode="numeric" value={t.max || ""} onChange={(e) => patch({ tiers: s.tiers.map((x, j) => (j === i ? { ...x, max: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || 0 } : x)) })} aria-label="Mehmonlar soni (gacha)" className="w-full bg-transparent outline-none tabular-nums" />
                  <span className="text-[13px] text-[#94A3B8]">kishi</span>
                </span>
                <input inputMode="numeric" value={t.price ? num(t.price) : ""} onChange={(e) => patch({ tiers: s.tiers.map((x, j) => (j === i ? { ...x, price: money(e.target.value) } : x)) })} aria-label="Narx" className={`${input} tabular-nums`} />
                <button type="button" disabled={s.tiers.length < 2} onClick={() => patch({ tiers: s.tiers.filter((_, j) => j !== i) })} aria-label="Qatorni o‘chirish" className={del}>✕</button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => patch({ tiers: [...s.tiers, { id: `t${Date.now()}`, label: "", max: (s.tiers.at(-1)?.max ?? 0) + 100, price: 0 }] })} className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-[#FF6A00] hover:underline"><PlusIcon className="size-[12px]" />Qator qo‘shish</button>
        </section>

        <section className={card} aria-labelledby="h-cat">
          <h2 id="h-cat" className="font-sans text-[16px] font-bold text-[#0F172A]">Dasturxon paketlari</h2>
          <ul className="mt-3 space-y-3">
            {s.catering.map((c, i) => (
              <li key={c.id} className="rounded-[12px] bg-[#F8FAFC] p-3">
                <div className="flex gap-2">
                  <input value={c.name} onChange={(e) => patch({ catering: s.catering.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="Paket nomi" aria-label="Paket nomi" className={`${input} min-w-0 flex-1`} />
                  <span className={`${input} flex !w-[190px] shrink-0 items-center gap-1 focus-within:border-[#FF6A00]`}>
                    <input inputMode="numeric" value={c.perGuest ? num(c.perGuest) : ""} onChange={(e) => patch({ catering: s.catering.map((x, j) => (j === i ? { ...x, perGuest: money(e.target.value) } : x)) })} aria-label="Bir kishi uchun narx" className="w-full bg-transparent outline-none tabular-nums" />
                    <span className="whitespace-nowrap text-[13px] text-[#94A3B8]">/ kishi</span>
                  </span>
                  <button type="button" onClick={() => patch({ catering: s.catering.filter((_, j) => j !== i) })} aria-label="Paketni o‘chirish" className={del}>✕</button>
                </div>
                <textarea value={c.items} onChange={(e) => patch({ catering: s.catering.map((x, j) => (j === i ? { ...x, items: e.target.value } : x)) })} rows={2} placeholder="Tarkibi: osh, salatlar, shirinliklar…" aria-label="Paket tarkibi"
                  className="mt-2 w-full resize-none rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#FF6A00]" />
                <details className="mt-2">
                  <summary className="cursor-pointer text-[13px] font-medium text-[#475569]">Oshxona me’yorlari (1 mehmon uchun) · {c.norms?.length ?? 0} ta</summary>
                  <ul className="mt-2 space-y-1.5">
                    {(c.norms ?? []).map((n, k) => {
                      const setNorm = (v: Partial<Norm>) => patch({ catering: s.catering.map((x, j) => (j === i ? { ...x, norms: (x.norms ?? []).map((y, m) => (m === k ? { ...y, ...v } : y)) } : x)) });
                      return (
                        <li key={k} className="flex gap-1.5">
                          <input value={n.name} onChange={(e) => setNorm({ name: e.target.value })} placeholder="Mahsulot" aria-label="Mahsulot" className={`${input} !h-[36px] min-w-0 flex-1 text-[14px]`} />
                          <input key={`${c.id}-${k}-${n.qty}`} inputMode="decimal" defaultValue={String(n.qty).replace(".", ",")} onBlur={(e) => setNorm({ qty: Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")) || 0 })} aria-label="Miqdori" className={`${input} !h-[36px] !w-[72px] shrink-0 text-[14px] tabular-nums`} />
                          <select value={n.unit} onChange={(e) => setNorm({ unit: e.target.value })} aria-label="O‘lchov birligi" className={`${input} !h-[36px] !w-[76px] shrink-0 px-1 text-[14px]`}>
                            {["kg", "g", "l", "dona"].map((u) => <option key={u}>{u}</option>)}
                          </select>
                          <button type="button" onClick={() => patch({ catering: s.catering.map((x, j) => (j === i ? { ...x, norms: (x.norms ?? []).filter((_, m) => m !== k) } : x)) })} aria-label="Me’yorni o‘chirish" className={`${del} !size-[36px]`}>✕</button>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" onClick={() => patch({ catering: s.catering.map((x, j) => (j === i ? { ...x, norms: [...(x.norms ?? []), { name: "", unit: "kg", qty: 0.1 }] } : x)) })} className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#FF6A00] hover:underline"><PlusIcon className="size-[11px]" />Mahsulot qo‘shish</button>
                </details>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => patch({ catering: [...s.catering, { id: `c${Date.now()}`, name: "", perGuest: 100_000, items: "" }] })} className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-[#FF6A00] hover:underline"><PlusIcon className="size-[12px]" />Paket qo‘shish</button>
        </section>

        <section className={`${card} lg:col-span-2`} aria-labelledby="h-rules">
          <h2 id="h-rules" className="font-sans text-[16px] font-bold text-[#0F172A]">To‘lov qoidalari</h2>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block"><span className={label}>Xizmat haqi (so‘m)</span><input inputMode="numeric" value={s.serviceFee ? num(s.serviceFee) : ""} onChange={(e) => patch({ serviceFee: money(e.target.value) })} placeholder="0" className={`${input} mt-1.5 tabular-nums`} /></label>
            <label className="block"><span className={label}>Depozit (%)</span><input inputMode="numeric" value={s.depositPct || ""} onChange={(e) => patch({ depositPct: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0) })} className={`${input} mt-1.5 tabular-nums`} /></label>
            <label className="block"><span className={label}>Dam olish kunlari ustamasi (%)</span><input inputMode="numeric" value={s.weekendPct || ""} onChange={(e) => patch({ weekendPct: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0) })} placeholder="0" className={`${input} mt-1.5 tabular-nums`} /></label>
            <label className="block"><span className={label}>Qolgan to‘lov — tadbirdan oldin (kun)</span><input inputMode="numeric" value={s.dueDaysBefore || ""} onChange={(e) => patch({ dueDaysBefore: Math.min(90, Number(e.target.value.replace(/\D/g, "")) || 0) })} placeholder="0" className={`${input} mt-1.5 tabular-nums`} /></label>
          </div>
          <h3 className="mt-6 font-sans text-[15px] font-bold text-[#0F172A]">Tadbir kuni</h3>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block"><span className={label}>Bitta stolga (kishi)</span><input inputMode="numeric" value={s.tableSize || ""} onChange={(e) => patch({ tableSize: Math.min(30, Number(e.target.value.replace(/\D/g, "")) || 0) })} placeholder="10" className={`${input} mt-1.5 tabular-nums`} /></label>
            <label className="block"><span className={label}>Bitta ofitsiantga (stol)</span><input inputMode="numeric" value={s.tablesPerWaiter || ""} onChange={(e) => patch({ tablesPerWaiter: Math.min(20, Number(e.target.value.replace(/\D/g, "")) || 0) })} placeholder="4" className={`${input} mt-1.5 tabular-nums`} /></label>
          </div>
          <button type="button" onClick={() => { setS({ ...DEFAULT_SETTINGS }); setDirty(true); }} className="mt-4 text-[13px] text-[#94A3B8] hover:text-[#475569]">Standart qiymatlarni tiklash</button>
        </section>
      </div>
    </main>
  );
}
