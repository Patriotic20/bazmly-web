import type { Metadata } from "next";
import { Suspense } from "react";
import { Payments } from "./Payments";

export const metadata: Metadata = { title: "To‘lovlar — Bazmly hamkor" };

export default function Page() {
  return <Suspense><Payments /></Suspense>;
}
