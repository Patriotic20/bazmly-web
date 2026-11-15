import { Suspense } from "react";
import { HomeView } from "@/components/home/HomeView";
import { SiteFooter } from "@/components/layout/SiteFooter";

// Figma: "Bazmly" 1920×3341 — Asosiy sahifa (3356:12795)
export default function HomePage() {
  return (
    <>
      <Suspense>
        <HomeView />
      </Suspense>
      <SiteFooter />
    </>
  );
}
