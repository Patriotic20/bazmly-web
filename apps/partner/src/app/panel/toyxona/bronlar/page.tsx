import type { Metadata } from "next";
import { Suspense } from "react";
import { Pipeline } from "./Pipeline";

export const metadata: Metadata = { title: "Bronlar — Bazmly hamkor" };

export default function Page() {
  return <Suspense><Pipeline /></Suspense>;
}
