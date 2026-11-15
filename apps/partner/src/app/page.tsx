"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isSignedIn } from "@bazmly/api/partner";
import { PartnerCard } from "@/components/PartnerCard";

const outline = "grid h-[55px] w-full place-items-center rounded-[16px] border-[1.5px] border-[#FF6A00] text-[18px] font-semibold text-[#FF6A00] transition-colors hover:bg-brand-50";

// Figma: hamkor paneli — kirish yoki restoran / to'yxona uchun akkaunt ochish
export default function Welcome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => { if (isSignedIn()) router.replace("/panel"); else setReady(true); }, [router]);
  if (!ready) return null;

  return (
    <PartnerCard>
      <div className="mx-auto flex w-full max-w-[326.5px] flex-col items-center py-16 text-center sm:pb-0 sm:pt-[212.5px] sm:fit-tight:pt-[12px]">
        <p className="text-[16px] font-semibold leading-[20px] text-black">Akkauntingiz allaqachon mavjudmi?</p>
        <Link href="/kirish" className="mt-[15px] grid h-[55px] w-full place-items-center rounded-[16px] bg-[#FF6A00] text-[18px] font-semibold text-white transition-colors hover:bg-brand">Kirish</Link>
        <hr className="mt-[30px] w-full border-[#B6B6B6]" />
        <p className="mt-[31.5px] text-[16px] font-semibold leading-[20px] text-black">Akkaunt ochmoqchimisiz?</p>
        <Link href="/royxatdan-otish?turi=restoran" className={`mt-[18.5px] ${outline}`}>Restoran uchun akkaunt</Link>
        <Link href="/royxatdan-otish?turi=toyxona" className={`mt-[20px] ${outline}`}>To‘yxona uchun akkaunt</Link>
      </div>
    </PartnerCard>
  );
}
