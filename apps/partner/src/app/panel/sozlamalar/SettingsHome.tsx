"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readAccount, readAccounts, signOut, switchAccount, type PartnerAccount } from "@bazmly/api/partner";
import { BellIcon, ChevronRightIcon, LocationIcon, LoginIcon, SupportIcon, TranslateIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { SettingsCard } from "@/components/SettingsCard";
import { VenueAvatar } from "@/components/VenueAvatar";

export const placeText = (a?: PartnerAccount["address"]) => [a?.region, a?.city].filter(Boolean).join(", ") || "Manzil kiritilmagan";

const SunIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="5.2" fill="currentColor" stroke="none" />
    <path d="M12 1.8v.1M12 22.1v.1M1.8 12h.1M22.1 12h.1M4.8 4.8l.1.1M19.1 19.1l.1.1M4.8 19.2l.1-.1M19.1 4.9l.1-.1" strokeWidth="2.2" />
  </svg>
);

// Figma: "Sozlamalar" — muassasa rasmi, nomi, manzili, ikki tugma va 5 bandli menyu
export function SettingsHome() {
  const router = useRouter();
  const toast = useToast();
  const [acc, setAcc] = useState<PartnerAccount | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setAcc(readAccount()), []);

  const row = "flex h-[44px] w-full items-center rounded-[10px] bg-[#F2F2F2] pl-[11px] pr-[14px] text-left text-[16px] text-black transition-colors hover:bg-[#EAEAEA]";
  const icon = "grid w-[24px] shrink-0 place-items-center text-[#8D8D8D]";
  const links = [
    { label: "Xabarlar", href: "/panel/sozlamalar/xabarlar", icon: <BellIcon className="size-[22px]" /> },
    null,
    { label: "Tillar", href: "/panel/sozlamalar/til", icon: <TranslateIcon className="size-[20px]" /> },
    { label: "Yordam", href: "/panel/sozlamalar/yordam", icon: <SupportIcon className="size-[24px]" /> },
  ];

  return (
    <SettingsCard title="Sozlamalar">
      <div className="flex flex-col items-center pt-4 sm:pt-[13px] sm:fit-tight:pt-[4px]">
        <VenueAvatar className="size-[150px] fit-tight:size-[116px]" />
        <p className="mt-[9px] text-[18px] font-semibold leading-[22px] text-black">{acc?.name || "Muassasa"}</p>
        <p className="mt-[10px] flex items-center gap-[10px] text-[14px] leading-[19px] text-black">
          <LocationIcon className="size-[19px] shrink-0" />{placeText(acc?.address)}
        </p>
        <div className="mt-[17px] flex gap-[17px]">
          <Link href="/panel/sozlamalar/profil" className="grid h-[35px] w-[124px] place-items-center rounded-[8px] border border-brand text-[16px] text-brand transition-colors hover:bg-brand-50">Tahrirlash</Link>
        </div>

        <Accounts />

        <nav aria-label="Sozlamalar menyusi" className="mt-[16px] w-full max-w-[344px] rounded-[20px] border-[1.5px] border-[#F2F2F2] bg-white px-[15.5px] py-[11.5px]">
          <ul className="space-y-[20px] fit-tight:space-y-[10px]">
            {links.map((l) => l ? (
              <li key={l.label}>
                <Link href={l.href} className={row}>
                  <span className={icon}>{l.icon}</span>
                  <span className="ml-[19px] flex-1">{l.label}</span>
                  <ChevronRightIcon className="h-[17px] w-[9px]" />
                </Link>
              </li>
            ) : (
              <li key="mode">
                {/* Tungi rejim dizayni hali yo'q — yorug' rejim doim yoqilgan */}
                <button type="button" role="switch" aria-checked="true" onClick={() => toast("Tungi rejim tez orada qo‘shiladi")} className={row}>
                  <span className={icon}><SunIcon className="size-[22px]" /></span>
                  <span className="ml-[19px] flex-1">Mode</span>
                  <span className="relative h-[20px] w-[37px] rounded-full bg-[#3B95FF]" aria-hidden>
                    <span className="absolute right-[3px] top-[3px] size-[14px] rounded-full bg-white" />
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => setConfirm(true)} className={row}>
                <span className={icon}><LoginIcon className="size-[22px]" /></span>
                <span className="ml-[19px] flex-1">Akkauntdan chiqish</span>
                <ChevronRightIcon className="h-[17px] w-[9px]" />
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {confirm && <LogoutDialog onClose={() => setConfirm(false)} onConfirm={() => { signOut(); router.replace("/"); }} />}
    </SettingsCard>
  );
}

function LogoutDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="logout-t" className="w-full rounded-t-[20px] bg-white px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 text-center sm:max-w-[392px] sm:rounded-[20px] sm:pb-6">
        <h2 id="logout-t" className="text-[20px] font-semibold leading-[26px] text-black">Akkauntdan chiqmoqchimisiz?</h2>
        <p className="mt-2 text-[14px] text-[#646464]">Qayta kirish uchun telefon raqamingiz va SMS kod kerak bo‘ladi.</p>
        <button type="button" autoFocus onClick={onConfirm} className="mt-6 flex h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#F12828] text-[18px] font-semibold text-white transition-colors hover:bg-[#D91E1E]">
          <LoginIcon className="size-[22px]" />Chiqish
        </button>
        <button type="button" onClick={onClose} className="mt-3 h-[44px] w-full text-[18px] text-[#F12828] hover:underline">Bekor qilish</button>
      </div>
    </div>
  );
}

const KIND_LABEL = { restoran: "Restoran", toyxona: "To‘yxona", barchasi: "Restoran va to‘yxona" } as const;

/** Akkauntlar: restoran va to'yxona — alohida (har birining ma'lumoti alohida); bosilsa o'sha akkauntga o'tiladi */
function Accounts() {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<PartnerAccount[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [adding, setAdding] = useState(false);
  useEffect(() => { setList(readAccounts()); setActiveId(readAccount()?.id ?? "a1"); }, []);
  const has = (k: string) => list.some((a) => a.kind === k);

  return (
    <section id="akkauntlar" aria-label="Akkauntlar" className="mt-[23px] w-full max-w-[344px] scroll-mt-4 fit-tight:mt-[16px]">
      <ul className="flex flex-col gap-[8px]">
        {list.map((a) => {
          const on = a.id === activeId;
          return (
            <li key={a.id}>
              <button type="button" aria-current={on ? "true" : undefined} disabled={on}
                onClick={() => { if (!a.id || !switchAccount(a.id)) return; toast(`${a.name} akkauntiga o‘tildi`); router.push("/panel"); }}
                className={`flex w-full items-center gap-[12px] rounded-[14px] border px-[12px] py-[9px] text-left transition-colors ${on ? "border-brand bg-[#FFF6F0]" : "border-[#EEEEEE] bg-white hover:border-[#FFC9A3]"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.avatar || "/avatar.webp"} alt="" className="size-[38px] shrink-0 rounded-full object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold leading-[19px] text-black">{a.name}</span>
                  <span className="block text-[13px] leading-[17px] text-[#6B6B6B]">{KIND_LABEL[a.kind]} akkaunti</span>
                </span>
                {on ? <span className="rounded-full bg-brand px-[8px] py-[2px] text-[12px] text-white">Faol</span> : <span className="text-[13px] text-brand">O‘tish</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {adding ? (
        <div className="mt-[8px] rounded-[14px] border border-dashed border-[#FFC9A3] p-[10px]">
          <p className="text-[13px] text-[#6B6B6B]">Qaysi turdagi akkaunt qo‘shasiz?</p>
          <div className="mt-[8px] grid grid-cols-2 gap-[8px]">
            {(["restoran", "toyxona"] as const).map((k) => (
              <button key={k} type="button" onClick={() => router.push(`/royxatdan-otish?qoshish=${k}`)}
                className="h-[38px] rounded-[10px] border border-[#E5E5E5] text-[14px] text-black transition-colors hover:border-brand hover:text-brand">
                {KIND_LABEL[k]}{has(k) ? " (yana)" : ""}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAdding(false)} className="mt-[6px] w-full text-[13px] text-[#8D8D8D] hover:text-black">Bekor qilish</button>
        </div>
      ) : (
        <button type="button" onClick={() => {
          // Faqat bitta tur yetishmasa — to'g'ridan-to'g'ri o'sha turdagi akkauntni qo'shishga
          const missing = has("restoran") && !has("toyxona") ? "toyxona" : has("toyxona") && !has("restoran") ? "restoran" : null;
          if (missing) router.push(`/royxatdan-otish?qoshish=${missing}`); else setAdding(true);
        }} className="mt-[8px] flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-[#D9D9D9] text-[14px] text-[#555] transition-colors hover:border-brand hover:text-brand">
          + {has("restoran") && !has("toyxona") ? "To‘yxona akkauntini qo‘shish" : has("toyxona") && !has("restoran") ? "Restoran akkauntini qo‘shish" : "Akkaunt qo‘shish"}
        </button>
      )}
    </section>
  );
}
