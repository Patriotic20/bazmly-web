"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DiscountIcon, LocationIcon, MapIcon,
  MinusIcon, PercentSquareIcon, PlusIcon, SearchIcon, StarIcon,
} from "@bazmly/ui/icons";
import { formatSum, type MenuItem, type VenueDetails } from "@bazmly/api/venues";
import { BookingPicker } from "./BookingPicker";
import { VenueHero } from "./VenueHero";
import { VenueLayout } from "./VenueLayout";
import { useCart } from "./useCart";

type Tab = "menu" | "info" | "photos";
const TABS: { id: Tab; label: string; x: number; w: number }[] = [
  { id: "menu", label: "Menyu", x: 0, w: 84 },
  { id: "info", label: "Ma‘lumotlar", x: 133, w: 91 },
  { id: "photos", label: "Rasmlar", x: 273, w: 84 },
];

// Figma: restoran sahifasi (3373:11965). ≥1860px — aynan Figma: kontent 1273px markazda, savat o'ngda qotgan.
export function VenuePage({ v }: { v: VenueDetails }) {
  const router = useRouter();
  const cart = useCart(v.id, v.menu);
  const [photo, setPhoto] = useState(0);
  const [tab, setTab] = useState<Tab>("menu");
  const [q, setQ] = useState("");
  const [picker, setPicker] = useState(false);

  const items = useMemo(
    () => v.menu.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase())),
    [v.menu, q],
  );

  const next = () => router.push(`/${v.type === "toyxona" ? "toyxonalar" : "restoranlar"}/${v.id}/bron`);

  return (
    <VenueLayout lines={cart.lines} total={cart.total} count={cart.count} onAdd={cart.add} onDec={cart.dec} onNext={() => setPicker(true)}>

          <VenueHero v={v} photo={photo} setPhoto={setPhoto} />

          {/* Ma'lumotlar */}
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
            <div className="mt-[16px] flex min-h-[36px] items-center justify-between gap-3">
              <h1 className="text-[22px] font-bold text-[#181818] dark:text-[#FFFFFF] sm:text-[24px]">{v.name}</h1>
              <span className="flex shrink-0 items-center gap-[6px] text-[16px] font-semibold text-[#3ACD3F]">
                <span className="size-[6px] rounded-full bg-[#3ACD3F]" />
                {v.open ? "Ochiq" : "Yopiq"}
              </span>
            </div>
            <div className="mt-[16px] flex h-[29px] items-center">
              <span className="flex shrink-0 items-center gap-[10px] whitespace-nowrap text-[16px] text-black dark:text-[#FFFFFF] sm:w-[125px] sm:text-[18px]">
                <MapIcon className="size-[22px] shrink-0" />
                {v.distanceKm} km uzoqda
              </span>
              {v.deposit && (
                <>
                  <span className="mx-[10px] h-[10px] w-px bg-[#646464] sm:ml-[10px] sm:mr-[9.5px]" />
                  <span className="flex h-[29px] items-center justify-center gap-[8px] rounded-full bg-[#39CC3F] px-[12px] text-[16px] font-medium text-white sm:w-[125px] sm:px-0">
                    <PercentSquareIcon className="size-[16px]" />
                    Depozitlik
                  </span>
                </>
              )}
            </div>
            <p className="mt-[16px] flex min-h-[35px] items-center gap-[16px] text-[18px] text-black dark:text-[#FFFFFF] sm:text-[20px]">
              <LocationIcon className="size-[30px] shrink-0 sm:size-[35px]" />
              {v.city}, {v.address}
            </p>
          </section>

          {/* Tablar */}
          <div role="tablist" aria-label="Bo‘limlar" className="relative mt-8 flex h-[26px] justify-center border-b border-[#DADADA] dark:border-[#6C6C6C] lg:mt-[40px]">
            <div className="relative flex w-full max-w-[357px] justify-between">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex h-[26px] flex-col text-[16px] font-medium leading-[12px] transition-colors ${tab === t.id ? "text-black dark:text-[#FFFFFF]" : "text-black/80 dark:text-[#FFFFFF]/80 hover:text-black dark:hover:text-[#FFFFFF]"}`}
                  style={{ width: t.w }}
                >
                  <span className="block h-[21px]">{t.label}</span>
                  {tab === t.id && <span className="absolute inset-x-0 top-[21px] h-[5px] rounded-full bg-[#FF6A00]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-[20px]">
            {tab === "menu" && (
              <section aria-label="Menyu">
                <h2 className="h-[12px] text-[16px] font-medium leading-[12px] text-black dark:text-[#FFFFFF]">
                  Menu <span className="text-[#FF6A00] dark:text-white">({v.menu.length} mahsulot)</span>
                </h2>
                <label className="mt-[12px] flex h-[44px] items-center gap-[10px] rounded-[12px] bg-[#F3F3F3] dark:bg-[#393939] px-[14px]">
                  <SearchIcon className="size-[24px] shrink-0 text-brand dark:text-white" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Qidirish"
                    aria-label="Menyudan qidirish"
                    className="h-full w-full bg-transparent text-[16px] outline-none placeholder:text-[#7A7A7A] dark:placeholder:text-[#B0B0B0] [&::-webkit-search-cancel-button]:hidden"
                  />
                </label>
                {items.length ? (
                  <div className="mt-[16px] grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 wide:grid-cols-[repeat(6,172px)] wide:justify-between wide:gap-x-0 wide:gap-y-[30px]">
                    {items.map((m) => (
                      <MenuCard key={m.id} m={m} qty={cart.qty(m.id)} onAdd={() => cart.add(m)} onDec={() => cart.dec(m.id)} />
                    ))}
                  </div>
                ) : (
                  <p className="py-12 text-center text-[16px] text-[#646464] dark:text-[#CFCFCF]">Hech narsa topilmadi</p>
                )}
              </section>
            )}

            {tab === "info" && (
              <dl className="grid gap-4 text-[16px] sm:grid-cols-2">
                {[
                  ["Joy haqida", v.about],
                  ["Ish vaqti", v.hours],
                  ["Telefon", v.phone],
                  ["Sig‘im", v.capacity],
                  ["Manzil", `${v.city}, ${v.address}`],
                ].map(([k, val]) => (
                  <div key={k} className="rounded-[16px] bg-[#F6F6F6] dark:bg-[#393939] p-4">
                    <dt className="text-[14px] text-[#646464] dark:text-[#CFCFCF]">{k}</dt>
                    <dd className="mt-1 text-[#181818] dark:text-[#FFFFFF]">{k === "Telefon" ? <a href={`tel:${val.replace(/\s/g, "")}`} className="text-brand">{val}</a> : val}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tab === "photos" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {v.gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => { setPhoto(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="relative aspect-square overflow-hidden rounded-[16px]"
                    aria-label={`${i + 1}-rasmni ko‘rish`}
                  >
                    <Image src={src} alt="" fill sizes="(min-width: 1024px) 300px, 45vw" className="object-cover transition-transform hover:scale-105" />
                  </button>
                ))}
              </div>
            )}
          </div>
      {picker && <BookingPicker venueId={v.id} onClose={() => setPicker(false)} onConfirm={next} />}
    </VenueLayout>
  );
}

function MenuCard({ m, qty, onAdd, onDec }: { m: MenuItem; qty: number; onAdd: () => void; onDec: () => void }) {
  return (
    <article>
      <div className="relative aspect-[172/166] w-full overflow-hidden rounded-[16px]">
        <Image src={m.image} alt={m.name} fill sizes="(min-width: 1860px) 172px, (min-width: 768px) 22vw, 45vw" className="object-cover object-top" />
        {qty ? (
          // Figma: savatdagi taom — rasm pastida "− 1 +"
          <div className="absolute inset-x-[6px] bottom-[6px] flex h-[45px] items-center justify-between rounded-full bg-white dark:bg-[#2C2C2C] px-[13px] shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
            <button type="button" onClick={onDec} aria-label={`${m.name} — kamaytirish`} className="grid size-[24px] place-items-center text-[#181818] dark:text-[#FFFFFF] hover:text-brand">
              <MinusIcon className="size-[20px]" />
            </button>
            <span className="text-[18px] font-semibold tabular-nums">{qty}</span>
            <button type="button" onClick={onAdd} aria-label={`${m.name} — savatga qo‘shish`} className="grid size-[24px] place-items-center text-[#181818] dark:text-[#FFFFFF] hover:text-brand">
              <PlusIcon className="size-[20px]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`${m.name} — savatga qo‘shish`}
            className="absolute bottom-[6px] right-[6px] grid size-[45px] place-items-center rounded-full bg-white dark:bg-[#2C2C2C] text-[#181818] dark:text-[#FFFFFF] shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-colors hover:bg-brand hover:text-white"
          >
            <PlusIcon className="size-[20px]" />
          </button>
        )}
      </div>
      <p className="mt-[6px] h-[30px] truncate text-[18px] font-semibold leading-[30px] text-[#181818] dark:text-[#FFFFFF] sm:text-[20px]">{formatSum(m.price)}</p>
      <h3 className="mt-[6px] truncate text-[16px] leading-[12px] text-[#646464] dark:text-[#CFCFCF]">{m.name}</h3>
    </article>
  );
}
