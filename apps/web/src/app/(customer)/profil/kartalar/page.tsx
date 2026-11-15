import type { Metadata } from "next";
import { Suspense } from "react";
import { CardsView } from "@/components/profile/CardsView";

export const metadata: Metadata = { title: "Mening kartalarim — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <CardsView />
    </Suspense>
  );
}
