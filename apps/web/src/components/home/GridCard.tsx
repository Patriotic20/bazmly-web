import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, LocationIcon, MapIcon, StarIcon } from "@bazmly/ui/icons";
import { type GridVenue, venueHref } from "@bazmly/api/venues";

// Figma: "Profile Card" 215×388 (5 ustun, 1274px). Kichik ekranda ustunlar soni kamayadi, karta kengayadi.
export function GridCard({ v }: { v: GridVenue }) {
  return (
    <article className="group flex flex-col rounded-[16px] bg-[#F6F6F6] dark:bg-[#393939] p-[8px] pb-[10px] sm:rounded-[20px] sm:p-[12.2px] sm:pb-[12.5px] sm:pt-[12.5px]">
      <div className="relative aspect-[190.6/202] w-full overflow-hidden rounded-[12px] sm:rounded-[16px]">
        <Image src={v.image} alt={v.name} fill sizes="(min-width: 1280px) 191px, (min-width: 640px) 30vw, 45vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
      </div>
      <div className="mt-[10px] px-[4px] sm:mt-[11px] sm:px-[5.3px]">
        <div className="flex h-[24px] items-center justify-between gap-2 sm:h-[30px]">
          <h3 className="truncate text-[16px] font-semibold text-[#181818] dark:text-[#FFFFFF] sm:text-[20px]">{v.name}</h3>
          <span className="flex shrink-0 items-center gap-[4px] text-[16px] font-semibold text-[#181818] dark:text-[#FFFFFF] sm:gap-[5px] sm:text-[20px]">
            <StarIcon className="size-[13px] sm:size-[15px]" />
            {v.rating}
          </span>
        </div>
        <div className="mt-[8px] flex h-[20px] items-center text-[13px] sm:mt-[12.5px] sm:text-[18px]">
          <span className="flex shrink-0 items-center gap-[6px] text-[#646464] dark:text-[#CFCFCF] sm:gap-[10px]">
            <MapIcon className="size-[16px] sm:size-[20px]" />
            {v.distanceKm} km
          </span>
          <span className="mx-[6px] h-[12.5px] w-px shrink-0 bg-[#646464] sm:mx-[10px]" />
          <span className="flex min-w-0 items-center gap-[5px] font-semibold text-[#3ACD3F] sm:gap-[7.5px]">
            <span className="size-[6px] shrink-0 rounded-full bg-[#3ACD3F] sm:size-[7.5px]" />
            {v.open ? "Ochiq" : "Yopiq"}
          </span>
        </div>
        <p className="mt-[8px] flex h-[20px] items-center gap-[6px] text-[13px] text-[#646464] dark:text-[#CFCFCF] sm:mt-[12.5px] sm:gap-[10px] sm:text-[18px]">
          <LocationIcon className="size-[16px] shrink-0 sm:size-[20px]" />
          <span className="min-w-0 truncate xl:max-w-[98px]">{v.address}</span>
        </p>
      </div>
      <Link
        href={venueHref(v)}
        className="mt-[12px] flex h-9 w-full items-center justify-center gap-[5px] rounded-full bg-[#FF6A00] text-[15px] font-semibold text-white transition-colors hover:bg-brand sm:mx-auto sm:mt-[18.7px] sm:h-[36.4px] sm:w-[94.8%] sm:text-[20px]"
      >
        Ko‘rish
        <ArrowRightIcon className="size-[16px] sm:size-[19px]" />
      </Link>
    </article>
  );
}
