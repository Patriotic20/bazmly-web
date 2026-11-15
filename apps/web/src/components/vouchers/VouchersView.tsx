"use client";

import { useEffect, useState } from "react";
import { BazmlyLogo } from "@bazmly/ui/BazmlyLogo";
import { ChevronRightIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { readVouchers, voucherActive, type Voucher } from "@bazmly/api/vouchers";

const pad = (n: number) => String(n).padStart(2, "0");
/** 24 soatdan kam qolgan bo'lsa — teskari sanoq (05:35:49), aks holda tugash sanasi */
function expiry(v: Voucher, now: number) {
  if (v.used) return { text: "Ishlatilgan", live: false };
  const left = v.expiresAt - now;
  if (left <= 0) return { text: "Muddati tugagan", live: false };
  if (left < 24 * 3600_000) {
    const s = Math.floor(left / 1000);
    return { text: `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`, live: true };
  }
  const d = new Date(v.expiresAt);
  return { text: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, live: false };
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try {
    const t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok;
  } catch { return false; }
}

// Figma: Voucherlar — promokodlar ro'yxati; bosilganda kod va "Nusxa olish"
export function VouchersView() {
  const toast = useToast();
  const [list, setList] = useState<Voucher[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState<Voucher | null>(null);

  useEffect(() => {
    setList(readVouchers());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container-page pb-16 pt-5 md:pt-8 xl:pt-[40px]">
      <h1 className="sr-only">Voucherlar</h1>
      {list && !list.length && <p className="py-20 text-center text-[16px] text-[#646464] dark:text-[#CFCFCF]">Hozircha voucherlar yo‘q</p>}
      <ul className="space-y-[10px]">
        {list?.map((v) => {
          const e = expiry(v, now);
          const active = voucherActive(v, now);
          return (
            <li key={v.code}>
              <button
                type="button" onClick={() => setOpen(v)}
                className={`flex h-[76px] w-full items-center rounded-[16px] bg-[#F2F2F2] dark:bg-[#393939] pl-[8px] pr-4 text-left transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#393939] sm:pr-[23px] ${active ? "" : "opacity-70"}`}
              >
                <span className="grid size-[60px] shrink-0 place-items-center rounded-[12px] bg-[#FF6A00] text-white"><BazmlyLogo className="w-[46px]" /></span>
                <span className="ml-4 min-w-0 flex-1 text-[14px] leading-[17.5px] tracking-[0.2px] text-black dark:text-[#FFFFFF] sm:ml-[40px] sm:text-[16px]">
                  <span className="line-clamp-2 max-w-[235px]">{v.title}</span>
                </span>
                <span className={`ml-3 shrink-0 text-[14px] tabular-nums sm:text-[16px] ${e.live ? "text-[#FF6A00]" : "text-[#8D8D8D] dark:text-[#B0B0B0]"}`} aria-label={e.live ? `Qoldi ${e.text}` : undefined}>{e.text}</span>
                <ChevronRightIcon className="ml-[12px] h-[18px] w-[9px] shrink-0 text-black dark:text-[#FFFFFF] sm:ml-[26px]" />
              </button>
            </li>
          );
        })}
      </ul>

      {open && (
        <VoucherSheet
          v={open} active={voucherActive(open, now)}
          onClose={() => setOpen(null)}
          onCopy={async () => {
            const ok = await copy(open.code);
            toast(ok ? `Promokod nusxalandi: ${open.code}` : "Nusxa olib bo‘lmadi");
            if (ok) setOpen(null);
          }}
        />
      )}
    </div>
  );
}

function VoucherSheet({ v, active, onClose, onCopy }: { v: Voucher; active: boolean; onClose: () => void; onCopy: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="voucher-title" onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-[#FBFBFB] dark:bg-[#2C2C2C] px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-[10px] sm:inset-x-auto sm:bottom-[104.5px] sm:left-1/2 sm:w-[392.5px] sm:-translate-x-1/2 sm:rounded-[20px] sm:px-[24px] sm:pb-[7px]"
      >
        <span className="mx-auto block h-[4px] w-[33.5px] rounded-full bg-[#181818]" />
        <h2 id="voucher-title" className="mt-[21px] text-[20px] font-medium leading-[24px] text-black dark:text-[#FFFFFF]">Promokod <span className="select-all">{v.code}</span></h2>
        <p className="mt-[14px] max-w-[310px] text-[18px] leading-[24.5px] text-black dark:text-[#FFFFFF]">{v.title}</p>
        {!active && <p className="mt-2 text-[14px] text-[#D00000]">{v.used ? "Bu promokod ishlatilgan" : "Promokod muddati tugagan"}</p>}
        <button type="button" autoFocus disabled={!active} onClick={onCopy} className="mt-[13px] h-[56px] w-full rounded-full bg-brand text-[18px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-[#F8D9C8] dark:disabled:bg-[#5C3E2E] dark:disabled:text-white/30">
          Nusxa olish
        </button>
        <button type="button" onClick={onClose} className="mt-[16px] block h-[40px] w-full text-[20px] leading-[40px] text-black dark:text-[#FFFFFF] hover:text-brand">Ortga</button>
      </div>
    </div>
  );
}
