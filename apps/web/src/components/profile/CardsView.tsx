"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OtpBoxes, focusFirstEmpty } from "@/components/auth/OtpBoxes";
import { CardIcon, PlusIcon, TrashIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { cardBrand, expValid, formatCardNumber, formatExp, readCards, removeCard, saveCard, type SavedCard } from "@bazmly/api/payment";
import { readUser } from "@bazmly/api/user";
import { FrameButton, ProfileFrame } from "./ProfileFrame";

const BRAND: Record<NonNullable<SavedCard["brand"]>, { label: string; cls: string }> = {
  humo: { label: "HUMO", cls: "bg-[#334553] text-[#E9C46A]" },
  uzcard: { label: "UZCARD", cls: "bg-[#1C4E9C] text-white" },
  visa: { label: "VISA", cls: "bg-[#1A1F71] text-white" },
  mastercard: { label: "MC", cls: "bg-[#EB001B] text-white" },
  card: { label: "KARTA", cls: "bg-[#5B5B5B] text-white" },
};

// Figma: "Karta ma'lumotlari" — saqlangan kartalar, karta ustiga bosilsa "Olib tashlash"
export function CardsView() {
  const router = useRouter();
  const toast = useToast();
  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [holder, setHolder] = useState("");
  useEffect(() => { setCards(readCards()); setHolder(readUser().name ?? ""); }, []);

  useEffect(() => {
    if (menu === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <ProfileFrame title="Karta ma‘lumotlari" onBack={() => router.push("/profil")} footer={<FrameButton onClick={() => router.push("/profil")}>Tasdiqlash</FrameButton>}>
      <div className="flex flex-wrap gap-[20.5px] px-4 pb-10 sm:px-[28px] xl:pt-[13px]">
        {cards?.map((c, i) => {
          const b = BRAND[c.brand ?? "card"];
          return (
            <div key={`${c.last4}-${c.exp}`} className="relative w-full sm:w-[344.5px]">
              <button
                type="button" onClick={() => setMenu(menu === i ? null : i)} aria-haspopup="menu" aria-expanded={menu === i}
                aria-label={`${b.label} karta, oxiri ${c.last4}`}
                className="relative h-[167.5px] w-full rounded-[16px] border border-[#334553] bg-white dark:bg-[#2C2C2C] text-left transition-shadow hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              >
                <span className={`absolute left-[12px] top-[11px] grid h-[28px] min-w-[48px] place-items-center rounded-[4px] px-[6px] text-[10px] font-bold italic tracking-wide ${b.cls}`}>{b.label}</span>
                {i === 0 && <span className="absolute right-[12px] top-[14px] rounded-full bg-brand-50 dark:bg-[#483126] px-2 text-[11px] leading-[20px] text-brand">Asosiy</span>}
                <span className="absolute left-[12px] top-[81px] text-[16px] leading-[20px] text-black dark:text-[#FFFFFF]">{c.holder || holder}</span>
                <span className="absolute bottom-[6px] left-[12px] flex items-baseline gap-[6px] text-black dark:text-[#FFFFFF]">
                  <span className="text-[14px] tracking-[1px]">**** **** ****</span>
                  <span className="text-[16px]">{c.last4}</span>
                </span>
                <span className="absolute bottom-[12px] right-[12px] text-[13px] text-[#646464] dark:text-[#CFCFCF]">{c.exp}</span>
              </button>
              {menu === i && (
                <div role="menu" className="absolute right-0 top-0 z-10 flex h-[99.5px] w-[244.5px] flex-col items-center rounded-[20px] border border-[#D0D0D0] dark:border-[#6C6C6C] bg-[#FAFAFA] dark:bg-[#2C2C2C] pt-[15px] sm:left-[137px] sm:right-auto">
                  <button
                    type="button" role="menuitem" autoFocus
                    onClick={() => { setCards(removeCard(c)); setMenu(null); toast("Karta olib tashlandi"); }}
                    className="flex h-[40px] w-[167.5px] items-center justify-center gap-[24px] rounded-full bg-[#F12828] text-[14px] font-semibold text-white hover:bg-[#D91E1E]"
                  >
                    <TrashIcon className="size-[20px]" />Olib tashlash
                  </button>
                  <button type="button" role="menuitem" onClick={() => setMenu(null)} className="mt-[6px] h-[24px] text-[14px] text-black dark:text-[#FFFFFF] hover:text-brand">Bekor qilish</button>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button" onClick={() => router.push("/profil/kartalar/yangi")}
          className="relative h-[167.5px] w-full rounded-[16px] border border-[#EA6018] bg-white dark:bg-[#2C2C2C] text-left sm:w-[344.5px]"
        >
          <CardIcon className="absolute left-[14.5px] top-[17px] size-[36px] text-brand" />
          <span className="absolute bottom-[11.5px] left-[12px] flex h-[44px] items-center gap-[10px] rounded-full bg-[#FF6A00] pl-[14px] pr-[15.5px] text-[20px] text-white">
            <span className="grid size-[27px] place-items-center rounded-full bg-white dark:bg-[#2C2C2C] text-[#FF6A00]"><PlusIcon className="size-[13px]" /></span>
            Karta qo‘shish
          </span>
        </button>
      </div>
    </ProfileFrame>
  );
}

const PENDING = "bazmly:pending-card";

// Figma: karta qo'shish — raqam + muddat, so'ng SMS kod
export function AddCardView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const step = params.get("qadam") === "kod" ? "kod" : "forma";
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [touched, setTouched] = useState(false);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [codeErr, setCodeErr] = useState(false);
  const [left, setLeft] = useState(60);
  const expRef = useRef<HTMLInputElement>(null);

  const valid = num.length === 16 && expValid(exp);

  useEffect(() => {
    if (step !== "kod") return;
    try { if (!sessionStorage.getItem(PENDING)) router.replace("/profil/kartalar/yangi"); } catch {}
    setLeft(60);
  }, [step, router]);
  useEffect(() => { if (step === "kod" && left > 0) { const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); } }, [step, left]);

  const next = () => {
    setTouched(true);
    if (!valid) return;
    // TODO: backend — kartani tokenlash va SMS yuborish; to'liq raqam saqlanmaydi
    const pending: SavedCard = { last4: num.slice(-4), exp, brand: cardBrand(num), holder: readUser().name ?? "" };
    try { sessionStorage.setItem(PENDING, JSON.stringify(pending)); } catch {}
    setNum("");
    router.push("/profil/kartalar/yangi?qadam=kod");
  };
  const confirm = () => {
    if (code.some((d) => !d)) { setCodeErr(true); focusFirstEmpty(code); return; }
    try {
      const c: SavedCard = JSON.parse(sessionStorage.getItem(PENDING) ?? "null");
      if (!c) return router.replace("/profil/kartalar/yangi");
      saveCard(c); sessionStorage.removeItem(PENDING);
    } catch {}
    toast("Karta qo‘shildi");
    router.replace("/profil/kartalar");
  };

  if (step === "kod") {
    return (
      <ProfileFrame title="Karta ma‘lumotlari" onBack={() => router.push("/profil/kartalar/yangi")} footer={<FrameButton onClick={confirm}>Tasdiqlash</FrameButton>}>
        <div className="mx-auto w-full max-w-[508px] px-4 pb-10 pt-8 sm:px-0 xl:pt-[134px] xl:fit-tight:pt-[40px]">
          <h2 className="text-[28px] font-bold leading-[38px] text-black dark:text-[#FFFFFF] sm:text-[36px] sm:leading-[45px]">Send verification<br />code</h2>
          <p className="mt-[8px] text-[18px] leading-[26px] text-black dark:text-[#FFFFFF] sm:text-[23.5px] sm:leading-[30px]">We’ll send a code to your<br />phone number to verify your card</p>
          <div className="mt-[38px]"><OtpBoxes large value={code} onChange={(c) => { setCode(c); setCodeErr(false); }} error={codeErr} /></div>
          {codeErr && <p role="alert" className="mt-2 text-center text-[14px] text-red-600">Kodni to‘liq kiriting</p>}
          <button type="button" disabled={left > 0} onClick={() => setLeft(60)} className="mx-auto mt-[19px] block h-[24px] text-[16px] text-brand disabled:text-brand/60">
            Resent code{left > 0 ? ` (0:${String(left).padStart(2, "0")})` : ""}
          </button>
        </div>
      </ProfileFrame>
    );
  }

  return (
    <ProfileFrame title="Karta ma‘lumotlari" onBack={() => router.push("/profil/kartalar")} footer={<FrameButton onClick={next} disabled={!valid}>Tasdiqlash</FrameButton>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); next(); }} className="px-4 pb-10 sm:px-[28px] xl:pt-[13px]">
        <label className="flex h-[60px] w-full items-center gap-[12px] rounded-[16px] bg-[#F2F2F2] dark:bg-[#393939] px-[16px] sm:w-[356.5px]">
          <CardIcon filled className="size-[26px] shrink-0 text-brand" />
          <input
            inputMode="numeric" autoComplete="cc-number" aria-label="Karta raqami" placeholder="Karta raqami" autoFocus
            value={formatCardNumber(num)}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 16); setNum(d); if (d.length === 16) expRef.current?.focus(); }}
            className="w-full bg-transparent text-[20px] text-[#181818] dark:text-[#FFFFFF] outline-none placeholder:text-[#494949] dark:placeholder:text-[#CFCFCF] tabular-nums"
          />
        </label>
        <input
          ref={expRef} inputMode="numeric" autoComplete="cc-exp" aria-label="Amal qilish muddati" placeholder="OO/YY"
          value={exp} onChange={(e) => setExp(formatExp(e.target.value))}
          className="mt-[16px] h-[60px] w-[159.5px] rounded-[16px] bg-[#F2F2F2] dark:bg-[#393939] px-[14px] text-[20px] text-[#181818] dark:text-[#FFFFFF] outline-none placeholder:text-[16px] placeholder:text-[#181818] dark:placeholder:text-[#FFFFFF] tabular-nums"
        />
        {touched && !valid && (
          <p role="alert" className="mt-3 text-[14px] text-red-600">{num.length !== 16 ? "Karta raqamini to‘liq kiriting (16 raqam)" : "Amal qilish muddati noto‘g‘ri"}</p>
        )}
        <button type="submit" className="hidden" />
      </form>
    </ProfileFrame>
  );
}
