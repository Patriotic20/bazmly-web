"use client";

import { Fit } from "@bazmly/ui/Fit";
import { ChevronLeftIcon } from "@bazmly/ui/icons";

// Figma: "Sozlamalar" — menyudan 88px pastda 1084×782 karta (chegara 1.5px #D0D0D0), markazda sarlavha
export function SettingsCard({ title, onBack, children, action }: {
  title: string; onBack?: () => void; children: React.ReactNode;
  /** Karta ichida, pastda markazda (Figma: "Tasdiqlash" 345×55) */
  action?: React.ReactNode;
}) {
  return (
    <main className="px-4 pb-8 pt-6 md:px-6 md:pt-10 lg:pb-0 lg:pt-[min(24px,3svh)] hd:pt-[min(87.5px,8.102svh)]">
      <Fit gap={20} fill={1.35}>
      <section className="relative mx-auto flex w-full max-w-[1084px] flex-col rounded-[24px] border-[1.5px] border-[#D0D0D0] bg-white px-4 pb-8 sm:min-h-[782px] sm:px-8 sm:pb-[29.5px] sm:fit-tight:pb-[18px] sm:fit-tight:min-h-[var(--fit-min)] lg:px-0">
        <header className="relative flex h-[64px] items-start justify-center pt-[16px] sm:h-[92px] sm:pt-[50.5px] sm:fit-tight:h-[60px] sm:fit-tight:pt-[20px]">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Orqaga" className="absolute left-0 top-[12px] grid size-[40px] place-items-center rounded-full text-[#1F1F1F] hover:bg-[#F4F4F4] sm:left-[-4px] sm:top-[44.5px] sm:fit-tight:top-[14px] lg:left-[98px]">
              <ChevronLeftIcon className="h-[23px] w-[12px]" />
            </button>
          )}
          <h1 className="text-[20px] font-bold leading-[28px] text-black">{title}</h1>
        </header>
        {children}
        {action && <div className="mx-auto mt-8 w-full max-w-[345px] sm:mt-auto sm:pt-8 sm:fit-tight:pt-5">{action}</div>}
      </section>
      </Fit>
    </main>
  );
}

export const pillBtn = "h-[55px] w-full rounded-full bg-brand text-[24px] text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-[#F8D9C8]";
