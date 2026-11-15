"use client";

import { Fit } from "@bazmly/ui/Fit";
import { ChevronLeftIcon } from "@bazmly/ui/icons";

// Figma: hamkor paneli — markazdagi karta 820×748 (chegara 1.5px #D0D0D0), ostida 357×55 tugma
export function PartnerCard({ title, onBack, children, action, className = "", smallTitle = false, inPanel = false }: {
  title?: string; onBack?: () => void; children: React.ReactNode; action?: React.ReactNode; className?: string;
  /** Figma: "Akkaunt yaratish" sahifalarida sarlavha kichikroq (20px, #101828) */
  smallTitle?: boolean;
  /** Panel ichida (yuqorida menyu bor): karta menyudan 59px pastda, vertikal markazlanmaydi */
  inPanel?: boolean;
}) {
  return (
    <main className={`flex flex-col items-center px-4 pb-8 ${inPanel ? "pt-6 sm:pt-[59px] lg:pt-[min(59px,5.463svh)]" : "min-h-svh pt-6 sm:pt-[max(24px,calc((100svh-747.5px)/2))]"}`}>
      <Fit gap={32} className="flex w-full flex-col items-center">
      <section className={`relative w-full max-w-[819.5px] rounded-[24px] border-[1.5px] border-[#D0D0D0] bg-white px-4 pb-8 sm:min-h-[747.5px] sm:px-0 sm:pb-[40px] sm:fit-tight:min-h-0 ${className}`}>
        {(title || onBack) && (
          <header className="flex h-[76px] items-start justify-between pt-5 sm:absolute sm:inset-x-0 sm:top-0 sm:h-auto sm:pl-[44.5px] sm:pr-[50px] sm:pt-[45.5px] sm:fit-tight:static sm:fit-tight:h-[76px] sm:fit-tight:pt-[24px]">
            {onBack ? (
              <button type="button" onClick={onBack} aria-label="Orqaga" className="grid size-[40px] place-items-center rounded-full text-[#1F1F1F] hover:bg-[#F4F4F4]">
                <ChevronLeftIcon className="h-[26px] w-[13px]" />
              </button>
            ) : <span />}
            {title && (
              <h1 className={smallTitle ? "pt-[5px] text-[18px] font-bold leading-[28px] text-[#101828] sm:text-[20px]" : "pt-[6px] text-[22px] font-bold leading-[28px] text-black sm:text-[24px]"}>{title}</h1>
            )}
          </header>
        )}
        {children}
      </section>
      {action && <div className="mt-6 w-full max-w-[356.5px] sm:mt-[38.5px] sm:fit-tight:mt-6">{action}</div>}
      </Fit>
    </main>
  );
}

export const primaryBtn = "h-[55px] w-full rounded-[16px] bg-brand text-[22px] text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-[#F8D9C8] sm:text-[24px]";
export const fieldLabel = "block text-[16px] font-semibold leading-[16px] text-black";
export const fieldBox = "flex h-[55px] w-full items-center rounded-[16px] border border-[#D0D5DD] bg-white pl-[14.5px] pr-[23.5px] text-left text-black";
