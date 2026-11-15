"use client";

import { useEffect } from "react";
import { Fit } from "@bazmly/ui/Fit";
import { ChevronLeftIcon } from "@bazmly/ui/icons";

// Figma: profil bo'limidagi umumiy ramka — 1273×872, 2px kulrang chegara, yuqorida "orqaga" va sarlavha
export function ProfileFrame({ title, onBack, children, footer, scroll = false }: {
  title?: string; onBack?: () => void; children: React.ReactNode; footer?: React.ReactNode; scroll?: boolean;
}) {
  const head = (title || onBack) && (
    <div className="flex h-[72px] shrink-0 items-start justify-between px-3 pt-4 sm:px-[22.5px] sm:pt-[24px] xl:h-[87px]">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Orqaga" className="grid size-[40px] place-items-center rounded-full text-[#1F1F1F] dark:text-[#FFFFFF] hover:bg-[#F4F4F4] dark:hover:bg-[#393939]">
          <ChevronLeftIcon className="h-[23px] w-[12px]" />
        </button>
      ) : <span />}
      {title && <h1 className="pr-2 pt-[7px] text-[20px] font-bold leading-[24px] text-black dark:text-[#FFFFFF] sm:pr-[6px]">{title}</h1>}
    </div>
  );
  const frame = "relative flex min-h-[calc(100svh-180px)] flex-col rounded-[24px] border-[1.5px] border-[#D0D0D0] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] lg:min-h-0";

  // Ro'yxatli ramka (masalan, Xabarlar): ekranning qolgan balandligini egallaydi, ro'yxat ichida aylanadi
  if (scroll) return (
    <div className="container-page pb-28 pt-5 md:pt-8 lg:flex lg:h-full lg:flex-col lg:pb-[24px] xl:pt-[min(40px,3.704svh)]">
      <section className={`${frame} lg:min-h-0 lg:flex-1 lg:overflow-hidden xl:max-h-[871.5px]`}>
        {head}
        <div className="min-h-0 flex-1 lg:overflow-y-auto">{children}</div>
        {footer}
      </section>
    </div>
  );

  return (
    <div className="container-page pb-28 pt-5 md:pt-8 lg:pb-0 xl:pt-[min(40px,3.704svh)]">
      <Fit gap={24}>
        {/* Sig'masa: ramka kontent balandligiga qisqaradi, o'ng pastdagi tugma uchun joy qoladi */}
        <section className={`${frame} xl:h-[871.5px] xl:fit-tight:h-auto xl:fit-tight:min-h-0 ${footer ? "xl:fit-tight:pb-[100px]" : ""}`}>
          {head}
          <div className="min-h-0 flex-1">{children}</div>
          {footer}
        </section>
      </Fit>
    </div>
  );
}

/** O'ng pastdagi asosiy tugma (356×55) */
export function FrameButton({ children, onClick, disabled, type = "button", form }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; form?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 dark:bg-[#2C2C2C]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur xl:absolute xl:inset-x-auto xl:bottom-[28px] xl:right-[28.5px] xl:bg-transparent xl:p-0 xl:shadow-none xl:backdrop-blur-none">
      <button
        type={type} form={form} onClick={onClick} disabled={disabled}
        className="h-[55px] w-full rounded-[16px] bg-brand text-[22px] text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-[#F8D9C8] dark:disabled:bg-[#5C3E2E] dark:disabled:text-white/30 xl:w-[356.5px] xl:text-[24px]"
      >
        {children}
      </button>
    </div>
  );
}

/** Figma: pastdan chiquvchi tasdiqlash oynasi (392×225), qizil tugma + "Bekor qilish" */
export function ConfirmSheet({ title, action, icon, onConfirm, onClose }: {
  title: string; action: string; icon: React.ReactNode; onConfirm: () => void; onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-[#FBFBFB] dark:bg-[#2C2C2C] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-[10px] sm:inset-x-auto sm:bottom-[104.5px] sm:left-1/2 sm:w-[392.5px] sm:-translate-x-1/2 sm:rounded-[20px] sm:px-[24px] sm:pb-[22px]"
      >
        <span className="mx-auto block h-[4px] w-[33.5px] rounded-full bg-[#181818]" />
        <h2 id="sheet-title" className="mt-[23px] text-center text-[20px] font-medium leading-[24px] text-black dark:text-[#FFFFFF]">{title}</h2>
        <button type="button" autoFocus onClick={onConfirm} className="mt-[24px] flex h-[56.5px] w-full items-center justify-center gap-[16px] rounded-full bg-[#F12828] text-[20px] font-semibold text-white transition-colors hover:bg-[#D91E1E]">
          {icon}{action}
        </button>
        <button type="button" onClick={onClose} className="mt-[18px] block h-[40px] w-full text-[20px] leading-[40px] text-[#F12828] hover:underline">Bekor qilish</button>
      </div>
    </div>
  );
}
