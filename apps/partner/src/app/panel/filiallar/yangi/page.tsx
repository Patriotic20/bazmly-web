"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { errorText } from "@bazmly/api/client";
import { addBranch, readStaff, syncStaff, type Staff } from "@bazmly/api/staff";
import { ChevronDownIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { MapPicker, TASHKENT, type LatLng } from "@/components/MapPicker";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { Avatar } from "../../hodimlar/Staff";

const fmt = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
const label = "block font-inter text-[13px] font-medium leading-[17px] text-[#111827]";
const input = "mt-[8px] h-[52px] w-full rounded-[8px] border border-[#C6C6C6] bg-white px-[16px] font-inter text-[16px] text-[#111827] outline-none transition-colors placeholder:text-[#8F949B] focus:border-[#FF6A00]";

// Figma: "Yangi filial qo'shish" — nom, manzil, xarita, ish vaqti, telefon, menejer
export default function NewBranch() {
  const router = useRouter();
  const toast = useToast();
  const [managers, setManagers] = useState<Staff[] | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pos, setPos] = useState<LatLng>(TASHKENT);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("23:00");
  const [digits, setDigits] = useState("");
  const [managerId, setManagerId] = useState<string | undefined>();
  const [big, setBig] = useState(false);

  useEffect(() => {
    const pick = (all: Staff[]) => all.filter((s) => s.active && (s.role === "menejer" || s.role === "admin")).sort((a, b) => a.name.localeCompare(b.name));
    setManagers(pick(readStaff()));
    syncStaff().then((all) => setManagers(pick(all))).catch(() => {});
  }, []);

  const valid = name.trim().length >= 2 && address.trim().length >= 3 && digits.length === 9 && /^\d\d:\d\d$/.test(from) && /^\d\d:\d\d$/.test(to) && from !== to;
  const [busy, setBusy] = useState(false);
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try { await addBranch({ name: name.trim(), address: address.trim(), lat: pos.lat, lng: pos.lng, from, to, phone: `+998${digits}`, managerId }); }
    catch (err) { setBusy(false); return toast(errorText(err)); }
    setBusy(false);
    toast(`“${name.trim()}” filiali qo‘shildi`);
    router.push("/panel/filiallar");
  };

  if (!managers) return null;
  return (
    <PartnerCard inPanel title="Yangi filial qo‘shish" onBack={() => router.push("/panel/filiallar")}
      action={<button type="submit" form="branch-form" disabled={!valid} className={primaryBtn}>Tasdiqlash</button>}>
      <form id="branch-form" noValidate onSubmit={submit} className="mx-auto w-full max-w-[690px] pt-2 sm:px-6 sm:pt-[142px] sm:fit-tight:pt-[12px] md:px-0">
        <div className="grid gap-x-[20px] gap-y-5 md:grid-cols-2">
          <label className="block">
            <span className={label}>Filial nomi</span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Masalan: Tashkent City filiali" className={input} />
          </label>
          <label className="block">
            <span className={label}>Manzil</span>
            <input value={address} onChange={(e) => setAddress(e.target.value.slice(0, 120))} placeholder="Ko‘cha va uy raqami" className={input} />
          </label>
        </div>

        <div className="relative mt-[40px] h-[144px] overflow-hidden rounded-[12px]">
          {!big && <MapPicker value={pos} onChange={setPos} className="size-full" />}
          <button type="button" onClick={() => setBig(true)}
            className="absolute bottom-[6px] left-1/2 z-[500] h-[24px] -translate-x-1/2 rounded-[6px] bg-white px-[8px] font-inter text-[13px] text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:text-[#FF6A00] md:left-[180px] md:translate-x-0">
            Xaritadan belgilash
          </button>
        </div>

        <div className="mt-[40px] grid gap-x-[20px] gap-y-5 md:grid-cols-2">
          <div>
            <span className={label} id="lbl-hours">Ish vaqti</span>
            <div className="flex items-center gap-[10px]" role="group" aria-labelledby="lbl-hours">
              <TimeInput value={from} onChange={setFrom} label="Ochilish vaqti" />
              <span className="mt-[8px] text-[#9CA3AF]" aria-hidden>-</span>
              <TimeInput value={to} onChange={setTo} label="Yopilish vaqti" />
            </div>
          </div>
          <label className="block">
            <span className={label}>Telefon</span>
            <span className="mt-[8px] flex h-[52px] items-center rounded-[8px] border border-[#C6C6C6] bg-white pl-[16px] font-inter text-[16px] transition-colors focus-within:border-[#FF6A00]">
              <span className="text-[14px] text-[#6B7280]">+998</span>
              <span className="mx-[8px] h-[18px] w-px bg-[#D1D5DB]" aria-hidden />
              <input type="tel" inputMode="numeric" value={fmt(digits)} onChange={(e) => { let d = e.target.value.replace(/\D/g, ""); if (d.length > 9 && d.startsWith("998")) d = d.slice(3); setDigits(d.slice(0, 9)); }}
                placeholder="90 123 45 67" aria-label="Filial telefon raqami" className="h-full w-full min-w-0 bg-transparent pr-3 text-[#111827] outline-none placeholder:text-[#8F949B] tabular-nums" />
            </span>
          </label>
        </div>

        <div className="mt-[40px] md:w-[calc(50%-10px)]">
          <ManagerSelect list={managers} value={managerId} onChange={setManagerId} />
          <p className="mt-[8px] flex items-center gap-[6px] font-inter text-[12px] text-[#6B7280]">
            <svg viewBox="0 0 20 20" className="size-[12px] shrink-0 text-[#FF6A00]" aria-hidden><circle cx="10" cy="10" r="10" fill="currentColor" /><path d="M10 9v5M10 6.2v.1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
            Menejer filialni to‘liq boshqarish huquqiga ega bo‘ladi
          </p>
        </div>
        <button type="submit" hidden />
      </form>

      {big && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setBig(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Xaritadan belgilash" className="flex h-[min(640px,85svh)] w-[min(960px,100%)] flex-col overflow-hidden rounded-[20px] bg-white">
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-[18px] font-bold text-[#111827]">Filial joylashuvi</p>
              <span className="font-inter text-[13px] text-[#6B7280]">Xaritani bosing yoki pinni suring</span>
            </div>
            <MapPicker value={pos} onChange={setPos} zoom={14} controls className="min-h-0 flex-1" />
            <div className="flex justify-end gap-3 px-5 py-4">
              <button type="button" onClick={() => {
                navigator.geolocation?.getCurrentPosition((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }), () => toast("Joylashuvni aniqlab bo‘lmadi"));
              }} className="h-11 rounded-[12px] border border-[#E5E7EB] px-4 font-inter text-[15px] text-[#374151] hover:bg-[#F9FAFB]">Mening joylashuvim</button>
              <button type="button" onClick={() => setBig(false)} className="h-11 rounded-[12px] bg-[#FF6A00] px-6 font-inter text-[15px] text-white hover:bg-[#F06300]">Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}
    </PartnerCard>
  );
}

/** 24 soatlik vaqt (HH:MM) — brauzer tilidan qat'i nazar "09:00" ko'rinishida */
function TimeInput({ value, onChange, label: aria }: { value: string; onChange: (v: string) => void; label: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 4);
    if (!d) { setText(value); return; }
    const h = Math.min(23, Number(d.length <= 2 ? d : d.slice(0, d.length - 2)));
    const m = d.length <= 2 ? 0 : Math.min(59, Number(d.slice(-2)));
    const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setText(v); onChange(v);
  };
  return (
    <input
      inputMode="numeric" aria-label={aria} value={text} placeholder="00:00" maxLength={5}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
        const t = d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
        setText(t);
        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) onChange(t);
      }}
      onBlur={(e) => commit(e.target.value)}
      className={`${input} min-w-0 flex-1 tabular-nums`}
    />
  );
}

function ManagerSelect({ list, value, onChange }: { list: Staff[]; value?: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const cur = list.find((s) => s.id === value);
  return (
    <div ref={box} className="relative">
      <span className={label} id="lbl-mgr">Menejer tanlash</span>
      <button type="button" aria-labelledby="lbl-mgr" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`mt-[8px] flex h-[52px] w-full items-center gap-[13px] rounded-[8px] border bg-white pl-[16px] pr-[14px] text-left font-inter text-[16px] text-[#111827] transition-colors ${open ? "border-[#FF6A00]" : "border-[#C6C6C6] hover:border-[#FF6A00]"}`}>
        {cur ? <><Avatar s={cur} className="size-[24px] text-[10px]" /><span className="flex-1 truncate">{cur.name}</span></> : <span className="flex-1 text-[#8F949B]">{list.length ? "Menejerni tanlang" : "Menejer yo‘q — avval hodim qo‘shing"}</span>}
        <ChevronDownIcon className={`size-[18px] shrink-0 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && list.length > 0 && (
        <ul role="listbox" aria-labelledby="lbl-mgr" className="absolute inset-x-0 top-[calc(100%+4px)] z-30 max-h-[240px] overflow-y-auto rounded-[12px] border border-[#ECECEC] bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          {list.map((s) => (
            <li key={s.id}>
              <button type="button" role="option" aria-selected={s.id === value} onClick={() => { onChange(s.id); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-inter text-[15px] hover:bg-[#FFF8F3] ${s.id === value ? "text-[#FF6A00]" : "text-[#111827]"}`}>
                <Avatar s={s} className="size-[28px] text-[11px]" />
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-[12px] text-[#9CA3AF]">{s.role === "admin" ? "Admin" : "Menejer"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
