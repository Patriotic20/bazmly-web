import type { Metadata } from "next";
import { Suspense } from "react";
import { HallSettingsPage } from "./HallSettingsPage";

export const metadata: Metadata = { title: "Zallar va narxlar — Bazmly hamkor" };

export default function Page() {
  return <Suspense><HallSettingsPage /></Suspense>;
}
