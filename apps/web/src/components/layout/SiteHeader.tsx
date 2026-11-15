"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BazmlyLogo } from "@bazmly/ui/BazmlyLogo";
import { BookmarkTickIcon, GlobeIcon, SearchIcon, SlidersIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { useUser } from "@bazmly/api/user";

const NAV = [
  { href: "/", label: "Asosiy", w: 186 },
  { href: "/band-qilingan-joylar", label: "Band qilingan joylar", w: 225 },
  { href: "/voucherlar", label: "Voucherlar", w: 186 },
];

function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => { setQ(params.get("q") ?? ""); }, [params]);

  const apply = (value: string) => {
    const url = value.trim() ? `/?q=${encodeURIComponent(value.trim())}` : "/";
    if (pathname === "/") router.replace(url, { scroll: false });
    else router.push(url);
  };

  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); apply(q); }}
      className={`flex h-12 min-w-0 items-center gap-3 rounded-[12px] bg-[#F3F3F3] dark:bg-[#393939] px-[14px] md:h-[56px] md:gap-[16px] ${className}`}
    >
      <SearchIcon className="size-[22px] shrink-0 text-brand dark:text-white md:size-[24px]" />
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); if (pathname === "/") apply(e.target.value); }}
        placeholder="Qidirish"
        aria-label="Restoran yoki to‘yxona qidirish"
        className="h-full w-full min-w-0 bg-transparent text-[16px] text-ink dark:text-[#FFFFFF] outline-none placeholder:text-[#7A7A7A] dark:placeholder:text-[#CDCDCD] [&::-webkit-search-cancel-button]:hidden"
      />
    </form>
  );
}

function Search({ className = "" }: { className?: string }) {
  const toast = useToast();
  return (
    <div className={`flex min-w-0 items-center gap-3 md:gap-[20px] ${className}`}>
      <Suspense fallback={<div className="h-12 flex-1 rounded-[12px] bg-[#F3F3F3] dark:bg-[#393939] md:h-[56px]" />}>
        <SearchBox className="flex-1" />
      </Suspense>
      <button
        type="button"
        onClick={() => toast("Filtrlar tez orada qo‘shiladi")}
        aria-label="Filtrlar"
        className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-brand text-white transition-colors hover:bg-brand-600 md:size-[56px]"
      >
        <SlidersIcon className="size-[26px] md:size-[30px]" />
      </button>
    </div>
  );
}

function Nav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Asosiy menyu" className={`no-scrollbar flex gap-2 overflow-x-auto md:gap-3 hd:gap-[20px] hd:overflow-visible ${className}`}>
      {NAV.map((n) => {
        // Restoran / to‘yxona sahifalari "Asosiy" bo‘limiga tegishli
        const active = n.href === "/" ? pathname === "/" || /^\/(restoranlar|toyxonalar)(\/|$)/.test(pathname) : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            style={{ ["--w" as string]: `${n.w}px` }}
            className={`flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-[1.5px] border-brand px-4 text-[14px] font-medium transition-colors md:h-10 md:px-5 md:text-[16px] xl:text-[17px] hd:h-[42px] hd:w-(--w) hd:px-0 hd:text-[20px] ${
              active ? "bg-brand text-white" : "bg-white dark:border-[#6C6C6C] dark:bg-[#393939] text-black dark:text-[#FFFFFF] hover:bg-brand-50 dark:hover:bg-[#483126]"
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
  return (
    <div className="flex shrink-0 items-center gap-3 md:gap-[20px]">
      <Link href="/saqlanganlar" aria-label="Saqlanganlar" className="text-[#797979] dark:text-white hover:text-brand">
        <BookmarkTickIcon className="size-7 md:size-[35px]" />
      </Link>
      <Link href="/profil/til" aria-label="Til" className="text-[#797979] dark:text-white hover:text-brand">
        <GlobeIcon className="size-7 md:size-[35px]" />
      </Link>
      <Link href="/profil" aria-label="Profil" className="block size-10 overflow-hidden rounded-full md:size-[56px]">
        <Avatar />
      </Link>
    </div>
  );
}

const Logo = () => (
  <Link href="/" aria-label="Bazmly — bosh sahifa" className="shrink-0 text-brand">
    <BazmlyLogo className="h-[30px] w-auto dark:text-white md:h-[40px] md:w-[165px]" />
  </Link>
);

/*
 * Figma (1920): bitta qator — logo · qidiruv+filtr · menyu · ikonlar (1700px).
 * xl–hd: bitta qator, menyu tugmalari ixchamroq.
 * lg–xl: 2 qator — logo·menyu·ikonlar / qidiruv.
 * mobil va planshet: 3 qator — logo·ikonlar / qidiruv / menyu (gorizontal suriladi).
 */
export function SiteHeader() {
  return (
    <header className="container-wide">
      {/* xl va kattaroq */}
      <div className="hidden h-[56px] items-center justify-between gap-6 xl:flex">
        <div className="flex min-w-0 flex-1 items-center gap-8 hd:flex-none hd:gap-[60px]">
          <Logo />
          <Search className="w-full max-w-[473px] hd:w-[473px]" />
        </div>
        <Nav />
        <Actions />
      </div>

      {/* xl dan kichik */}
      <div className="flex flex-col gap-4 xl:hidden">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Nav className="hidden lg:flex" />
          <Actions />
        </div>
        <Search />
        <Nav className="-mx-4 px-4 md:-mx-6 md:px-6 lg:hidden" />
      </div>
    </header>
  );
}

// Profil rasmi: foydalanuvchi yuklagan bo'lsa o'sha, aks holda namunaviy rasm
function Avatar() {
  const u = useUser();
  return u?.avatar
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={u.avatar} alt="" className="size-full object-cover" />
    : <Image src="/home/avatar.webp" alt="" width={56} height={56} className="size-full object-cover" />;
}
