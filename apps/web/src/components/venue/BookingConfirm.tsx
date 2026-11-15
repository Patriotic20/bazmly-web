"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fit } from "@bazmly/ui/Fit";
import { useEffect, useMemo, useState } from "react";
import { USER_KEY } from "@bazmly/api/user";
import { AuthCard, primaryBtn } from "@/components/auth/AuthCard";
import { focusFirstEmpty, OtpBoxes } from "@/components/auth/OtpBoxes";
import { CallIcon, CardIcon, ChevronRightIcon, DiscountOutlineIcon, PlusCircleIcon, PlusIcon, UserIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { HALL_STEPS, readDraft, saveDraft, WEEKDAYS } from "@bazmly/api/booking";
import {
  BOOKINGS_KEY, DEPOSIT_PER_PERSON, expValid, formatCardNumber, formatExp, formatUzs,
  cardBrand, readCard, saveCard, type SavedCard,
} from "@bazmly/api/payment";
import type { VenueDetails } from "@bazmly/api/venues";
import { Stepper } from "./Stepper";
import { markVoucherUsed, promoInfo } from "@bazmly/api/vouchers";
import { useCart } from "./useCart";

type Step = "form" | "tolov" | "karta" | "kod" | "hisob";
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];

export const formatPhone = (d: string) => {
  const x = d.slice(0, 9);
  return [x.slice(0, 2), x.slice(2, 5), x.slice(5, 7), x.slice(7, 9)].filter(Boolean).join(" ");
};

const disabledBtn = "disabled:bg-[#F3D5C5] dark:disabled:bg-[#5C3E2E] dark:disabled:text-white/30 disabled:text-[#F8F8F8] disabled:cursor-not-allowed";
const bigBtn = `h-[56px] w-full rounded-[20px] bg-brand text-[20px] font-semibold text-white transition-colors hover:bg-brand-600 ${disabledBtn}`;

// Figma: 4-bosqich — "Ma'lumotlarni to'ldiring" → to'lov usuli → karta → SMS → to'lov ma'lumotlari
export function BookingConfirm({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const cart = useCart(v.id, v.menu);
  const step = (params.get("qadam") as Step) || "form";
  const base = `/${v.type === "toyxona" ? "toyxonalar" : "restoranlar"}/${v.id}/bron/tasdiqlash`;
  const go = (s: Step) => router.push(s === "form" ? base : `${base}?qadam=${s}`, { scroll: false });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState<SavedCard | null>(null);
  const [draft, setDraft] = useState(readDraftSafe(v.id));

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem(USER_KEY) ?? "{}");
      const d = readDraft(v.id);
      setName(d.name ?? u.name ?? "");
      setPhone((d.phone ?? u.phone ?? "").replace(/^\+998/, "").replace(/\D/g, ""));
      setDraft(d);
    } catch {}
    setCard(readCard());
  }, [v.id]);

  const formValid = name.trim().length >= 2 && phone.length === 9;
  const steps = v.type === "toyxona" ? HALL_STEPS : ["Restoranni belgilang", "Menu", "Kun va vaqtni belgilang", "Ma‘lumotlarni tasdiqlash"];

  const finish = (method: "joyida" | "karta", amount: number, voucher?: string) => {
    if (voucher) markVoucherUsed(voucher);
    const booking = {
      id: `B${Date.now().toString().slice(-6)}`,
      venueId: v.id, venueName: v.name, type: v.type,
      ...readDraft(v.id), name: name.trim(), phone: `+998${phone}`,
      items: cart.lines.map((l) => ({ id: l.item.id, name: l.item.name, qty: l.qty, price: l.item.price })),
      method, amount, createdAt: new Date().toISOString(),
      receipt: randomDigits(10), code: randomDigits(16),
    };
    try {
      const list = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? "[]");
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking, ...list]));
      sessionStorage.setItem("bazmly:last-booking", JSON.stringify(booking));
      sessionStorage.removeItem(`bazmly:booking:${v.id}`);
      sessionStorage.removeItem(`bazmly:cart:${v.id}`);
    } catch {}
    // TODO: backend — POST /bookings
    router.push(`/bron/tasdiqlandi?id=${booking.id}`);
  };

  return (
    <div className="container-page pb-16 lg:pb-0">
      <Fit gap={24}>
      <div className="pt-5 md:pt-8 xl:pt-[74px] xl:fit-tight:pt-[22px]">
        <Stepper steps={steps} current={4} checkDone={false} />
      </div>

      <div className={`mt-10 flex justify-center ${step === "hisob" ? "lg:mt-[109px] lg:fit-tight:mt-[36px]" : "lg:mt-[133px] lg:fit-tight:mt-[40px]"}`}>
        {(step === "form" || step === "tolov") && (
          <section className="grid w-full max-w-[770px] grid-cols-[minmax(0,1fr)] gap-8 rounded-[20px] bg-[#F6F6F6] dark:bg-[#393939] p-4 sm:p-[20px] sm:pt-[40px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-[40px]">
            {/* Chap: ma'lumotlar */}
            <div>
              <h1 className="h-[18px] text-[22px] font-semibold leading-[18px] text-[#1F1F1F] dark:text-[#FFFFFF] sm:text-[24px]">Ma‘lumotlarni to‘ldiring</h1>

              <Field label="Ism/Familiya" className="mt-[32px]" htmlFor="b-name">
                <UserIcon className="size-[24px] shrink-0 text-[#292D32] dark:text-[#FFFFFF]" />
                <input
                  id="b-name" value={name} onChange={(e) => { setName(e.target.value); saveDraft(v.id, { name: e.target.value }); }}
                  placeholder="Ism/Familiya" autoComplete="name"
                  className="-mt-[3.5px] w-full bg-transparent text-[20px] font-semibold text-[#1F1F1F] dark:text-[#FFFFFF] outline-none placeholder:text-[#1F1F1F] dark:placeholder:text-[#FFFFFF]"
                />
              </Field>

              <Field label="Telefon raqam" className="mt-[32px]" htmlFor="b-phone">
                <CallIcon className="size-[24px] shrink-0 text-[#292D32] dark:text-[#FFFFFF]" />
                <span className="-mr-[6px] -mt-[3.5px] text-[20px] font-semibold text-[#1F1F1F] dark:text-[#FFFFFF]">+998</span>
                <input
                  id="b-phone" type="tel" inputMode="numeric" value={formatPhone(phone)}
                  onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 9); setPhone(d); saveDraft(v.id, { phone: `+998${d}` }); }}
                  placeholder="** *** ** **" autoComplete="tel-national"
                  className="-mt-[3.5px] w-full bg-transparent text-[20px] font-semibold text-[#1F1F1F] dark:text-[#FFFFFF] outline-none placeholder:text-[#1F1F1F] dark:placeholder:text-[#FFFFFF]"
                />
              </Field>

              <p className="mt-[32px] h-[12px] text-[16px] leading-[12px] text-[#1F1F1F] dark:text-[#FFFFFF]">Ma‘lumot</p>
              <p className="mt-[24px] rounded-[16px] bg-white dark:bg-[#2C2C2C] px-[24px] pb-[16px] pt-[17px] text-[16px] leading-[26px] text-[#1F1F1F] dark:text-[#FFFFFF] md:h-[138px]">
                Band qilingan vaqtgacha yetib kelishingizni so‘raymiz. Kechikish 40 daqiqadan oshsa, band avtomatik bekor qilinishi mumkin.
              </p>
            </div>

            {/* O'ng: to'lov usuli yoki "Keyingisi" */}
            <div className="flex min-w-0 flex-col">
              {step === "tolov" && (
                <div className="no-scrollbar -mx-4 flex snap-x gap-[20px] overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  {card && <CardVisual card={card} onClick={() => go("hisob")} />}
                  <button
                    type="button"
                    onClick={() => go("karta")}
                    className={`relative h-[194px] shrink-0 snap-start rounded-[16px] border border-[#FF6A00] bg-white text-left dark:border-[#D9D9D9] dark:bg-[#393939] ${card ? "w-[263px]" : "w-full"}`}
                  >
                    <CardIcon className="absolute left-[12px] top-[12px] size-[41px] text-brand dark:text-white" />
                    <span className="absolute bottom-[12px] left-[12px] flex h-[44px] items-center gap-[10px] rounded-full bg-[#FF6A00] pl-[14px] pr-[16px] text-[20px] font-medium text-white">
                      <span className="grid size-[27px] place-items-center rounded-full bg-white text-[#FF6A00]"><PlusIcon className="size-[13px]" /></span>
                      Karta qo‘shish
                    </span>
                  </button>
                </div>
              )}
              <div className="mt-6 md:mt-auto">
                {step === "form" ? (
                  <button type="button" disabled={!formValid} onClick={() => { saveDraft(v.id, { name, phone: `+998${phone}` }); go("tolov"); }} className={bigBtn}>
                    Keyingisi
                  </button>
                ) : (
                  <button type="button" disabled={!formValid} onClick={() => finish("joyida", 0)} className={bigBtn}>
                    Borganda to‘lash
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {step === "karta" && <CardForm onDone={(c) => { setCard(c); go("kod"); }} holder={name} />}

        {step === "kod" && (
          <OtpStep
            phone={`+998 ${formatPhone(phone)}`}
            onClose={() => go("tolov")}
            onDone={() => { if (!card) return go("karta"); saveCard(card); go("tolov"); toast("Karta qo‘shildi"); }}
          />
        )}

        {step === "hisob" && (
          <Summary v={v} card={card} cartTotal={cart.total} people={draft.people ?? 1} date={draft.date} time={draft.time} onAddCard={() => go("karta")} onPay={(amount, voucher) => finish("karta", amount, voucher)} />
        )}
      </div>
      </Fit>
    </div>
  );
}

export function randomDigits(n: number) {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => x % 10).join("");
}

function readDraftSafe(id: string) {
  if (typeof window === "undefined") return {} as ReturnType<typeof readDraft>;
  return readDraft(id);
}

function Field({ label, children, className = "", htmlFor }: { label: string; children: React.ReactNode; className?: string; htmlFor: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block h-[12px] text-[16px] leading-[12px] text-[#1F1F1F] dark:text-[#FFFFFF]">{label}</label>
      <div className="mt-[24px] flex h-[48px] items-start gap-[12px] border-b border-[#D9D9D9] dark:border-[#6C6C6C] focus-within:border-brand">{children}</div>
    </div>
  );
}

function CardVisual({ card, onClick }: { card: SavedCard; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Karta •••• ${card.last4} bilan to‘lash`}
      className="relative h-[194px] w-[264px] shrink-0 snap-start overflow-hidden rounded-[16px] bg-gradient-to-br from-[#FF7A1A] to-[#E85102] text-left text-white shadow-[0_8px_24px_rgba(232,81,2,0.3)] dark:border dark:border-[#D9D9D9] dark:bg-none dark:bg-[#393939] dark:shadow-none transition-transform hover:-translate-y-0.5"
    >
      <span className="absolute left-[12px] top-[12px] h-[28px] w-[49px] rounded-[6px] bg-gradient-to-br from-[#FFE2B8] to-[#F5B866] dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/home/humo-dark.png" alt="" className="absolute left-[12px] top-[12px] hidden h-[33.5px] w-[54.5px] dark:block" />
      <span className="absolute left-[12px] top-[99px] text-[16px] font-medium">{card.holder || "Karta egasi"}</span>
      <span className="absolute bottom-[12px] left-[12px] text-[16px] tracking-wider tabular-nums">**** **** **** {card.last4}</span>
      <span className="absolute bottom-[12px] right-[12px] text-[13px] opacity-80 dark:hidden">{card.exp}</span>
    </button>
  );
}

export function CardForm({ onDone, holder }: { onDone: (c: SavedCard) => void; holder: string }) {
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = num.length === 16 && expValid(exp);

  return (
    <section className="w-full max-w-[397px] rounded-[20px] bg-[#F6F6F6] dark:bg-[#393939] px-4 pb-[20px] pt-[40px] sm:px-[20px]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!valid) return;
          // TODO: backend — kartani tokenlash (UzCard/Humo), SMS yuborish
          onDone({ last4: num.slice(-4), holder, exp, brand: cardBrand(num) });
        }}
        className="flex min-h-[456px] flex-col"
      >
        <label className="flex h-[60px] items-center gap-[10px] rounded-[16px] bg-white dark:bg-[#2C2C2C] px-[14px]">
          <CardIcon filled={num.length > 0} className="size-[24px] shrink-0 text-brand dark:text-white" />
          <input
            inputMode="numeric" autoComplete="cc-number" aria-label="Karta raqami" placeholder="Karta raqami"
            value={formatCardNumber(num)} onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
            className="w-full bg-transparent text-[20px] text-[#181818] dark:text-[#FFFFFF] outline-none placeholder:text-[#494949] dark:placeholder:text-[#CFCFCF] tabular-nums"
          />
        </label>
        <input
          inputMode="numeric" autoComplete="cc-exp" aria-label="Amal qilish muddati" placeholder="OO/YY"
          value={exp} onChange={(e) => setExp(formatExp(e.target.value))}
          className="mt-[16px] h-[60px] w-[160px] rounded-[16px] bg-white dark:bg-[#2C2C2C] px-[14px] text-[20px] text-[#181818] dark:text-[#FFFFFF] outline-none placeholder:text-[18px] placeholder:text-[#181818] dark:placeholder:text-[#FFFFFF] tabular-nums"
        />
        {touched && !valid && (
          <p role="alert" className="mt-3 text-[14px] text-red-600">
            {num.length !== 16 ? "Karta raqamini to‘liq kiriting (16 raqam)" : "Amal qilish muddati noto‘g‘ri"}
          </p>
        )}
        <button type="submit" disabled={!valid} className={`mx-auto mt-auto block max-w-[345px] ${bigBtn}`}>Keyingisi</button>
      </form>
    </section>
  );
}

export function OtpStep({ phone, onClose, onDone }: { phone: string; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [left, setLeft] = useState(60);
  useEffect(() => { if (left > 0) { const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); } }, [left]);

  return (
    <AuthCard
      onSubmit={(e) => {
        e.preventDefault();
        if (code.some((d) => !d)) { setError(true); focusFirstEmpty(code); return; }
        // TODO: backend — kartani SMS kod bilan tasdiqlash
        onDone();
      }}
    >
      <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-[18px] place-items-center text-black dark:text-[#FFFFFF]">
        <svg viewBox="0 0 18 18" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 1l16 16M17 1L1 17" /></svg>
      </button>
      <h1 className="mt-[20px] text-[26px] font-bold leading-[1.25] tracking-[-0.01em] text-black dark:text-[#FFFFFF] sm:whitespace-nowrap sm:text-[32px] sm:leading-[40px]">
        Send verification
        <br className="hidden sm:block" />{" "}code
      </h1>
      <p className="mt-[10px] text-[16px] leading-[1.4] text-black dark:text-[#FFFFFF] sm:whitespace-nowrap sm:text-[20px] sm:leading-[25px] sm:tracking-[-0.3px]">
        We’ll send a code to your
        <br className="hidden sm:block" />{" "}phone number to verify your account.
      </p>
      <span className="sr-only">Kod {phone} raqamiga yuborildi</span>
      <div className="mt-[20px]"><OtpBoxes value={code} onChange={(c) => { setCode(c); setError(false); }} error={error} /></div>
      <button type="button" disabled={left > 0} onClick={() => setLeft(60)} className="mt-[20px] block h-[20px] w-full text-center text-[16px] font-medium leading-[20px] text-brand disabled:text-brand/60">
        Resent code{left > 0 ? ` (${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")})` : ""}
      </button>
      {error && <p role="alert" className="mt-[12px] text-center text-[14px] text-red-600">Kodni to‘liq kiriting</p>}
      <button type="submit" className={`mt-10 sm:mt-[111px] ${primaryBtn}`}>Next</button>
    </AuthCard>
  );
}

function Summary({ v, card, cartTotal, people, date, time, onAddCard, onPay }: {
  v: VenueDetails; card: SavedCard | null; cartTotal: number; people: number; date?: string; time?: string;
  onAddCard: () => void; onPay: (amount: number, voucher?: string) => void;
}) {
  const toast = useToast();
  const [promo, setPromo] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const base = v.type === "toyxona" && v.price ? v.price : cartTotal > 0 ? cartTotal : people * DEPOSIT_PER_PERSON;
  const info = promo ? promoInfo(promo) : null;
  const pct = (v.discount ?? 0) + (info?.pct ?? 0);
  const off = info?.amount ?? 0;
  const total = Math.max(0, Math.round(((base * (100 - pct)) / 100 - off) / 1000) * 1000);

  const when = useMemo(() => {
    if (!date) return "—";
    const d = new Date(`${date}T00:00:00`);
    return `${d.getDate()} - ${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}${time ? ` ${time}` : ""}`;
  }, [date, time]);

  return (
    <div className="relative w-full max-w-[416px]">
      <h1 className="h-[28px] text-center text-[24px] font-semibold leading-[28px] text-[#181818] dark:text-[#FFFFFF]">To‘lov ma‘lumotlari</h1>
      <div className="mt-[20px] rounded-[20px] border-2 border-[#D0D0D0] dark:border-[#393939] bg-white dark:bg-[#393939] px-4 pb-6 pt-6 sm:px-[27.5px] sm:pb-[28px] sm:pt-[28px]">
        <button type="button" onClick={onAddCard} className="flex h-[60px] w-full items-center gap-[10px] rounded-[16px] bg-[#E8E8E8] dark:bg-[#2C2C2C] px-[14px] text-left">
          <CardIcon filled className="h-[24px] w-[30px] shrink-0 text-[#2C2C2C] dark:text-[#959595]" />
          <span className="flex-1 text-[18px] text-[#181818] dark:text-[#FFFFFF]">{card ? `**** **** **** ${card.last4}` : "To‘lov kartasini qo‘shing"}</span>
          <PlusCircleIcon className="size-[20px] text-[#181818] dark:text-[#FFFFFF]" />
        </button>

        <button type="button" onClick={() => setPromoOpen(true)} className="mt-[16px] block h-[84px] w-full rounded-[16px] bg-[#E8E8E8] dark:bg-[#2C2C2C] px-[14px] text-left">
          <span className="block pt-[10px] text-[16px] text-[#181818] dark:text-[#FFFFFF]">Promokod kiriting</span>
          <span className="mt-[12px] flex items-center gap-[16px]">
            <span className="grid size-[28px] place-items-center rounded-full bg-[#FC8530] text-white"><DiscountOutlineIcon className="size-[19px]" /></span>
            <span className={`flex-1 ${promo ? "text-[16px] font-semibold text-brand" : "text-[18px] tracking-widest text-[#494949] dark:text-[#FFFFFF]"}`}>{promo ?? "****"}</span>
            <ChevronRightIcon className="h-[18px] w-[9px] text-[#181818] dark:text-[#FFFFFF]" />
          </span>
        </button>

        <div className="mt-[16px] rounded-[16px] bg-[#E8E8E8] dark:bg-[#2C2C2C] p-[8px] pt-[8px]">
          <div className="flex h-[26px] items-center justify-between px-[14px] text-[14px] text-[#181818] dark:text-[#FFFFFF]">
            <span>To‘lov turi</span><span>Depozit</span>
          </div>
          <div className="mt-[9px] flex h-[34px] items-center justify-between px-[14px] text-[18px] text-[#181818] dark:text-[#FFFFFF]">
            <span>Bron vaqti:</span><span className="font-medium">{when}</span>
          </div>
          <div className="mt-[9px] rounded-[12px] bg-white dark:bg-[#393939] px-[14px] pb-[11px] pt-[11px]">
            <div className="flex items-start justify-between">
              {pct > 0 || off > 0 ? <span className="rounded-[6px] bg-[#FFCC7A] dark:bg-[linear-gradient(90deg,#FFD3A2,#F0BC58)] px-[6px] text-[14px] leading-[22px] text-[#181818]">Foyda {[pct ? `${pct}%` : "", off ? `${off.toLocaleString("ru-RU").replace(/\s/g, " ")} so‘m` : ""].filter(Boolean).join(" + ")}</span> : <span />}
              {(pct > 0 || off > 0) && <span className="pt-[10px] text-[14px] leading-[17px] text-[#6C6C6C] dark:text-[#828282] line-through">{formatUzs(base)}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[18px] text-[#181818] dark:text-[#FFFFFF]">Jami to‘lov:</span>
              <span className="text-[24px] font-medium leading-[22px] text-[#181818] dark:text-[#FFFFFF]">{formatUzs(total)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (card ? onPay(total, info?.amount ? info.code : undefined) : (toast("Avval to‘lov kartasini qo‘shing"), onAddCard()))}
          className={`mt-10 sm:mt-[65px] ${primaryBtn}`}
        >
          Next
        </button>
      </div>

      {promoOpen && <PromoDialog onClose={() => setPromoOpen(false)} onApply={(code) => { const i = promoInfo(code); setPromo(code); setPromoOpen(false); toast(`Promokod qo‘llandi: −${i?.pct ? `${i.pct}%` : `${i?.amount.toLocaleString("ru-RU").replace(/\s/g, " ")} so‘m`}`); }} />}
    </div>
  );
}

// Figma: Promokod oynasi (3407:17136) — 393×328, tepada "tortish" chizig'i.
// Kompyuterda to'lov kartasi ustida (sarlavhadan 37px pastda), telefonda pastdan chiqadigan panel.
function PromoDialog({ onClose, onApply }: { onClose: () => void; onApply: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} aria-hidden />
      <form
        role="dialog" aria-modal="true" aria-labelledby="promo-title"
        onSubmit={(e) => { e.preventDefault(); const c = code.trim().toUpperCase(); if (promoInfo(c)) onApply(c); else setErr(true); }}
        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-[24px] bg-[#FBFBFB] dark:bg-[#2C2C2C] px-[24px] pb-[max(24px,env(safe-area-inset-bottom))] pt-[24px] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[37px] sm:w-[393px] sm:-translate-x-1/2 sm:rounded-[24px] sm:pb-[24px]"
      >
        <button type="button" onClick={onClose} aria-label="Yopish" className="mx-auto block h-[3.5px] w-[34px] rounded-full bg-[#181818]" />
        <h2 id="promo-title" className="mt-[34px] flex h-[35px] items-center justify-center gap-[16px] text-[20px] font-medium text-[#181818] dark:text-[#FFFFFF]">
          <span className="grid size-[35px] place-items-center rounded-full bg-[#FF6A00] text-white"><DiscountOutlineIcon className="size-[23px]" /></span>
          Promokod
        </h2>
        <input
          autoFocus value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(false); }} placeholder="Yozish" aria-label="Promokod"
          aria-invalid={err} aria-describedby={err ? "promo-err" : undefined}
          className={`mt-[10px] h-[59px] w-full rounded-[16px] border bg-[#E8E8E8] dark:bg-[#393939] px-[21px] text-[20px] font-semibold uppercase text-[#181818] dark:text-[#FFFFFF] outline-none placeholder:normal-case placeholder:font-normal placeholder:text-[#181818] dark:placeholder:text-[#FFFFFF] focus:border-brand ${err ? "border-red-500" : "border-transparent"}`}
        />
        {err && <p id="promo-err" role="alert" className="mt-2 text-[14px] text-red-600">Promokod topilmadi</p>}
        <button type="submit" className="mt-[34px] h-[50px] w-full rounded-[16px] bg-[#FF6A00] text-[20px] font-medium text-white transition-colors hover:bg-brand">Apply</button>
        <button type="button" onClick={onClose} className="mt-[20px] h-[35px] w-full text-[20px] text-[#181818] dark:text-[#FFFFFF] hover:text-brand">Cancel</button>
      </form>
    </>
  );
}
