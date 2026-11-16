"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isSignedIn, refreshAccounts } from "@bazmly/api/partner";
import { Screen } from "@bazmly/ui/Fit";
import { PanelHeader } from "@/components/PanelHeader";

// Figma'dagidek oddiy sahifa (pastga suriladi): uzun ro'yxatli bo'limlar
const SCROLL_PAGES = ["/panel/buyurtmalar", "/panel/menyu", "/panel/hodimlar", "/panel/toyxona/bron", "/panel/toyxona/tolovlar", "/panel/toyxona/paketlar", "/panel/toyxona/tadbir", "/panel/toyxona/eslatmalar", "/panel/toyxona/hisobot"];

// Hamkor paneli: faqat kirgan hamkor uchun — umumiy sarlavha (menyu) bilan
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => { if (!isSignedIn()) router.replace("/"); else { setOk(true); void refreshAccounts(); } }, [router]);
  if (!ok) return null;
  if (SCROLL_PAGES.includes(pathname)) return (
    <div className="min-h-svh pb-16">
      <PanelHeader />
      {children}
    </div>
  );
  return (
    // Kompyuterda: sarlavha joyida, sahifa qolgan balandlikka sig'adi (oyna pastga surilmaydi)
    <div className="min-h-svh pb-16 lg:flex lg:h-svh lg:min-h-0 lg:flex-col lg:overflow-hidden lg:pb-0">
      <PanelHeader />
      <Screen>{children}</Screen>
    </div>
  );
}
