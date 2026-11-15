import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsView } from "@/components/profile/SettingsView";

export const metadata: Metadata = { title: "Sozlamalar — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <SettingsView />
    </Suspense>
  );
}
