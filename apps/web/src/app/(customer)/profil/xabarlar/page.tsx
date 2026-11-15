import type { Metadata } from "next";
import { Suspense } from "react";
import { NotificationsView } from "@/components/profile/NotificationsView";

export const metadata: Metadata = { title: "Xabarlar — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <NotificationsView />
    </Suspense>
  );
}
