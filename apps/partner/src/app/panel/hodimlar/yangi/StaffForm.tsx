"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { phoneTaken, readStaff, roleLabel, ROLES, saveStaff, type Role, type Staff } from "@bazmly/api/staff";
import { ChevronRightIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";

const fmt = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
const box = "flex h-[54px] w-full items-center gap-[15px] rounded-[8px] border border-black bg-white pl-[17px] pr-[14px] font-inter text-[16px] text-[#111827] transition-colors focus-within:border-[#FF6A00]";
const label = "block font-inter text-[13px] font-medium leading-[17px] text-[#111827]";

const UserIcon = () => (
  <svg viewBox="0 0 16 16" className="size-[16px] shrink-0 text-[#9CA3AF]" fill="currentColor" aria-hidden><circle cx="8" cy="4.6" r="3" /><path d="M2.2 14c0-3 2.6-5 5.8-5s5.8 2 5.8 5c0 .4-.3.7-.7.7H2.9c-.4 0-.7-.3-.7-.7z" /></svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[17px] shrink-0 text-[#9CA3AF]" fill="currentColor" aria-hidden><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" /></svg>
);
const BadgeIcon = () => (
  <svg viewBox="0 0 18 18" className="size-[17px] shrink-0 text-[#9CA3AF]" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M7 1.5h4a1 1 0 011 1V4h3a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 16H3a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 013 4h3V2.5a1 1 0 011-1zM7.5 3v2h3V3h-3zM6 8.2a1.6 1.6 0 100 3.2 1.6 1.6 0 000-3.2zm-2.6 5.6c.2-1.2 1.3-2 2.6-2s2.4.8 2.6 2H3.4zM10.5 9h4v1.3h-4V9zm0 2.6h3v1.3h-3v-1.3z" />
  </svg>
);

// Figma: "Hodim qo'shish" — ism, telefon, lavozim (alohida ro'yxat), aktiv holat
export function StaffForm() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const editId = params.get("id");
  const picking = params.get("lavozim") === "1";
  const [ready, setReady] = useState(false);
  const [orig, setOrig] = useState<Staff | null>(null);
  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [role, setRole] = useState<Role | undefined>();
  const [active, setActive] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);

  useEffect(() => {
    if (editId) {
      const s = readStaff().find((x) => x.id === editId);
      if (!s) { router.replace("/panel/hodimlar"); return; }
      setOrig(s); setName(s.name); setDigits(s.phone.replace(/^\+998/, "")); setRole(s.role); setActive(s.active);
    }
    setReady(true);
  }, [editId, router]);

  const go = (pick: boolean) => {
    const sp = new URLSearchParams(params.toString());
    if (pick) sp.set("lavozim", "1"); else sp.delete("lavozim");
    const url = `${pathname}${sp.size ? `?${sp}` : ""}`;
    if (pick) router.push(url, { scroll: false }); else router.replace(url, { scroll: false });
  };

  const valid = name.trim().length >= 3 && digits.length === 9;
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!valid) return;
    const phone = `+998${digits}`;
    if (phoneTaken(phone, orig?.id)) return toast("Bu telefon raqam boshqa hodimga biriktirilgan");
    if (!role) { toast("Lavozimni tanlang"); go(true); return; }
    // TODO: backend — POST /partner/staff (login va vaqtinchalik parol SMS orqali yuboriladi)
    saveStaff({ id: orig?.id, name: name.trim().replace(/\s+/g, " "), phone, role, active, avatar: orig?.avatar });
    toast(orig ? "Hodim ma’lumotlari saqlandi" : `${name.trim()} qo‘shildi — login SMS orqali yuborildi`);
    router.push("/panel/hodimlar");
  };

  if (!ready) return null;
  const title = orig ? "Hodimni tahrirlash" : "Hodim qo‘shish";

  if (picking) {
    return (
      <PartnerCard inPanel title={title} onBack={() => go(false)}
        action={<button type="button" disabled={!role} onClick={() => go(false)} className={primaryBtn}>Tasdiqlash</button>}>
        <ul className="mx-auto w-full max-w-[356.5px] space-y-[12px] pt-2 sm:pt-[141px] sm:fit-tight:pt-[12px]" role="listbox" aria-label="Lavozim">
          {ROLES.map((r) => {
            const on = role === r.id;
            return (
              <li key={r.id}>
                <button type="button" role="option" aria-selected={on} onClick={() => { setRole(r.id); go(false); }}
                  className={`flex h-[52px] w-full items-center justify-between rounded-[8px] border pl-[13px] pr-[18px] text-left font-inter text-[16px] text-black transition-colors ${on ? "border-[1.5px] border-[#FF6A00] bg-[#FFF8F3]" : "border-[#5C5C5C] hover:border-[#FF6A00]"}`}>
                  {r.label}
                  <ChevronRightIcon className="h-[12px] w-[7px]" />
                </button>
              </li>
            );
          })}
        </ul>
      </PartnerCard>
    );
  }

  return (
    <PartnerCard inPanel title={title} onBack={() => router.push("/panel/hodimlar")}
      action={<button type="submit" form="staff-form" disabled={!valid} className={primaryBtn}>Tasdiqlash</button>}>
      <form id="staff-form" noValidate onSubmit={submit} className="mx-auto w-full max-w-[334.5px] pt-2 sm:pt-[142px] sm:fit-tight:pt-[12px]">
        <p className="font-inter text-[13px] leading-[17.5px] text-[#6B7280]">
          Yangi xodim ma’lumotlarini kiriting. Ular tizimga<br className="hidden sm:block" />{" "}kirish uchun SMS xabarnoma oladilar.
        </p>

        <label className="mt-[30px] fit-tight:mt-[18px] block">
          <span className={label}>Ism</span>
          <span className={`${box} mt-[10.5px]`}>
            <UserIcon />
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Xodimning to‘liq ismi" autoComplete="off"
              className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-[#8F949B]" />
          </span>
        </label>

        <label className="mt-[24px] fit-tight:mt-[14px] block">
          <span className={label}>Telefon raqami</span>
          <span className={`${box} mt-[10.5px]`}>
            <PhoneIcon />
            <input type="tel" inputMode="numeric" autoComplete="off" placeholder="+998 90 123 45 67"
              value={digits || phoneFocus ? `+998 ${fmt(digits)}` : ""}
              onFocus={() => setPhoneFocus(true)} onBlur={() => setPhoneFocus(false)}
              onChange={(e) => { let d = e.target.value.replace(/\D/g, ""); if (d.startsWith("998")) d = d.slice(3); setDigits(d.slice(0, 9)); }}
              className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-[#8F949B] tabular-nums" />
          </span>
        </label>

        <div className="mt-[24px] fit-tight:mt-[14px]">
          <span id="lbl-role" className={label}>Lavozim</span>
          <button type="button" aria-labelledby="lbl-role" onClick={() => go(true)} className={`${box} mt-[10.5px] text-left hover:border-[#FF6A00]`}>
            <BadgeIcon />
            <span className="flex-1">{role ? roleLabel(role) : "Lavozimni tanlang"}</span>
          </button>
        </div>

        <div className="mt-[24px] fit-tight:mt-[14px] flex h-[76.5px] items-center gap-[13px] rounded-[8px] border border-black pl-[16px] pr-[16px] font-inter">
          <span className="grid size-[36px] shrink-0 place-items-center rounded-[8px] bg-[#FFF0E5]" aria-hidden>
            <svg viewBox="0 0 18 10" className="h-[9px] w-[17px] text-[#FF6A00]" fill="currentColor"><rect width="18" height="10" rx="5" /><circle cx="13" cy="5" r="2.6" fill="#fff" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-medium leading-[20px] text-[#111827]" id="lbl-active">Active Status</span>
            <span className="block text-[12px] leading-[16px] text-[#6B7280]">Xodim tizimga kira oladi</span>
          </span>
          <button type="button" role="switch" aria-checked={active} aria-labelledby="lbl-active" onClick={() => setActive(!active)}
            className={`relative h-[24px] w-[47px] shrink-0 rounded-full transition-colors ${active ? "bg-[#FF6A00]" : "bg-[#C7C7C7]"}`}>
            <span className={`absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left] ${active ? "left-[26px]" : "left-[3px]"}`} />
          </button>
        </div>

        <p className="mt-[24px] flex min-h-[70.5px] items-start gap-[14px] rounded-[8px] bg-[#FFF0E5] px-[17px] py-[17px] font-inter text-[14px] leading-[18px] text-[#111827]">
          <svg viewBox="0 0 20 20" className="mt-[1px] size-[19px] shrink-0 text-[#E85102]" aria-hidden><circle cx="10" cy="10" r="10" fill="currentColor" /><path d="M10 9v5M10 6.2v.1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" /></svg>
          Login va vaqtinchalik parol avtomatik tarzda SMS orqali yuboriladi.
        </p>
        <button type="submit" hidden />
      </form>
    </PartnerCard>
  );
}
