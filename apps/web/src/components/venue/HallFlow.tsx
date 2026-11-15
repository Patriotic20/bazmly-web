"use client";

import Image from "next/image";
import { Fit } from "@bazmly/ui/Fit";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { USER_KEY } from "@bazmly/api/user";
import {
  AppleIcon, CakeIcon, CardIcon, CheckIcon, ChevronLeftIcon, CocktailIcon, CutleryFillIcon, DishIcon, DocIcon,
  GroupIcon, LockIcon, MoneyFillIcon, PencilIcon, ShieldIcon, VerifiedIcon,
} from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import {
  type Catering, CATERING_PER_GUEST, GUEST_TIERS, HALL_DEPOSIT_PCT, HALL_STEPS, hallDraftKey, hallQuote,
  readDraft, readHallDraft, saveHallDraft, SERVICE_FEE, draftKey,
} from "@bazmly/api/booking";
import { BOOKINGS_KEY, readCard, saveCard, type SavedCard } from "@bazmly/api/payment";
import { formatNum, type VenueDetails } from "@bazmly/api/venues";
import { CardForm, formatPhone, OtpStep, randomDigits } from "./BookingConfirm";
import { Stepper } from "./Stepper";

const base = (v: VenueDetails) => `/toyxonalar/${v.id}/bron`;
const MONTHS_FULL = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const longDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()}-${MONTHS_FULL[d.getMonth()]}, ${d.getFullYear()}`;
};

/* ------------------------------------------------------------------ */
/* Umumiy qolip: shkala + markazdagi oq karta (880px) + o'ng pastdagi panel */
/* ------------------------------------------------------------------ */
function Frame({ step, top, minH, onBack, children, panel, wide = true }: {
  step: number; top: number; minH?: number; onBack: () => void; children: React.ReactNode; panel: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="container-page pb-48 lg:w-[min(1273px,calc(100%-3rem))] lg:pb-0">
      <main className="pt-5 md:pt-8 xl:pt-[min(40px,3.704svh)]">
        <Fit gap={24}>
        <div className="lg:pt-[34px] lg:fit-tight:pt-[10px]">
          <Stepper steps={HALL_STEPS} current={step} nowrap checkAll />
        </div>
        <section
          className="relative mx-auto mt-8 w-full max-w-[880px] rounded-[24px] border border-[#D9D9D9] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] px-4 pb-6 pt-[72px] sm:px-6 lg:mt-[var(--top)] lg:min-h-[var(--minh)] lg:fit-tight:mt-8 lg:fit-tight:min-h-0 lg:px-0 lg:pb-0 lg:pt-0"
          style={{ "--top": `${top}px`, "--minh": minH ? `${minH}px` : "auto" } as React.CSSProperties}
        >
          <button type="button" onClick={onBack} aria-label="Orqaga" className="absolute left-[8px] top-[12px] grid size-[40px] place-items-center rounded-full text-[#1F1F1F] dark:text-[#FFFFFF] hover:bg-[#F4F4F4] dark:hover:bg-[#393939] lg:left-[18px] lg:top-[18.5px]">
            <ChevronLeftIcon className="h-[23px] w-[12px]" />
          </button>
          <span className="absolute right-[16px] top-[22px] text-[16px] leading-[20px] text-black dark:text-[#FFFFFF] lg:right-[23px] lg:top-[27.5px]">Band qilish</span>
          <div className={`mx-auto w-full ${wide ? "max-w-[342.5px]" : "max-w-[326px]"}`}>{children}</div>
        </section>
        </Fit>
      </main>
      {panel}
    </div>
  );
}

function Panel({ children, bottom = 20 }: { children: React.ReactNode; bottom?: number }) {
  return (
    <div style={{ "--pb": `${bottom}px` } as React.CSSProperties} className="fixed inset-x-0 bottom-0 z-30 bg-white/95 dark:bg-[#2C2C2C]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:inset-x-auto lg:bottom-[var(--pb)] lg:right-[30.5px] lg:w-[344.5px] lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
      {children}
    </div>
  );
}

const bigBtn = "h-[56px] w-full rounded-[20px] bg-brand text-[20px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-[#FADCCC] dark:disabled:bg-[#5C3E2E] dark:disabled:text-white/30";

function PricePanel({ perGuest, total, guests, label = "Keyingisi", onNext }: { perGuest: number; total: number; guests: number; label?: string; onNext: () => void }) {
  return (
    <Panel>
      <div className="flex items-start justify-between text-[12px] leading-[14px] text-[#6B7280] dark:text-[#CFCFCF]">
        <span>Har bir mehmon uchun</span><span>Umumiy xizmat</span>
      </div>
      <div className="mt-[10px] flex items-start justify-between gap-3 lg:mt-[7px]">
        <span className="text-[22px] font-bold leading-[32px] text-[#FF6A00] lg:text-[24px]">{formatNum(perGuest)} UZS</span>
        <span className="text-right text-[14px] font-semibold leading-[19px] text-[#0F172A] dark:text-[#FFFFFF]">{formatNum(total)} UZS<br />({guests} kishi)</span>
      </div>
      <button type="button" onClick={onNext} className={`mt-3 lg:mt-[15px] ${bigBtn}`}>{label}</button>
    </Panel>
  );
}

function Radio({ on }: { on: boolean }) {
  return on ? (
    <span className="grid size-[24px] shrink-0 place-items-center rounded-full bg-brand text-white"><CheckIcon className="h-[9px] w-[12px]" /></span>
  ) : (
    <span className="size-[24px] shrink-0 rounded-full border-[1.5px] border-[#CBD5E1] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C]" />
  );
}

/** Oldingi bosqich to'ldirilmagan bo'lsa, o'sha yerga qaytaradi */
function useGuard(v: VenueDetails, need: "date" | "tier" | "catering") {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const d = readDraft(v.id);
    const h = readHallDraft(v.id);
    if (!d.date || !d.time) return router.replace(base(v));
    if ((need === "tier" || need === "catering") && !h.tier) return router.replace(`${base(v)}/mehmonlar`);
    if (need === "catering" && !h.catering) return router.replace(`${base(v)}/dasturxon`);
    setOk(true);
  }, [v, need, router]);
  return ok;
}

/* ------------------------------------------------------------------ */
/* 3-bosqich (a): mehmonlar soni                                       */
/* ------------------------------------------------------------------ */
export function HallTierStep({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const ready = useGuard(v, "date");
  const [tier, setTier] = useState(GUEST_TIERS[0].id);
  useEffect(() => { const t = readHallDraft(v.id).tier; if (t && GUEST_TIERS.some((x) => x.id === t)) setTier(t); }, [v.id]);
  if (!ready) return null;

  const pick = (id: string) => { setTier(id); saveHallDraft(v.id, { tier: id }); };
  const next = () => { saveHallDraft(v.id, { tier }); router.push(`${base(v)}/dasturxon`); };

  return (
    <Frame step={3} top={94} wide={false} onBack={() => router.push(base(v))} panel={<Panel><button type="button" onClick={next} className={`${bigBtn} lg:ml-auto lg:block lg:w-[255.5px]`}>Keyingisi</button></Panel>}>
      <div className="lg:pt-[95px] lg:fit-tight:pt-[28px] lg:pb-[20px]">
        <h1 className="text-[20px] font-semibold leading-[25px] text-[#0F172A] dark:text-[#FFFFFF]">Tadbiringiz uchun mehmonlar sonini tanlang</h1>
        <p className="mt-[9px] text-[14px] leading-[18px] text-[#64748B] dark:text-[#CFCFCF]">Tanlangan mehmonlar soni asosida taklif etiladigan zallar va xizmatlar narxi o‘zgarishi mumkin.</p>
        <div role="radiogroup" aria-label="Mehmonlar soni" className="mt-[19px] space-y-[16px]">
          {GUEST_TIERS.map((t) => {
            const on = tier === t.id;
            return (
              <button
                key={t.id} type="button" role="radio" aria-checked={on} onClick={() => pick(t.id)}
                className={`flex h-[74px] w-full items-center justify-between rounded-[16px] border pl-[20px] pr-[20px] text-left transition-colors ${on ? "border-brand bg-[#FFFAF7] dark:bg-[#483126]" : "border-[#E2E8F0] dark:border-[#474747] bg-white dark:bg-[#2C2C2C] hover:border-brand/50"}`}
              >
                <span>
                  <span className="block text-[18px] font-semibold leading-[22px] text-[#0F172A] dark:text-[#FFFFFF]">{t.label}</span>
                  <span className={`mt-[6px] block text-[14px] leading-[18px] ${on ? "text-black dark:text-[#FFFFFF]" : "text-[#64748B] dark:text-[#CFCFCF]"}`}>Asosiy narx: {formatNum(t.price)} so‘m</span>
                </span>
                <Radio on={on} />
              </button>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 3-bosqich (b): dasturxon                                            */
/* ------------------------------------------------------------------ */
const MENU_PARTS = [
  { icon: <CutleryFillIcon className="size-[22px]" />, title: "Salatlar", items: "Bahor, Grekcha, Olivye (3 xil)" },
  { icon: <AppleIcon className="size-[22px]" />, title: "Mevalar", items: "Mavsumiy mevalar va quruq mevalar" },
  { icon: <DishIcon className="size-[22px]" />, title: "Asosiy Taomlar", items: "Osh, Somsa, Qozon-kabob" },
  { icon: <CocktailIcon className="size-[22px]" />, title: "Ichimliklar", items: "Sharbatlar, Choy, Gazlangan suvlar" },
  { icon: <CakeIcon className="size-[22px]" />, title: "Shirinliklar", items: "Pishiriqlar, Tort, Milliy shirinliklar" },
];
const CATERING_OPTIONS: { id: Catering; title: string; sub: string }[] = [
  { id: "self", title: "O‘zimiz tayyorlaymiz", sub: "Hech qanday qo‘shimcha to‘lovsiz" },
  { id: "ready", title: "Tayyor dasturxon", sub: "To‘liq servis va tayyor taomlar to‘plami" },
];

export function HallCateringStep({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const ready = useGuard(v, "tier");
  const [catering, setCatering] = useState<Catering>("self");
  const [tier, setTier] = useState<string | undefined>();
  useEffect(() => { const h = readHallDraft(v.id); setTier(h.tier); if (h.catering) setCatering(h.catering); }, [v.id]);
  const q = hallQuote(tier, catering);
  if (!ready) return null;

  const pick = (c: Catering) => { setCatering(c); saveHallDraft(v.id, { catering: c }); };
  const next = () => { saveHallDraft(v.id, { catering }); router.push(`${base(v)}/tasdiqlash`); };

  return (
    <Frame step={3} top={105.5} minH={915} onBack={() => router.push(`${base(v)}/mehmonlar`)} panel={<PricePanel perGuest={q.perGuest} total={q.total} guests={q.tier.guests} onNext={next} />}>
      <div className="lg:pt-[94px] lg:fit-tight:pt-[28px]">
        <h1 className="text-[20px] font-semibold leading-[25px] text-[#0F172A] dark:text-[#FFFFFF]">Dasturxon mahsulotlarini<br className="hidden lg:block" /> tanlang</h1>
        <p className="mt-[8px] text-[14px] leading-[18px] text-[#64748B] dark:text-[#CFCFCF]">Dasturxonni to‘liq to‘yxona tayyorlab berishi evaziga to‘yxona to‘loviga yana to‘lov qo‘shiladi!</p>
        <div role="radiogroup" aria-label="Dasturxon" className="mt-[20px] space-y-[12px]">
          {CATERING_OPTIONS.map((o) => {
            const on = catering === o.id;
            return (
              <button
                key={o.id} type="button" role="radio" aria-checked={on} onClick={() => pick(o.id)}
                className={`flex h-[80px] w-full items-center justify-between rounded-[20px] border-[1.5px] px-[16px] text-left transition-colors ${on ? "border-brand bg-[#FFFAF7] dark:bg-[#483126]" : "border-[#E2E8F0] dark:border-[#474747] bg-white dark:bg-[#2C2C2C] hover:border-brand/50"}`}
              >
                <span>
                  <span className="block text-[16px] font-bold leading-[20px] text-[#0F172A] dark:text-[#FFFFFF]">{o.title}</span>
                  <span className={`block text-[14px] leading-[18px] text-[#475569] dark:text-[#CFCFCF] ${on ? "mt-[9px]" : "mt-[1px]"}`}>{o.sub}</span>
                </span>
                <Radio on={on} />
              </button>
            );
          })}
        </div>

        <div className="mt-[22px] flex items-center justify-between">
          <h2 className="text-[18px] font-bold leading-[22px] text-[#0F172A] dark:text-[#FFFFFF]">Menyu tarkibi</h2>
          <span className="rounded-full bg-[#FFFAF7] dark:bg-[#483126] px-[8px] py-[2px] text-[12px] leading-[20px] text-[#FF6A00]">Premium to‘plam</span>
        </div>
        <ul className="mt-[27px] space-y-[10px]" aria-label="Tayyor dasturxon tarkibi">
          {MENU_PARTS.map((m) => (
            <li key={m.title} className="flex h-[75px] items-center gap-[17px] rounded-[16px] border border-[#F1F5F9] dark:border-[#474747] bg-white dark:bg-[#2C2C2C] px-[12px]">
              <span className="grid size-[47px] shrink-0 place-items-center rounded-[12px] bg-[#FFF8F3] dark:bg-[#483126] text-brand">{m.icon}</span>
              <span className="min-w-0">
                <span className="block text-[16px] leading-[20px] text-black dark:text-[#FFFFFF]">{m.title}</span>
                <span className="block truncate text-[12px] leading-[16px] text-black dark:text-[#FFFFFF]">{m.items}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Tanlangan to'yxona kartasi (4-bosqich va yakuniy sahifa)            */
/* ------------------------------------------------------------------ */
function VenueSummary({ v, guests, catering, onModify }: { v: VenueDetails; guests: number; catering: Catering; onModify?: () => void }) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-[#F1F5F9] dark:border-[#474747] bg-white dark:bg-[#2C2C2C]">
      <div className="relative aspect-[342.5/191] w-full">
        <Image src="/venue/hall-card.webp" alt={v.name} fill sizes="343px" className="object-cover" />
      </div>
      <div className={`px-[14px] ${onModify ? "pb-[17.5px] pt-[19.5px]" : "pb-[13px] pt-[16px]"}`}>
        <p className="flex items-center gap-[8px] text-[12px] font-semibold leading-[16px] text-brand">
          <VerifiedIcon className="size-[14px]" />Tanlangan to‘yxona
        </p>
        <h3 className="mt-[5.5px] text-[24px] font-bold leading-[30px] text-black dark:text-[#FFFFFF]">{v.name}</h3>
        <p className="mt-[6px] flex h-[32px] items-center gap-[14px] text-[16px] text-black dark:text-[#FFFFFF]">
          <span className="grid size-[32px] place-items-center rounded-full bg-[#FFF8F3] dark:bg-[#483126] text-brand"><GroupIcon className="size-[18px]" /></span>
          {guests} nafar mehmon
        </p>
        <p className="mt-[14px] flex h-[32px] items-center gap-[14px] text-[16px] text-black dark:text-[#FFFFFF]">
          <span className="grid size-[32px] place-items-center rounded-full bg-[#FFF8F3] dark:bg-[#483126] text-brand"><CutleryFillIcon className="size-[18px]" /></span>
          {catering === "ready" ? "Tayyor dasturxon (Premium)" : "Dasturxonni o‘zimiz tayyorlaymiz"}
        </p>
        {onModify && (
          <div className="mt-[5px] flex justify-end">
            <button type="button" onClick={onModify} className="flex h-[32.5px] items-center gap-[12px] rounded-full bg-[#F1F5F9] dark:bg-[#393939] px-[16px] text-[14px] text-[#334155] dark:text-[#CFCFCF] transition-colors hover:bg-[#E2E8F0] dark:hover:bg-[#4A4A4A]">
              <PencilIcon className="size-[16px]" />Tanlovni o‘zgartirish
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* 4-bosqich: hisobot → xavfsiz to'lov → karta → SMS                   */
/* ------------------------------------------------------------------ */
export function HallConfirm({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const ready = useGuard(v, "catering");
  const step = params.get("qadam") ?? "hisob";
  const go = (s?: string) => router.push(s ? `${base(v)}/tasdiqlash?qadam=${s}` : `${base(v)}/tasdiqlash`, { scroll: false });

  const [h, setH] = useState(readHallDraftSafe(v.id));
  const [card, setCard] = useState<SavedCard | null>(null);
  const [pending, setPending] = useState<SavedCard | null>(null);
  const [user, setUser] = useState<{ name?: string; phone?: string }>({});
  useEffect(() => {
    setH(readHallDraft(v.id));
    setCard(readCard());
    try { setUser(JSON.parse(localStorage.getItem(USER_KEY) ?? "{}")); } catch {}
  }, [v.id]);

  const q = useMemo(() => hallQuote(h.tier, h.catering ?? "self"), [h]);
  if (!ready) return null;

  const pay = (c: SavedCard) => {
    const d = readDraft(v.id);
    const booking = {
      id: `B${Date.now().toString().slice(-6)}`,
      venueId: v.id, venueName: v.name, type: v.type,
      date: d.date, time: d.time, people: q.tier.guests, guestTier: q.tier.label, catering: q.catering,
      name: user.name ?? "", phone: user.phone ?? "",
      method: "karta" as const, card: c.last4, total: q.total, amount: q.deposit, createdAt: new Date().toISOString(),
      receipt: randomDigits(10), code: randomDigits(16),
    };
    try {
      const list = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? "[]");
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking, ...list]));
      sessionStorage.removeItem(draftKey(v.id));
      sessionStorage.removeItem(hallDraftKey(v.id));
    } catch {}
    // TODO: backend — POST /bookings + depozitni yechish
    router.push(`${base(v)}/tasdiqlandi?id=${booking.id}`);
  };

  const cancel = () => {
    try { sessionStorage.removeItem(draftKey(v.id)); sessionStorage.removeItem(hallDraftKey(v.id)); } catch {}
    toast("Band qilish bekor qilindi");
    router.push(`/toyxonalar/${v.id}`);
  };

  if (step === "karta" || step === "kod") {
    return (
      <div className="container-page flex justify-center pb-16 pt-8 lg:pt-[74px] lg:fit-tight:pt-[22px]">
        {step === "karta"
          ? <CardForm holder={user.name ?? ""} onDone={(c) => { setPending(c); go("kod"); }} />
          : (
            <OtpStep
              phone={`+998 ${formatPhone((user.phone ?? "").replace(/^\+998/, ""))}`}
              onClose={() => go("tolov")}
              onDone={() => { if (!pending) return go("karta"); saveCard(pending); setCard(pending); toast("Karta qo‘shildi"); pay(pending); }}
            />
          )}
      </div>
    );
  }

  if (step === "tolov") {
    return (
      <Frame
        step={4} top={105.5} minH={909} onBack={() => go()}
        panel={
          <Panel bottom={14}>
            <button type="button" onClick={() => (card ? pay(card) : go("karta"))} className={bigBtn}>Depozitni to‘lash</button>
            <button type="button" onClick={cancel} className="mt-[10px] block h-[30px] w-full text-[16px] leading-[30px] text-black dark:text-[#FFFFFF] hover:text-brand">Bekor qilish</button>
          </Panel>
        }
      >
        <div className="text-center lg:pt-[127.5px] lg:fit-tight:pt-[38px]">
          <span className="mx-auto grid size-[64px] place-items-center rounded-full bg-[#FFF8F3] dark:bg-[#483126] text-[#FF6A00]"><LockIcon className="size-[36px]" /></span>
          <h1 className="mt-[13px] text-[24px] font-bold leading-[32px] text-[#0F172A] dark:text-[#FFFFFF]">Xavfsiz to‘lov</h1>
          <p className="mx-auto mt-[21px] max-w-[330px] text-[16px] leading-[19.5px] text-[#475569] dark:text-[#CFCFCF]">To‘yxonani band qilish uchun depozit to‘lovi talab qilinadi.</p>
        </div>
        <div className="mt-[20px] rounded-[24px] border border-brand bg-[#FFFAF7] dark:bg-[#483126] px-[24.5px] pb-[36px] pt-[20px]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] leading-[24px] text-[#475569] dark:text-[#CFCFCF]">Depozit miqdori</span>
            <span className="rounded-full bg-brand px-[9px] text-[12px] font-bold leading-[24px] text-white">{HALL_DEPOSIT_PCT}%</span>
          </div>
          <p className="mt-[6px] text-[30px] font-bold leading-[38px] text-[#0F172A] dark:text-[#FFFFFF] sm:text-[34px]">{formatNum(q.deposit)} so‘m</p>
          <p className="text-[12px] leading-[16px] text-[#64748B] dark:text-[#CFCFCF]">Umumiy summadan chegirib tashlanadi</p>
        </div>
        <h2 className="mt-[24px] text-[18px] font-bold leading-[22px] text-[#0F172A] dark:text-[#FFFFFF]">To‘lov usuli</h2>
        <div role="radiogroup" aria-label="To‘lov usuli" className="mt-[12px]">
          <button type="button" role="radio" aria-checked onClick={() => go("karta")} className="flex h-[76px] w-full items-center gap-[16px] rounded-[20px] border border-brand bg-[#FFFAF7] dark:bg-[#483126] px-[16px] text-left">
            <span className="grid size-[40px] place-items-center rounded-[12px] bg-white dark:bg-[#2C2C2C] text-brand"><CardIcon className="h-[18px] w-[22px]" /></span>
            <span className="flex-1">
              <span className="block text-[14px] font-bold leading-[18px] text-[#0F172A] dark:text-[#FFFFFF]">Bank kartasi</span>
              <span className="mt-[4px] block text-[12px] leading-[16px] text-[#64748B] dark:text-[#CFCFCF]">{card ? `**** **** **** ${card.last4}` : "Visa, Mastercard, Uzcard"}</span>
            </span>
            <Radio on />
          </button>
        </div>
        <p className="mt-[34px] flex items-center justify-center gap-[8px] text-[12px] leading-[16px] text-[#94A3B8] dark:text-[#8A8A8A]">
          <ShieldIcon className="size-[14px]" />Barcha to‘lovlar xavfsiz himoyalangan
        </p>
      </Frame>
    );
  }

  // hisob — batafsil narx hisoboti
  const rows: [string, string, number][] = [
    ["Zal ijarasi", "Kun bo‘yi zal va xodimlar", q.tier.price],
    q.catering === "ready"
      ? ["Tayyor dasturxon", `${formatNum(CATERING_PER_GUEST)} × ${q.tier.guests} kishi`, q.cateringTotal]
      : ["Dasturxon", "O‘zingiz tayyorlaysiz", 0],
    ["Xizmat va logistika", "Muvofiqlashtirish, tozalash", SERVICE_FEE],
  ];
  return (
    <Frame step={4} top={105.5} minH={915} onBack={() => router.push(`${base(v)}/dasturxon`)} panel={<PricePanel perGuest={q.perGuest} total={q.total} guests={q.tier.guests} onNext={() => go("tolov")} />}>
      <div className="lg:pt-[95.5px] lg:fit-tight:pt-[29px] lg:pb-[13.5px]">
        <VenueSummary v={v} guests={q.tier.guests} catering={q.catering} onModify={() => router.push(`${base(v)}/mehmonlar`)} />
        <h2 className="mt-[20px] flex items-center gap-[10px] text-[20px] font-semibold leading-[26px] text-[#0F172A] dark:text-[#FFFFFF]">
          <MoneyFillIcon className="size-[24px] text-brand" />Batafsil narx hisoboti
        </h2>
        <div className="mt-[15px] rounded-[24px] border border-[#F1F5F9] dark:border-[#474747] bg-white dark:bg-[#2C2C2C] px-[24.5px] pb-[30px] pt-[23px]">
          {rows.map(([t, sub, val], i) => (
            <div key={t} className={`flex items-center justify-between gap-3 ${i ? "mt-[16px] border-t border-[#F1F5F9] dark:border-[#474747] pt-[16px]" : ""}`}>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[18px] leading-[22px] text-[#0F172A] dark:text-[#FFFFFF]">{t}</span>
                <span className="mt-[2px] block truncate text-[13px] leading-[16px] text-[#64748B] dark:text-[#CFCFCF]">{sub}</span>
              </span>
              <span className="shrink-0 text-[18px] leading-[22px] text-[#0F172A] dark:text-[#FFFFFF]">{formatNum(val)}</span>
            </div>
          ))}
          <div className="mt-[15px] border-t-2 border-[#F1F5F9] dark:border-[#474747] pt-[16px]">
            <p className="text-[14px] font-bold leading-[18px] text-[#FF6A00]">Jami to‘lov summasi</p>
            <div className="mt-[8px] flex items-end justify-between gap-3">
              <span className="max-w-[110px] text-[11px] leading-[13px] text-[#94A3B8] dark:text-[#8A8A8A]">Barcha soliq va yig‘imlar kiritilgan</span>
              <span className="whitespace-nowrap text-[22px] font-bold leading-[28px] text-[#0F172A] dark:text-[#FFFFFF]">{formatNum(q.total)} so‘m</span>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function readHallDraftSafe(id: string) {
  if (typeof window === "undefined") return {};
  return readHallDraft(id);
}

/* ------------------------------------------------------------------ */
/* Yakuniy sahifa: buyurtma tafsilotlari                               */
/* ------------------------------------------------------------------ */
type HallBooking = {
  id: string; venueId: string; date?: string; time?: string; people?: number; guestTier?: string;
  catering?: Catering; amount?: number;
};

export function HallSuccess({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [b, setB] = useState<HallBooking | null | undefined>(undefined);
  useEffect(() => {
    try {
      const list: HallBooking[] = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? "[]");
      setB(list.find((x) => x.id === id && x.venueId === v.id) ?? null);
    } catch { setB(null); }
  }, [id, v.id]);

  if (b === undefined) return null;
  const home = (
    <Panel>
      <Link href="/" className={`${bigBtn} flex items-center justify-center lg:ml-auto lg:w-[255.5px]`}>Bosh sahifaga qaytish</Link>
    </Panel>
  );
  if (!b) {
    return (
      <Frame step={4} top={105.5} onBack={() => router.push(`/toyxonalar/${v.id}`)} panel={home}>
        <p className="py-24 text-center text-[16px] text-[#646464] dark:text-[#CFCFCF]">Buyurtma topilmadi</p>
      </Frame>
    );
  }

  const rows: [string, string][] = [
    ["To‘yxona nomi", v.name],
    ["Sana", `${longDate(b.date)}${b.time ? ` · ${b.time}` : ""}`],
    ["Mehmonlar soni", b.guestTier ?? `${b.people} kishi`],
    ["Xizmat turi", b.catering === "ready" ? "Premium paket" : "O‘zimiz tayyorlaymiz"],
  ];
  return (
    <Frame step={4} top={105.5} minH={915} onBack={() => router.push(`/toyxonalar/${v.id}`)} panel={home}>
      <div className="lg:pt-[111.5px] lg:fit-tight:pt-[33px]">
        <VenueSummary v={v} guests={b.people ?? 0} catering={b.catering ?? "self"} />
        <div className="mt-[14px] rounded-[24px] border border-[#FFF7ED] dark:border-[#7A4528] bg-white dark:bg-[#2C2C2C] px-[24.5px] pb-[38px] pt-[21px]">
          <h2 className="flex items-center gap-[12px] text-[20px] font-bold leading-[26px] text-[#0F172A] dark:text-[#FFFFFF]">
            <DocIcon className="size-[22px] text-[#FF6A00]" />Buyurtma tafsilotlari
          </h2>
          <dl className="mt-[11px]">
            {rows.map(([k, val]) => (
              <div key={k} className="flex h-[49px] items-center justify-between gap-3 border-b border-[#F1F5F9] dark:border-[#474747] text-[14px]">
                <dt className="shrink-0 text-[#64748B] dark:text-[#CFCFCF]">{k}</dt>
                <dd className="truncate text-right font-bold text-[#0F172A] dark:text-[#FFFFFF]">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-[35.5px] flex items-center justify-between gap-3">
            <span className="text-[14px] font-bold text-[#FF6A00]">To‘langan depozit</span>
            <span className="text-[18px] text-[#FF6A00]">{formatNum(b.amount ?? 0)} UZS</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}
