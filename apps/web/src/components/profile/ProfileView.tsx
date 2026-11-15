"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BellIcon, ChevronRightIcon, ClockIcon, LocationIcon, LoginIcon, SupportIcon, TranslateIcon, WalletIcon,
} from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { readLocation, regionById } from "@bazmly/api/regions";
import { logout, useUser } from "@bazmly/api/user";
import { ConfirmSheet, ProfileFrame } from "./ProfileFrame";

export function UserAvatar({ src, size, className = "" }: { src?: string; size: number; className?: string }) {
  return (
    <span className={`relative block overflow-hidden rounded-full border border-[#EDEDED] dark:border-[#474747] bg-[#F2F2F2] dark:bg-[#393939] ${className}`} style={{ width: size, height: size }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="Profil rasmi" className="size-full object-cover" />
        : <Image src="/home/avatar.webp" alt="Profil rasmi" fill sizes={`${size}px`} className="object-cover" />}
    </span>
  );
}

export function locationText() {
  const l = readLocation();
  const r = regionById(l.region);
  return l.district ? `${r.short}, ${l.district}` : r.name;
}

// Figma: Profil — rasm, ism, joylashuv, ikki tugma va 6 bandli menyu
export function ProfileView() {
  const router = useRouter();
  const toast = useToast();
  const user = useUser();
  const [loc, setLoc] = useState("");
  const [sheet, setSheet] = useState(false);
  useEffect(() => setLoc(locationText()), []);

  const items: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }[] = [
    { label: "Xabarlar", icon: <BellIcon className="size-[22px]" />, href: "/profil/xabarlar" },
    { label: "Mening kartalarim", icon: <WalletIcon className="size-[22px]" />, href: "/profil/kartalar" },
    { label: "Tarix", icon: <ClockIcon className="size-[22px]" />, href: "/profil/tarix" },
    { label: "Tillar", icon: <TranslateIcon className="size-[20px]" />, href: "/profil/til" },
    { label: "Yordam", icon: <SupportIcon className="size-[24px]" />, onClick: () => toast("Yordam bo‘limi tez orada ishga tushadi") },
    { label: "Chiqish", icon: <LoginIcon className="size-[22px]" />, onClick: () => setSheet(true) },
  ];
  const row = "flex h-[44px] w-full items-center rounded-[10px] bg-[#F2F2F2] dark:bg-[#393939] pl-[11px] pr-[14px] text-left text-[16px] text-black dark:text-[#FFFFFF] transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#393939]";

  return (
    <ProfileFrame>
      <div className="flex flex-col items-center px-4 pb-8 pt-10 xl:pb-0 xl:pt-[82px] xl:fit-tight:pt-[25px]">
        <UserAvatar src={user?.avatar} size={149} />
        <h1 className="mt-[9px] text-[18px] font-semibold leading-[22px] text-black dark:text-[#FFFFFF]">{user?.name || "Foydalanuvchi"}</h1>
        <p className="mt-[10px] flex items-center gap-[10px] text-[14px] leading-[19px] text-black dark:text-[#FFFFFF]">
          <LocationIcon className="size-[19px] shrink-0" />{loc}
        </p>
        <div className="mt-[18.5px] flex gap-[17.5px]">
          <Link href="/profil/sozlamalar" className="grid h-[35px] w-[123px] place-items-center rounded-[8px] border border-brand text-[16px] text-brand transition-colors hover:bg-brand-50 dark:hover:bg-[#483126]">Tahrirlash</Link>
        </div>

        <nav aria-label="Profil menyusi" className="mt-[50px] xl:fit-tight:mt-[20px] w-full max-w-[343.5px] rounded-[20px] border border-[#EFEFEF] dark:border-[#474747] bg-white dark:bg-[#2C2C2C] px-[16.5px] py-[13px]">
          <ul className="space-y-[20px] xl:fit-tight:space-y-[12px]">
            {items.map((it) => {
              const inner = (
                <>
                  <span className="grid w-[24px] shrink-0 place-items-center text-[#8C8C8C] dark:text-[#B0B0B0]">{it.icon}</span>
                  <span className="ml-[19px] flex-1">{it.label}</span>
                  <ChevronRightIcon className="h-[17px] w-[9px] text-black dark:text-[#FFFFFF]" />
                </>
              );
              return (
                <li key={it.label}>
                  {it.href ? <Link href={it.href} className={row}>{inner}</Link> : <button type="button" onClick={it.onClick} className={row}>{inner}</button>}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {sheet && (
        <ConfirmSheet
          title="Profildan chiqmoqchimisiz?" action="Profildan chiqish"
          icon={<LoginIcon className="size-[24px]" />}
          onClose={() => setSheet(false)}
          onConfirm={() => { logout(); router.replace("/onboarding"); }}
        />
      )}
    </ProfileFrame>
  );
}
