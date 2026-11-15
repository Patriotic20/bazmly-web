import type { Metadata } from "next";
import { Suspense } from "react";
import { Reports } from "./Reports";

export const metadata: Metadata = { title: "Hisobotlar — Bazmly hamkor" };

export default function Page() {
  return <Suspense><Reports /></Suspense>;
}
