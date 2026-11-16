"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingVenue, fetchBookings, isActive } from "@bazmly/api/bookings";
import { isAuthed } from "@bazmly/api/client";
import type { VenueDetails } from "@bazmly/api/venues";
import { LocationIcon, MapIcon, UserIcon } from "@bazmly/ui/icons";
import { at, type Booking } from "../bookings/BookingsView";

const CalendarIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
  </svg>
);
const ChatIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
    <path d="M5 3.5h14A2.5 2.5 0 0 1 21.5 6v9a2.5 2.5 0 0 1-2.5 2.5h-4.2L12 21l-2.8-3.5H5A2.5 2.5 0 0 1 2.5 15V6A2.5 2.5 0 0 1 5 3.5Z" />
    <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const dayText = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`), t = new Date();
  const diff = Math.round((d.getTime() - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) / 864e5);
  return diff === 0 ? "Bugun" : diff === 1 ? "Ertaga" : iso.split("-").reverse().slice(0, 2).join(".");
};

/** Eng yaqin kelgusi bron (o'tib ketganlar ko'rsatilmaydi) */
export function useNextBooking() {
  const [b, setB] = useState<Booking | null>(null);
  useEffect(() => {
    if (!isAuthed()) return;
    let alive = true;
    fetchBookings().then((list) => {
      const now = Date.now();
      if (alive) setB(list.filter((x) => at(x) >= now && isActive(x)).sort((x, y) => at(x) - at(y))[0] ?? null);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return b;
}

// Figma: "Bandlangan" — bosh sahifada eng yaqin bron kartasi (353×168, to'q sariq)
export function BookedCard({ b }: { b: Booking }) {
  const [v, setV] = useState<VenueDetails | null>(null);
  useEffect(() => {
    let alive = true;
    bookingVenue(b).then((x) => { if (alive) setV(x); });
    return () => { alive = false; };
  }, [b]);
  if (!v) return null;
  const people = b.people ?? b.guestTier;
  return (
    <div className="relative w-full max-w-[353px] rounded-[20px] bg-brand px-[10px] pb-[10px] pt-[10px] text-white">
      <Link href={`/bron/tasdiqlandi?id=${b.id}&qr=1&from=home`} className="flex gap-[11px]" aria-label={`${v.name} — QR kodni ko‘rsatish`}>
        <Image src={v.hero} alt="" width={192} height={192} className="size-[96px] shrink-0 rounded-[10px] object-cover" />
        <span className="min-w-0 flex-1">
          <span className="-mt-[6px] block truncate text-[18px] font-bold leading-[22px]">{v.name}</span>
          <span className="mt-[6px] flex items-center gap-[9px] text-[14px] leading-[18px]">
            <MapIcon className="size-[18px] shrink-0" />{v.distanceKm} km
            <span className="h-[10px] w-px bg-white/50" />
            <span className={`flex items-center gap-[4px] font-semibold ${v.open ? "text-[#7CF07F]" : "text-white/70"}`}><i className="size-[5px] rounded-full bg-current" />{v.open ? "Ochiq" : "Yopiq"}</span>
          </span>
          <span className="mt-[10px] flex items-center gap-[9px] text-[14px] leading-[18px]">
            <LocationIcon className="size-[18px] shrink-0" /><span className="truncate">{v.address}</span>
          </span>
          {(people || b.date) && (
            <span className="mt-[10px] flex items-center gap-[9px] text-[14px] font-semibold leading-[18px]">
              {people && <><UserIcon className="size-[18px] shrink-0" />{people}</>}
              {b.date && <><CalendarIcon className="ml-[4px] size-[18px] shrink-0" />{b.time ? `${b.time} ` : ""}{dayText(b.date)}</>}
            </span>
          )}
        </span>
      </Link>
      <a href={`sms:${v.phone}`} className="mt-[14px] flex h-[38px] items-center justify-center gap-[10px] rounded-full border border-[#FFB98F] bg-[#FFF6EF] text-[15px] font-bold text-brand transition-colors hover:bg-white">
        <ChatIcon className="size-[20px]" />Xabar yuborish
      </a>
    </div>
  );
}
