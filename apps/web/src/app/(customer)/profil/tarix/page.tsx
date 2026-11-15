import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryView } from "@/components/profile/HistoryView";

export const metadata: Metadata = { title: "Tarix — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <HistoryView />
    </Suspense>
  );
}
