import type { Metadata } from "next";
import { Suspense } from "react";
import { EventEditor } from "./EventEditor";

export const metadata: Metadata = { title: "Bron — Bazmly hamkor" };

export default function Page() {
  return <Suspense><EventEditor /></Suspense>;
}
