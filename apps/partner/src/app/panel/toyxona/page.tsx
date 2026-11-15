import type { Metadata } from "next";
import { Suspense } from "react";
import { HallCalendar } from "./HallCalendar";

export const metadata: Metadata = { title: "Kalendar — Bazmly hamkor" };

export default function Page() {
  return <Suspense><HallCalendar /></Suspense>;
}
