"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookmarkPlusIcon, ChevronLeftIcon, ShareIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import type { VenueDetails } from "@bazmly/api/venues";

// Restoran va to'yxona sahifalaridagi umumiy galereya (Figma: 1273×431)
export function VenueHero({ v, photo, setPhoto }: { v: VenueDetails; photo: number; setPhoto: (i: number) => void }) {
  const router = useRouter();
  const toast = useToast();
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: v.name, url });
      else { await navigator.clipboard.writeText(url); toast("Havola nusxalandi"); }
    } catch {}
  };
  return (
    <>
    {/* Galereya. lg+ da rasm Figma proporsiyasida (1273×431) — ustidagi elementlar cqw birligida
        rasm bilan birga kattalashadi/kichrayadi, shuning uchun har kenglikda aynan Figma'dagidek turadi. */}
    <div className="@container relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-[#EEE] dark:bg-[#393939] sm:aspect-[16/9] lg:aspect-[1273/431] lg:rounded-none">
      {photo === 0 && v.heroMobile ? (
        <>
          <Image src={v.heroMobile} alt={v.name} fill priority sizes="100vw" className="object-cover lg:hidden" />
          <Image src={v.hero} alt="" fill priority sizes="1273px" className="hidden object-cover lg:block" />
        </>
      ) : (
        <Image src={v.gallery[photo]} alt={v.name} fill priority sizes="(min-width: 1024px) 1273px, 100vw" className="object-cover" />
      )}
      <button type="button" onClick={() => router.back()} aria-label="Orqaga" className="absolute left-[12px] top-[12px] grid size-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm lg:left-[1.964cqw] lg:top-[2.416cqw] lg:size-[3.142cqw] lg:bg-transparent lg:backdrop-blur-none">
        <ChevronLeftIcon className="h-[18px] w-[9px] lg:h-[1.767cqw] lg:w-[0.864cqw]" />
      </button>
      <div className="absolute right-[12px] top-[16px] flex gap-[16px] lg:right-[2.435cqw] lg:top-[2.789cqw] lg:gap-[1.257cqw]">
        <button type="button" onClick={share} aria-label="Ulashish" className="grid size-[32px] place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 lg:size-[2.514cqw]">
          <ShareIcon className="size-[19px] lg:size-[1.49cqw]" />
        </button>
        <button type="button" onClick={() => toast("Saqlanganlarga qo‘shildi")} aria-label="Saqlash" className="grid size-[32px] place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 lg:size-[2.514cqw]">
          <BookmarkPlusIcon className="size-[19px] lg:size-[1.49cqw]" />
        </button>
      </div>
      <div className="no-scrollbar absolute bottom-[10px] left-[10px] right-[10px] flex w-fit max-w-[calc(100%-20px)] gap-[6px] overflow-x-auto rounded-[14px] bg-white/80 dark:bg-[#2C2C2C]/80 p-[5px] backdrop-blur-sm sm:p-[6px] lg:bottom-[2.71cqw] lg:left-[2.357cqw] lg:max-w-none lg:gap-[0.471cqw] lg:overflow-visible lg:rounded-[1.257cqw] lg:p-[0.471cqw]">
        {v.gallery.slice(1, 7).map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setPhoto(photo === i + 1 ? 0 : i + 1)}
            aria-label={`${i + 1}-rasm`}
            aria-current={photo === i + 1}
            className={`relative size-[44px] shrink-0 overflow-hidden rounded-[8px] transition sm:size-[56px] lg:size-[5.185cqw] lg:rounded-[0.786cqw] ${photo === i + 1 ? "ring-2 ring-brand" : "hover:opacity-80"}`}
          >
            <Image src={src} alt="" fill sizes="66px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
    </>
  );
}
