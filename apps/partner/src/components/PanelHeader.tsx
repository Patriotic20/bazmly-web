"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ACCOUNT_EVENT, readAccount } from "@bazmly/api/partner";
import { BazmlyLogo } from "@bazmly/ui/BazmlyLogo";
import { BookmarkTickIcon, SearchIcon } from "@bazmly/ui/icons";
import { VenueAvatar } from "./VenueAvatar";

type NavItem = { href: string; label: string; w: number };
const NAV: NavItem[] = [
  { href: "/panel", label: "Asosiy", w: 187 },
  { href: "/panel/buyurtmalar", label: "Buyurtmalar", w: 158 },
  { href: "/panel/menyu", label: "Menyu", w: 187 },
  { href: "/panel/hodimlar", label: "Hodimlar", w: 187 },
];
// To'yxona: CRM bo'limlari (restoran bo'limlari o'rniga)
const NAV_HALL: NavItem[] = [
  { href: "/panel", label: "Asosiy", w: 140 },
  { href: "/panel/toyxona", label: "Kalendar", w: 140 },
  { href: "/panel/toyxona/bronlar", label: "Bronlar", w: 140 },
  { href: "/panel/toyxona/tolovlar", label: "To‘lovlar", w: 140 },
  { href: "/panel/hodimlar", label: "Hodimlar", w: 140 },
];
// Restoran + to'yxona
const NAV_BOTH: NavItem[] = [
  { href: "/panel", label: "Asosiy", w: 150 },
  { href: "/panel/buyurtmalar", label: "Buyurtmalar", w: 150 },
  { href: "/panel/menyu", label: "Menyu", w: 130 },
  { href: "/panel/toyxona", label: "To‘yxona", w: 140 },
  { href: "/panel/hodimlar", label: "Hodimlar", w: 140 },
];
function useNav() {
  const [kind, setKind] = useState<string | undefined>();
  useEffect(() => {
    const sync = () => setKind(readAccount()?.kind);
    sync();
    window.addEventListener(ACCOUNT_EVENT, sync);
    return () => window.removeEventListener(ACCOUNT_EVENT, sync);
  }, []);
  return kind === "toyxona" ? NAV_HALL : kind === "barchasi" ? NAV_BOTH : NAV;
}
const LIST = "/panel/kutilayotgan";
const isHall = () => { try { return readAccount()?.kind === "toyxona"; } catch { return false; } };
const STAFF = "/panel/hodimlar";

function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => { setQ(params.get("q") ?? ""); }, [params]);

  // Qidiruv: Hodimlar / Buyurtmalar / Menyu sahifalarida — o'sha sahifada, boshqa joyda — "Kutilayotgan mijozlar" ro'yxatida
  const target = [STAFF, "/panel/buyurtmalar", "/panel/menyu"].includes(pathname) ? pathname
    // To'yxona: qidiruv bronlar (mijoz ismi / telefon) bo'yicha
    : pathname.startsWith("/panel/toyxona") || isHall() ? "/panel/toyxona/bronlar" : LIST;
  const apply = (value: string) => {
    const sp = new URLSearchParams(pathname === target ? params.toString() : "");
    if (value.trim()) sp.set("q", value.trim()); else sp.delete("q");
    const url = `${target}${sp.size ? `?${sp}` : ""}`;
    if (pathname === target) router.replace(url, { scroll: false }); else router.push(url);
  };

  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); apply(q); }}
      className={`flex h-12 min-w-0 items-center gap-3 rounded-[12px] bg-[#F3F3F3] px-[14px] md:h-[56px] md:gap-[16px] ${className}`}>
      <SearchIcon className="size-[22px] shrink-0 text-brand md:size-[24px]" />
      <input
        type="search" value={q} placeholder="Qidirish" aria-label={target === STAFF ? "Hodim ismi, telefon yoki lavozim bo‘yicha qidirish" : target === "/panel/menyu" ? "Taom qidirish" : target === "/panel/toyxona/bronlar" ? "Bron: mijoz ismi yoki telefon bo‘yicha qidirish" : "Mijoz, telefon yoki stol bo‘yicha qidirish"}
        onChange={(e) => { setQ(e.target.value); if (pathname === target) apply(e.target.value); }}
        className="h-full w-full min-w-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-[#7A7A7A] [&::-webkit-search-cancel-button]:hidden"
      />
    </form>
  );
}

function Search({ className = "" }: { className?: string }) {
  return (
    <div className={`flex min-w-0 items-center ${className}`}>
      <Suspense fallback={<div className="h-12 flex-1 rounded-[12px] bg-[#F3F3F3] md:h-[56px]" />}>
        <SearchBox className="flex-1" />
      </Suspense>
    </div>
  );
}

function Nav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const nav = useNav();
  const hall = nav === NAV_HALL;
  return (
    <nav aria-label="Panel menyusi" className={`no-scrollbar flex gap-2 overflow-x-auto md:gap-3 hd:gap-[19px] hd:overflow-visible ${className}`}>
      {nav.map((n) => {
        // "Kutilayotgan mijozlar" va "Filiallar" — Asosiy bo'limiga tegishli
        const active = n.href === "/panel" ? pathname === "/panel" || pathname.startsWith(LIST) || pathname.startsWith("/panel/filiallar")
          : n.href === "/panel/toyxona" && hall ? pathname === "/panel/toyxona" || ["/panel/toyxona/paketlar", "/panel/toyxona/eslatmalar", "/panel/toyxona/hisobot"].some((x) => pathname.startsWith(x))
          : n.href === "/panel/toyxona/bronlar" ? pathname.startsWith("/panel/toyxona/bron") || pathname.startsWith("/panel/toyxona/tadbir")
          : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href} href={n.href} aria-current={active ? "page" : undefined}
            style={{ ["--w" as string]: `${n.w}px` }}
            className={`flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-brand px-4 text-[14px] transition-colors md:h-10 md:px-5 md:text-[16px] xl:text-[18px] hd:h-[43px] hd:w-(--w) hd:px-0 hd:text-[22px] ${
              active ? "bg-brand text-white" : "bg-white text-black hover:bg-brand-50"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Actions() {
  const pathname = usePathname();
  return (
    <div className="flex shrink-0 items-center gap-3 md:gap-[20px]">
      <Link href={LIST} aria-label={isHall() ? "Kutilayotgan tadbirlar" : "Kutilayotgan mijozlar"} className="text-[#797979] hover:text-brand">
        <BookmarkTickIcon className="size-7 md:size-[35px]" />
      </Link>
      <Link href="/panel/sozlamalar" aria-label="Sozlamalar" aria-current={pathname.startsWith("/panel/sozlamalar") ? "page" : undefined}
        className="block size-10 overflow-hidden rounded-full md:size-[56px]">
        <VenueAvatar className="size-full" />
      </Link>
    </div>
  );
}

const Logo = () => (
  <Link href="/panel" aria-label="Bazmly — panel" className="shrink-0 text-brand">
    <BazmlyLogo className="h-[30px] w-auto md:h-[40px] md:w-[164.5px]" />
  </Link>
);

/*
 * Figma (1920): bitta qator — logo · qidiruv+filtr · menyu · ikonlar (1700px).
 * xl dan kichikda: logo·ikonlar / qidiruv / menyu (gorizontal suriladi).
 */
export function PanelHeader() {
  return (
    <header className="container-wide shrink-0 print:hidden pt-4 md:pt-6 hd:pt-[min(60px,5.556svh)]">
      <div className="hidden h-[56px] items-center justify-between gap-6 xl:flex">
        <div className="flex min-w-0 flex-1 items-center gap-8 hd:flex-none hd:gap-[61px]">
          <Logo />
          <Search className="w-full max-w-[548px] hd:w-[548px]" />
        </div>
        <Nav />
        <Actions />
      </div>
      <div className="flex flex-col gap-4 xl:hidden">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Actions />
        </div>
        <Search />
        <Nav className="-mx-4 px-4 md:-mx-6 md:px-6" />
      </div>
    </header>
  );
}
