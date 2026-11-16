"use client";

import { HALL_STEPS } from "@bazmly/api/booking";
import type { GridVenue, Venue, VenueType } from "@bazmly/api/venues";
import { Stepper } from "../venue/Stepper";
import { GridCard } from "./GridCard";
import { ScrollRow } from "./ScrollRow";
import { Section } from "./Section";
import { useVenues } from "./useVenues";
import { VenueCard } from "./VenueCard";

const REST_STEPS = ["Restoranni belgilang", "Menu", "Kun va vaqtni belgilang", "Ma‘lumotlarni tasdiqlash"];

// Figma: "Restoranni belgilang" — bron qilishning 1-bosqichi: Top qatori va barcha joylar to'ri
export function ListingView({ type }: { type: VenueType }) {
  const hall = type === "toyxona";
  const top = useVenues<Venue>(type, "top") ?? [];
  const grid = useVenues<GridVenue>(type, "grid") ?? [];
  return (
    <div className="container-page pb-16 pt-5 md:pt-8 xl:pt-[40px]">
      <div className="lg:pt-[34px]">
        <Stepper steps={hall ? HALL_STEPS : REST_STEPS} current={1} checkDone={false} nowrap={hall} />
      </div>
      <div className="mt-12 lg:mt-[97px]">
        <Section title={hall ? "Top To‘yxonalar" : "Top Restoranlar"} moreHref="#barchasi">
          <ScrollRow label={hall ? "Top to‘yxonalar" : "Top restoranlar"}>
            {top.map((v) => <VenueCard key={v.id} v={v} />)}
          </ScrollRow>
        </Section>
      </div>
      <div id="barchasi" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-8 xl:mt-[34px] xl:grid-cols-[repeat(5,215px)] xl:justify-between xl:gap-x-0 xl:gap-y-[49px]">
        {grid.map((v) => <GridCard key={v.id} v={v} />)}
      </div>
    </div>
  );
}
