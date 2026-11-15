import type { Metadata } from "next";
import { Suspense } from "react";
import { EventDay } from "./EventDay";

export const metadata: Metadata = { title: "Tadbir rejasi — Bazmly hamkor" };

export default function Page() {
  return <Suspense><EventDay /></Suspense>;
}
