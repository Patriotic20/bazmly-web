"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { at, BookingCard, type Booking } from "@/components/bookings/BookingsView";
import { ChevronLeftIcon } from "@bazmly/ui/icons";
import { fetchBookings } from "@bazmly/api/bookings";

// Figma: Tarix → "O'tirildi" — vaqti o'tgan (tashrif buyurilgan) bronlar, eng yangisi birinchi
export function HistoryView() {
  const router = useRouter();
  const [list, setList] = useState<Booking[] | null>(null);
  const [now] = useState(() => Date.now());
  useEffect(() => { fetchBookings().then(setList).catch(() => setList([])); }, []);
  const past = useMemo(() => (list ?? []).filter((b) => !(at(b) > now)).sort((a, b) => (at(b) || 0) - (at(a) || 0)), [list, now]);

  return (
    <div className="container-page pb-16 pt-5 md:pt-8 xl:pt-[40px]">
      <div className="flex items-start justify-between xl:px-[25.5px] xl:pt-[25.5px]">
        <button type="button" onClick={() => router.push("/profil")} aria-label="Orqaga" className="grid size-[40px] place-items-center rounded-full text-[#1F1F1F] dark:text-[#FFFFFF] hover:bg-[#F4F4F4] dark:hover:bg-[#393939]">
          <ChevronLeftIcon className="h-[23px] w-[12px]" />
        </button>
        <h1 className="pt-[7px] text-[20px] font-bold leading-[24px] text-black dark:text-[#FFFFFF] xl:pr-[4.5px]">O‘tirildi</h1>
      </div>
      {list && !past.length && (
        <div className="mt-8 rounded-[16px] border border-dashed border-[#E2E2E2] dark:border-[#6C6C6C] px-6 py-16 text-center">
          <p className="text-[18px] font-semibold text-[#1E1E1E] dark:text-[#FFFFFF]">Hali tashrif buyurilgan joylar yo‘q</p>
          <p className="mt-2 text-[15px] text-[#646464] dark:text-[#CFCFCF]">Bron vaqti o‘tgach, u shu yerda saqlanadi.</p>
          <Link href="/band-qilingan-joylar" className="mt-6 inline-flex h-[48px] items-center rounded-full bg-brand px-6 text-[16px] font-semibold text-white hover:bg-brand-600">Band qilingan joylar</Link>
        </div>
      )}
      <ul className="mt-6 space-y-[22px] xl:mt-[66.5px]">
        {past.map((b) => <BookingCard key={b.id} b={b} now={now} />)}
      </ul>
    </div>
  );
}
