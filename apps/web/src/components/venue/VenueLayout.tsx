"use client";

import { useState } from "react";
import { formatSum, type MenuItem } from "@bazmly/api/venues";
import { Fit } from "@bazmly/ui/Fit";
import { CartPanel } from "./CartPanel";
import type { CartLine } from "./useCart";

type Props = {
  children: React.ReactNode;
  lines: CartLine[];
  total: number;
  count: number;
  onAdd: (item: MenuItem) => void;
  onDec: (id: string) => void;
  onNext: () => void;
  nextLabel?: string;
};

/*
 * Joy sahifalari uchun umumiy qolip: chapda kontent, o'ngda savat + "Keyingisi".
 * wide (≥1860px) — Figma: kontent 1273px markazda, savat ekranning o'ng chetida qotgan.
 * lg–wide — ikki ustun, savat yopishqoq. lg dan kichik — savat pastki panelga aylanadi.
 */
export function VenueLayout({ children, lines, total, count, onAdd, onDec, onNext, nextLabel = "Keyingisi", fit = false }: Props & {
  /** Kompyuterda kontent ekranga sig'diriladi (bron sahifalari); aks holda u o'z bo'limida aylanadi */
  fit?: boolean;
}) {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <div className="container-page pb-28 lg:grid lg:w-[min(1600px,calc(100%-3rem))] lg:grid-cols-[minmax(0,1fr)_256px] lg:gap-8 lg:pb-6 wide:block wide:w-[1273px] wide:pb-6">
        <main className="min-w-0 pt-5 md:pt-8 xl:pt-[min(40px,3.704svh)]">{fit ? <Fit gap={24}>{children}</Fit> : children}</main>

        <aside aria-label="Tanlangan taomlar" className="hidden lg:block wide:fixed wide:bottom-[20px] wide:right-[30px] wide:top-[calc(min(60px,5.556svh)+104px)] wide:w-[256px]">
          <div className="sticky top-0 flex h-[calc(var(--screen-h,100svh)-24px)] max-h-[896px] flex-col gap-[30px] pt-5 md:pt-8 xl:pt-[min(40px,3.704svh)] wide:static wide:h-full wide:max-h-none wide:pt-0">
            <CartPanel lines={lines} onAdd={onAdd} onDec={onDec} className="min-h-0 flex-1" />
            <button type="button" onClick={onNext} className="h-[56px] w-full shrink-0 rounded-[20px] bg-brand text-[20px] font-semibold text-white transition-colors hover:bg-brand-600">
              {nextLabel}
            </button>
          </div>
        </aside>
      </div>

      {/* Telefon va planshet: pastki panel */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EEE] dark:border-[#474747] bg-white/95 dark:bg-[#2C2C2C]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[640px] gap-3">
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="flex h-12 flex-1 items-center justify-between rounded-[16px] bg-[#F4F4F4] dark:bg-[#393939] px-4 text-left">
            <span className="text-[14px] text-[#646464] dark:text-[#CFCFCF]">Tanlangan: <b className="text-black dark:text-[#FFFFFF]">{count}</b></span>
            <span className="text-[15px] font-semibold">{formatSum(total)}</span>
          </button>
          <button type="button" onClick={onNext} className="h-12 rounded-[16px] bg-brand px-6 text-[16px] font-semibold text-white">
            {nextLabel}
          </button>
        </div>
      </div>

      {sheet && (
        <div role="dialog" aria-modal="true" aria-label="Tanlangan taomlar" className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" onClick={() => setSheet(false)}>
          <div className="max-h-[80svh] w-full overflow-hidden rounded-t-[24px] bg-white dark:bg-[#2C2C2C] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold">Tanlangan taomlar</h2>
              <button type="button" onClick={() => setSheet(false)} className="text-[14px] text-brand">Yopish</button>
            </div>
            <CartPanel lines={lines} onAdd={onAdd} onDec={onDec} className="max-h-[60svh] min-h-[160px]" />
          </div>
        </div>
      )}
    </>
  );
}
