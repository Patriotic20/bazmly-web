"use client";

import { usePathname } from "next/navigation";
import { Screen } from "@bazmly/ui/Fit";
import { SiteHeader } from "./SiteHeader";

// Ba'zi ekranlar (masalan, "Band qilish tasdiqlandi") Figma'da header'siz
const BARE = [/^\/bron\/tasdiqlandi/];

export function CustomerChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE.some((r) => r.test(pathname))) return <div className="min-h-screen bg-white dark:bg-[#2C2C2C]">{children}</div>;
  return (
    // Kompyuterda: sarlavha joyida, sahifa qolgan balandlikka sig'adi (oyna pastga surilmaydi)
    <div className="min-h-screen bg-white dark:bg-[#2C2C2C] pt-4 md:pt-6 lg:flex lg:h-svh lg:min-h-0 lg:flex-col lg:overflow-hidden xl:pt-[min(60px,5.556svh)]">
      <div className="shrink-0"><SiteHeader /></div>
      <Screen>{children}</Screen>
    </div>
  );
}
