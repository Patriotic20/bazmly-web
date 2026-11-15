"use client";

import Image from "next/image";
import { MinusIcon, PlusIcon } from "@bazmly/ui/icons";
import { formatSum, type MenuItem } from "@bazmly/api/venues";
import type { CartLine } from "./useCart";

type Props = {
  lines: CartLine[];
  onAdd: (item: MenuItem) => void;
  onDec: (id: string) => void;
  className?: string;
};

// Figma: o'ng panel 256×810, #F4F4F4. Bo'sh — "Hech narsa belgilanmadi", to'lganda pastdan yuqoriga.
export function CartPanel({ lines, onAdd, onDec, className = "" }: Props) {
  return (
    <div className={`flex flex-col rounded-[20px] bg-[#F4F4F4] dark:bg-[#393939] ${className}`}>
      {lines.length === 0 ? (
        <p className="m-auto px-6 text-center text-[16px] text-[#3A3A3A] dark:text-[#FFFFFF]">Hech narsa belgilanmadi</p>
      ) : (
        <ul className="no-scrollbar mt-auto flex flex-col gap-[20px] overflow-y-auto p-[10px]">
          {lines.map(({ item, qty }) => (
            <li key={item.id}>
              <div className="flex gap-[6px]">
                <div className="relative h-[86px] w-[90px] shrink-0 overflow-hidden rounded-[12px]">
                  <Image src={item.image} alt={item.name} fill sizes="90px" className="object-cover" />
                </div>
                <div className="min-w-0 pt-[2px]">
                  <p className="h-[30px] truncate text-[20px] font-semibold leading-[30px] text-[#181818] dark:text-[#FFFFFF]">{formatSum(item.price * qty)}</p>
                  <p className="mt-[6px] truncate text-[16px] leading-[12px] text-[#646464] dark:text-[#CFCFCF]">{item.name}</p>
                </div>
              </div>
              <div className="mt-[10px] flex h-[45px] items-center justify-between rounded-full bg-white dark:bg-[#2C2C2C] px-[13px]">
                <button type="button" onClick={() => onDec(item.id)} aria-label={`${item.name} — kamaytirish`} className="grid size-[24px] place-items-center text-[#181818] dark:text-[#FFFFFF] hover:text-brand">
                  <MinusIcon className="size-[20px]" />
                </button>
                <span className="text-[18px] font-semibold tabular-nums" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => onAdd(item)} aria-label={`${item.name} — qo‘shish`} className="grid size-[24px] place-items-center text-[#181818] dark:text-[#FFFFFF] hover:text-brand">
                  <PlusIcon className="size-[20px]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
