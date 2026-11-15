import type { Metadata } from "next";
import { Suspense } from "react";
import { Reminders } from "./Reminders";

export const metadata: Metadata = { title: "Eslatmalar — Bazmly hamkor" };

export default function Page() {
  return <Suspense><Reminders /></Suspense>;
}
