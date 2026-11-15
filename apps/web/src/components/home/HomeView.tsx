"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { USER_KEY } from "@bazmly/api/user";
import { BookedCard, useNextBooking } from "./BookedCard";
import { GridCard } from "./GridCard";
import { PromoCarousel } from "./PromoCarousel";
import { Empty, Section } from "./Section";
import { VenueCard } from "./VenueCard";
import { ScrollRow } from "./ScrollRow";
import { allHalls, allVenues, topHalls, topRestaurants } from "@bazmly/api/venues";

type Tab = "all" | "restoran" | "toyxona";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Umumiy" },
  { id: "restoran", label: "Restoranlar" },
  { id: "toyxona", label: "To‘yxonalar" },
];

function greeting(h: number) {
  if (h >= 5 && h < 11) return "Hayrli tong!";
  if (h >= 11 && h < 18) return "Hayrli kun!";
  return "Hayrli kech!";
}

export function HomeView() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [tab, setTab] = useState<Tab>("all");
  const [hello, setHello] = useState({ text: "Hayrli kun!", name: "" });

  useEffect(() => {
    let name = "";
    try { name = JSON.parse(localStorage.getItem(USER_KEY) ?? "{}").name ?? ""; } catch {}
    setHello({ text: greeting(new Date().getHours()), name });
  }, []);

  const booked = useNextBooking();
  const match = (name: string) => !q || name.toLowerCase().includes(q);
  const rest = useMemo(() => topRestaurants.filter((v) => match(v.name)), [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const halls = useMemo(() => topHalls.filter((v) => match(v.name)), [q]); // eslint-disable-line react-hooks/exhaustive-deps
  // To'yxonalar tabida pastdagi ro'yxat — faqat to'yxonalar
  const grid = useMemo(() => (tab === "toyxona" ? allHalls : allVenues).filter((v) => match(v.name)), [q, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const showRest = true; // Figma: To‘yxonalar tabida ham Top Restoranlar qatori turadi
  const showHalls = tab !== "restoran";
  const showGrid = true;

  return (
    <div className="container-page">
      {/* Kompyuterda salomlashuv va toifalar joyida turadi, pastdagi ro'yxatlar aylanadi */}
      <div className="lg:sticky lg:top-0 lg:z-20 lg:bg-white dark:lg:bg-[#2C2C2C] lg:pb-[2px] lg:pt-px">
      <h1 className="mt-6 text-center text-[20px] font-semibold leading-tight text-black dark:text-[#FFFFFF] md:mt-10 xl:mt-[min(60px,5.556svh)] xl:h-[18px] xl:text-[24px] xl:leading-[18px]">
        {hello.text} {hello.name}
      </h1>

      <div role="tablist" aria-label="Toifalar" className="mt-5 flex gap-2 sm:gap-4 md:mt-10 xl:mt-[min(61px,5.648svh)] xl:gap-[20px]">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-[38px] flex-1 rounded-full border-[1.5px] border-brand text-[14px] font-medium transition-colors sm:w-[173px] sm:flex-none sm:text-[16px] ${
              tab === t.id ? "bg-brand text-white" : "bg-white dark:border-[#6C6C6C] dark:bg-[#393939] text-black dark:text-[#FFFFFF] hover:bg-brand-50 dark:hover:bg-[#483126]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      </div>

      {q && (
        <p className="mt-[20px] text-[16px] text-[#646464] dark:text-[#CFCFCF]">
          “{params.get("q")}” bo‘yicha natijalar
        </p>
      )}

      {!q && booked && (
        <div className="mt-[28px]">
          <Section title="Bandlangan">
            <BookedCard b={booked} />
          </Section>
        </div>
      )}

      {!q && (
        <div className="mt-[30px]">
          <Section title="Eng yaxshi takliflar">
            <PromoCarousel />
          </Section>
        </div>
      )}

      {showRest && (
        <div className="mt-[30px]">
          <Section title="Top Restoranlar" moreHref="/restoranlar">
            {rest.length ? (
              <ScrollRow label="Top restoranlar">
                {rest.map((v) => <VenueCard key={v.id} v={v} />)}
              </ScrollRow>
            ) : <Empty />}
          </Section>
        </div>
      )}

      {showHalls && (
        <div className="mt-[30px]">
          <Section title="Top To‘yxonalar" moreHref="/toyxonalar">
            {halls.length ? (
              <ScrollRow label="Top to‘yxonalar">
                {halls.map((v) => <VenueCard key={v.id} v={v} />)}
              </ScrollRow>
            ) : <Empty />}
          </Section>
        </div>
      )}

      {showGrid && (
        <div className="mt-[30px] xl:pl-[1.5px]">
          {grid.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-8 xl:grid-cols-[repeat(5,215px)] xl:justify-between xl:gap-x-0 xl:gap-y-[49px]">
              {grid.map((v) => <GridCard key={v.id} v={v} />)}
            </div>
          ) : <Empty />}
        </div>
      )}

      <div className="h-16 md:h-24 lg:h-12 xl:h-[312px]" />
    </div>
  );
}
