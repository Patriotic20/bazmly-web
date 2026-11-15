import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = { title: "Profil — Bazmly" };

export default function Page() {
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  );
}
