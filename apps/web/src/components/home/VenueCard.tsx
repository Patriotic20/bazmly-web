import Image from "next/image";
import Link from "next/link";
import { LocationIcon, MapIcon, PercentSquareIcon, StarIcon } from "@bazmly/ui/icons";
import { type Venue, venueHref } from "@bazmly/api/venues";

// Figma: "Profile Card" 354×309 (Top Restoranlar / Top To'yxonalar). Telefonda 290px.
export function VenueCard({ v }: { v: Venue }) {
  return (
    <Link
      href={venueHref(v)}
      className="group block w-[290px] shrink-0 snap-start rounded-[16px] bg-[#F6F6F6] dark:bg-[#393939] p-[10px] pb-[20px] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:w-[354px]"
    >
      <div className="relative aspect-[334/161] w-full overflow-hidden rounded-[12px]">
        <Image src={v.image} alt={v.name} fill sizes="(min-width: 640px) 334px, 270px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="px-[10px] pt-[10px] sm:px-[14px]">
        <div className="flex h-[24px] items-center justify-between gap-2">
          <h3 className="truncate text-[16px] font-bold text-[#181818] dark:text-[#FFFFFF]">{v.name}</h3>
          <span className="flex shrink-0 items-center gap-[6px] text-[13px] text-[#535353] dark:text-[#CFCFCF] sm:text-[14px]">
            <StarIcon className="size-[14px]" />
            {v.rating} ({v.reviews} ta sharh)
          </span>
        </div>
        <p className="mt-[10px] flex h-[9px] items-center gap-[6px] text-[12px] font-semibold text-[#3ACD3F]">
          <span className="size-[6px] rounded-full bg-[#3ACD3F]" />
          {v.open ? "Ochiq" : "Yopiq"}
        </p>
        <div className="mt-[10px] flex h-[29px] items-center">
          <span className="flex shrink-0 items-center gap-[8px] text-[13px] text-[#646464] dark:text-[#CFCFCF] sm:w-[106px] sm:text-[14px]">
            <MapIcon className="size-[16px]" />
            {v.distanceKm} km uzoqda
          </span>
          {v.deposit && (
            <>
              <span className="ml-[8px] h-[10px] w-px bg-[#646464]" />
              <span className="ml-[7px] flex h-[29px] items-center justify-center gap-[8px] rounded-full bg-[#39CC3F] px-3 text-[13px] font-medium text-white sm:w-[116px] sm:px-0 sm:text-[14px]">
                <PercentSquareIcon className="size-[16px]" />
                Depozitlik
              </span>
            </>
          )}
        </div>
        <p className="mt-[10px] flex h-[16px] items-center gap-[8px] text-[13px] text-[#646464] dark:text-[#CFCFCF] sm:text-[14px]">
          <LocationIcon className="size-[16px] shrink-0" />
          <span className="truncate">{v.address}</span>
        </p>
      </div>
    </Link>
  );
}
