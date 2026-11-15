import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingSuccess } from "@/components/venue/BookingSuccess";

export const metadata: Metadata = { title: "Band qilish tasdiqlandi — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <BookingSuccess />
    </Suspense>
  );
}
