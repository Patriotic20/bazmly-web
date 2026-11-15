import type { Metadata } from "next";
import { Suspense } from "react";
import { AddCardView } from "@/components/profile/CardsView";

export const metadata: Metadata = { title: "Karta qo‘shish — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <AddCardView />
    </Suspense>
  );
}
