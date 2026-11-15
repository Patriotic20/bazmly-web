"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon, CutleryIcon, DiscountIcon, LocationIcon, MapIcon, MasksIcon, MoneyIcon,
  PeopleIcon, PercentSquareIcon, SnowflakeIcon, SpeakerIcon, StarIcon, WifiIcon,
} from "@bazmly/ui/icons";
import { type Amenity, formatNum, type VenueDetails } from "@bazmly/api/venues";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { VenueHero } from "./VenueHero";

const AMENITY_ICON: Record<Amenity["id"], React.ReactNode> = {
  parking: <span className="text-[17px] font-extrabold leading-none">P</span>,
  acoustic: <SpeakerIcon className="size-[19px]" />,
  stage: <MasksIcon className="size-[20px]" />,
  ac: <SnowflakeIcon className="size-[18px]" />,
  kitchen: <CutleryIcon className="size-[19px]" />,
  wifi: <WifiIcon className="size-[20px]" />,
};

// Figma: to'yxona sahifasi ("The Royal Grand"). Kontent 1273px — restoran sahifasi bilan bir xil galereya.
export function HallPage({ v }: { v: VenueDetails }) {
  const [photo, setPhoto] = useState(0);
  const price = v.price ?? 0;
  const href = `/toyxonalar/${v.id}/bron`;

  return (
    <>
    <div className="container-page pb-16 lg:w-[min(1273px,calc(100%-3rem))] xl:pb-[76px]">
      <main className="pt-5 md:pt-8 xl:pt-[40px]">
        <VenueHero v={v} photo={photo} setPhoto={setPhoto} />

        <section className="mt-6 lg:mt-[40px]">
          <div className="flex h-[29px] items-center justify-between gap-3">
            {v.discount ? (
              <span className="flex h-[29px] items-center gap-[8px] rounded-[10px] bg-[#F4F4F4] dark:bg-[#393939] px-[12px] text-[16px] font-medium text-[#39CC3F]">
                <DiscountIcon className="size-[22px]" />
                {v.discount}% chegirma
              </span>
            ) : <span />}
            <span className="flex items-center gap-[6px] text-[14px] text-[#535353] dark:text-[#CFCFCF] sm:text-[16px]">
              <StarIcon className="size-[14px]" />
              {v.rating} ({v.reviews} ta sharh)
            </span>
          </div>

          <div className="mt-[11px] flex items-center justify-between gap-3">
            <h1 className="text-[22px] font-bold leading-[30px] text-[#0F172A] dark:text-[#FFFFFF] sm:text-[24px]">{v.name}</h1>
            <span className="flex shrink-0 items-center gap-[6px] text-[16px] font-semibold text-[#39CC3F]">
              <span className="size-[6px] rounded-full bg-[#39CC3F]" />
              {v.open ? "Ochiq" : "Yopiq"}
            </span>
          </div>

          <ul className="text-[15px] text-black dark:text-[#FFFFFF] sm:text-[16px]">
            <li className="mt-[7px] flex h-[22px] items-center gap-[12px]">
              <MoneyIcon className="size-[19px] shrink-0" />
              {formatNum(price)} so‘m
            </li>
            <li className="mt-[10px] flex h-[22px] items-center gap-[12px]">
              <PeopleIcon className="size-[19px] shrink-0" />
              {v.guests ? `${formatNum(v.guests.min)} - ${formatNum(v.guests.max)} gacha odam` : v.capacity}
            </li>
            <li className="mt-[12px] flex h-[29px] items-center">
              <span className="flex items-center gap-[12px] whitespace-nowrap">
                <MapIcon className="size-[19px] shrink-0" />
                {v.distanceKm} km uzoqda
              </span>
              {v.deposit && (
                <>
                  <span className="mx-[11px] h-[10px] w-px bg-[#646464]" />
                  <span className="flex h-[29px] items-center gap-[8px] rounded-[8px] bg-[#39CC3F] px-[12px] text-[16px] font-medium text-white">
                    <PercentSquareIcon className="size-[16px]" />
                    Depozitlik
                  </span>
                </>
              )}
            </li>
            <li className="mt-[9px] flex min-h-[22px] items-center gap-[12px]">
              <LocationIcon className="size-[20px] shrink-0" />
              {v.city}, {v.address}
            </li>
          </ul>
        </section>

        <hr className="mt-6 border-[#D9D9D9] dark:border-[#6C6C6C] lg:mt-[37px]" />

        <div className="mt-[19.5px] flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] leading-[16px] text-[#64748B] dark:text-[#CFCFCF]">Jami narx</p>
            <p className="mt-[4px] text-[18px] font-bold sm:text-[20px] leading-[28px] text-[#0F172A] dark:text-[#FFFFFF]">{formatNum(price)}</p>
          </div>
          <Link
            href={href}
            className="flex h-[52px] shrink-0 items-center justify-center gap-[10px] px-5 sm:w-[173.5px] sm:px-0 rounded-[12px] bg-[#FF6A00] text-[18px] font-semibold text-white transition-colors hover:bg-brand"
          >
            Band qilish
            <ArrowRightIcon className="size-[18px]" />
          </Link>
        </div>

        {v.description && (
          <section className="mt-12 lg:mt-[77px] lg:px-[16px]">
            <h2 className="text-[18px] font-semibold leading-[22px] text-black dark:text-[#FFFFFF]">Tavsif</h2>
            <p className="mt-[13px] max-w-[1080px] text-[15px] leading-[20px] text-[#777777] dark:text-[#B0B0B0] sm:text-[16px]">{v.description}</p>
          </section>
        )}

        {v.amenities && (
          <section className="mt-12 lg:mt-[72px] lg:px-[16px]">
            <h2 className="text-center text-[18px] font-semibold leading-[22px] text-black dark:text-[#FFFFFF]">Qulayliklar va Xizmatlar</h2>
            <ul className="mt-[16px] grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:flex lg:justify-between lg:gap-4">
              {v.amenities.map((a) => (
                <li key={a.id} className="flex h-[68px] items-center gap-[12.5px] rounded-[12px] border border-[#F1F5F9] dark:border-[#474747] bg-white dark:bg-[#2C2C2C] px-[12px] lg:w-[164px]">
                  <span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-[#FFF5F0] dark:bg-[#483126] text-brand">{AMENITY_ICON[a.id]}</span>
                  <span className="min-w-0 break-words text-[14px] leading-[18px] text-black dark:text-[#FFFFFF] sm:text-[16px] sm:leading-[20px]">{a.label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
    <SiteFooter />
    </>
  );
}
