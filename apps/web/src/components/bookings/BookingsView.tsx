"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CallIcon, ClockIcon, LocationIcon, MapIcon } from "@bazmly/ui/icons";
import { type Booking, bookingThumb, bookingVenue, fetchBookings, isActive, STATUS_TEXT } from "@bazmly/api/bookings";
import type { VenueDetails } from "@bazmly/api/venues";
import { LocationPicker } from "./LocationPicker";

export type { Booking };

/** Bron kartasi uchun muassasa ma'lumotlari (backenddan) */
export function useBookingVenue(b: Booking) {
  const [v, setV] = useState<VenueDetails | null>(null);
  useEffect(() => {
    let alive = true;
    bookingVenue(b).then((x) => { if (alive) setV(x); });
    return () => { alive = false; };
  }, [b]);
  return v;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const at = (b: Booking) => (b.date ? new Date(`${b.date}T${b.time ?? "00:00"}:00`).getTime() : NaN);
const fmtReceipt = (r?: string) => (r ? (/^\d{10}$/.test(r) ? r.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3") : r.replace(/(.{4})(?=.)/g, "$1 ")) : "—");
const fmtDate = (iso?: string) => (iso ? iso.split("-").reverse().join("/") : "—");

/** "2 soat 25 daqiqa", "3 kun 4 soat", "12 daqiqa" */
export function leftText(ms: number) {
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d > 0) return `${d} kun${h ? ` ${h} soat` : ""}`;
  if (h > 0) return `${h} soat${m ? ` ${m} daqiqa` : ""}`;
  return `${Math.max(1, m)} daqiqa`;
}

// Figma: "Band qilingan joylar" — foydalanuvchining bronlari, eng yaqini birinchi
export function BookingsView() {
  const [list, setList] = useState<Booking[] | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchBookings().then(setList).catch(() => setList([]));
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const sorted = useMemo(() => {
    if (!list) return [];
    const up = list.filter((b) => at(b) > now && isActive(b)).sort((a, b) => at(a) - at(b));
    const past = list.filter((b) => !(at(b) > now && isActive(b))).sort((a, b) => (at(b) || 0) - (at(a) || 0));
    return [...up, ...past];
  }, [list, now]);

  return (
    <div className="container-page pb-16 pt-6 md:pt-8 xl:pb-[60px] xl:pt-[43.5px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold leading-[24px] text-[#1E1E1E] dark:text-[#FFFFFF]">Band qilingan</h1>
        <LocationPicker />
      </div>

      {list && !sorted.length && (
        <div className="mt-6 rounded-[16px] border border-dashed border-[#E2E2E2] dark:border-[#6C6C6C] px-6 py-16 text-center">
          <p className="text-[18px] font-semibold text-[#1E1E1E] dark:text-[#FFFFFF]">Hali band qilingan joylar yo‘q</p>
          <p className="mt-2 text-[15px] text-[#646464] dark:text-[#CFCFCF]">Restoran yoki to‘yxonani tanlab, birinchi bronni qiling.</p>
          <Link href="/" className="mt-6 inline-flex h-[48px] items-center rounded-full bg-brand px-6 text-[16px] font-semibold text-white hover:bg-brand-600">Joy tanlash</Link>
        </div>
      )}

      <ul className="mt-[26px] space-y-[22px] xl:mx-[1px]">
        {sorted.map((b) => <BookingCard key={b.id} b={b} now={now} />)}
      </ul>
    </div>
  );
}

export function BookingCard({ b, now }: { b: Booking; now: number }) {
  const v = useBookingVenue(b);
  const left = at(b) - now;
  const upcoming = left > 0 && isActive(b);
  const hall = b.type === "toyxona";
  const thumb = bookingThumb(b, v);
  // Bosilganda darhol "Ushbu QR kodni sotuvchiga ko‘rsating" ekrani ochiladi
  const href = `/bron/tasdiqlandi?id=${b.id}&qr=1&from=list`;
  const rows: [string, string][] = [
    ["Holat", b.status ? STATUS_TEXT[b.status] : upcoming ? "Band qilish tasdiqlandi" : "Yakunlangan"],
    ["Chek raqami:", fmtReceipt(b.receipt)],
    ["Belgilandi:", `${b.time ?? "—"} • ${fmtDate(b.date)}`],
    hall ? ["Mehmonlar soni:", b.guestTier ?? (b.people ? `${b.people} kishi` : "—")] : ["Stol raqami:", b.table ? `${b.table} - stol` : "—"],
    [hall ? "To‘yxona raqami:" : "Restoran raqami:", v?.phone ?? "—"],
  ];

  return (
    <li className={`relative rounded-[16px] border bg-[#F9F9F9] dark:bg-[#393939] pb-[15px] pl-[9px] pr-[9px] transition-shadow hover:shadow-[0_6px_20px_rgba(232,81,2,0.10)] ${upcoming ? "border-brand" : "border-[#D9D9D9] dark:border-[#6C6C6C]"}`}>
      <div className="flex gap-[14px] sm:gap-[20px]">
        <div className="relative mt-[12.5px] size-[72px] shrink-0 overflow-hidden rounded-[12px] bg-[#EEE] dark:bg-[#393939] sm:size-[92px]">
          {thumb && <Image src={thumb} alt="" fill sizes="92px" className="object-cover" />}
        </div>
        <div className="min-w-0 pt-[3px]">
          <h2 className="truncate text-[18px] font-semibold leading-[30px] text-[#1E1E1E] dark:text-[#FFFFFF] sm:text-[20px]">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-[16px] hover:text-brand">{b.venueName || v?.name}</Link>
          </h2>
          <p className="mt-[7px] flex h-[24.5px] items-center gap-[8px] text-[14px] text-[#4D4D4D] dark:text-[#CFCFCF]">
            <MapIcon className="size-[16px] shrink-0" />{v?.distanceKm ?? 1} km
            <span className="h-[12px] w-px bg-[#9A9A9A]" />
            <span className="flex items-center gap-[5px] font-semibold text-[#39CC3F]"><span className="size-[5px] rounded-full bg-[#39CC3F]" />{v?.open === false ? "Yopiq" : "Ochiq"}</span>
          </p>
          <p className="flex h-[24.5px] items-center gap-[8px] text-[14px] text-[#4D4D4D] dark:text-[#CFCFCF]"><CallIcon className="size-[16px] shrink-0" />{v?.phone}</p>
          <p className="flex h-[24.5px] items-center gap-[8px] text-[14px] text-[#4D4D4D] dark:text-[#CFCFCF]"><LocationIcon className="size-[17px] shrink-0" /><span className="truncate">{v?.address}</span></p>
        </div>
      </div>

      <dl className="mt-[4.5px]">
        {rows.map(([k, val]) => (
          <div key={k} className="flex h-[32px] items-center justify-between gap-3 text-[15px] sm:text-[16px]">
            <dt className="shrink-0 text-[#4C4C4C] dark:text-[#CFCFCF]">{k}</dt>
            <dd className="truncate text-right font-medium text-[#1F1F1F] dark:text-[#FFFFFF]">{val}</dd>
          </div>
        ))}
      </dl>

      <div className={`mt-[9px] flex h-[38px] items-center justify-center rounded-full border bg-white dark:bg-[#2C2C2C] text-[15px] sm:text-[16px] ${upcoming ? "border-brand text-brand" : "border-[#D9D9D9] dark:border-[#6C6C6C] text-[#8A8A8A] dark:text-[#B0B0B0]"}`}>
        {upcoming ? (
          <>
            <span>Qoldi:</span>
            <ClockIcon className="ml-[17px] size-[22px]" />
            <span className="ml-[12.5px] font-semibold" aria-live="polite">{leftText(left)}</span>
          </>
        ) : (
          <span>Vaqti o‘tgan</span>
        )}
      </div>
    </li>
  );
}
