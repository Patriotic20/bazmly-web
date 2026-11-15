"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addressText, readAccount, type PartnerAccount } from "@bazmly/api/partner";
import { formatPhone, readBranches, readStaff, type Branch, type Staff } from "@bazmly/api/staff";
import { PlusIcon } from "@bazmly/ui/icons";
import { PageHead } from "@/components/PageHead";
import { PartnerCard } from "@/components/PartnerCard";
import { Avatar } from "../hodimlar/Staff";

const hh = (t: string) => t.replace(/^0(\d)/, "$1");

// Figma: filiallar bo'limi — filial bo'lmasa "Hozircha filiallar yo'q", aks holda ro'yxat
export default function Branches() {
  const router = useRouter();
  const [data, setData] = useState<{ acc: PartnerAccount | null; list: Branch[]; staff: Staff[] } | null>(null);
  useEffect(() => { setData({ acc: readAccount(), list: readBranches(), staff: readStaff() }); }, []);
  if (!data) return null;

  if (!data.list.length) {
    return (
      <PartnerCard inPanel title="Yangi filial qo‘shish" onBack={() => router.push("/panel")} className="overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="absolute left-[15px] top-[280px] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.05),transparent_68%)]" />
          <div className="absolute left-[275px] top-[405px] size-[440px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.10),transparent_66%)]" />
        </div>
        <div className="relative mx-auto flex max-w-[360px] flex-col items-center pt-10 text-center sm:pt-[192.5px] sm:fit-tight:pt-[12px]">
          <span className="grid size-[150px] place-items-center rounded-full bg-[#FFFAF7] sm:size-[183px]" aria-hidden>
            <svg viewBox="0 0 96 96" className="size-[80px] sm:size-[98px]" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 40.5c0-4.6 2.2-8.9 6-11.5L40.2 10.6a13.9 13.9 0 0115.6 0L82 29c3.8 2.6 6 6.9 6 11.5v30.8C88 80.5 80.5 88 71.3 88H24.7C15.5 88 8 80.5 8 71.3V40.5z" stroke="#FFC195" strokeWidth="7" />
              <path d="M33 70h30" stroke="#FF6A00" strokeWidth="6.5" />
            </svg>
          </span>
          <h2 className="mt-[39.5px] text-[22px] font-bold leading-[28px] text-[#111827]">Hozircha filiallar yo‘q</h2>
          <p className="mt-[16px] font-inter text-[14px] leading-[19px] text-[#6B7280]">
            Restoran tarmoqlarini boshqarishni boshlash<br className="hidden sm:block" /> uchun birinchi filialingizni qo‘shing.
          </p>
          <Link href="/panel/filiallar/yangi" className="mt-[40px] flex h-[56.5px] w-full max-w-[345px] items-center justify-center gap-[12px] rounded-full bg-[#FF6A00] text-[16px] font-medium text-white transition-colors hover:bg-[#F06300]">
            Birinchi filialni qo‘shish <PlusIcon className="size-[16px]" />
          </Link>
        </div>
      </PartnerCard>
    );
  }

  const { acc, list, staff } = data;
  const mgr = (id?: string) => staff.find((s) => s.id === id);
  return (
    <main className="container-page pt-8 font-sans md:pt-[55px] lg:flex lg:h-full lg:flex-col lg:pt-[min(55px,4svh)]">
      <PageHead title="Filiallar" subtitle={`Jami: ${list.length + 1} ta joy`} right={
        <Link href="/panel/filiallar/yangi" className="mt-[2px] flex h-[36px] shrink-0 items-center gap-[8px] rounded-full bg-[#FF6A00] px-[17px] text-[15px] text-white hover:bg-[#F06300]">Qo‘shish <PlusIcon className="size-[14px]" /></Link>
      } />
      <ul className="mt-[40px] grid content-start gap-[12px] md:grid-cols-2 lg:mt-[min(40px,3svh)] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-6">
        {acc && (
          <li className="rounded-[16px] border border-[#F3F4F6] bg-white p-5">
            <span className="rounded-[4px] bg-[#FFF0E5] px-2 py-0.5 text-[12px] text-[#FF6A00]">Asosiy</span>
            <p className="mt-2 text-[18px] font-semibold text-[#111827]">{acc.name}</p>
            <p className="mt-1 text-[14px] text-[#6B7280]">{addressText(acc.address)}</p>
            {acc.hours && <p className="mt-1 text-[14px] text-[#6B7280]">{hh(acc.hours.from)} – {hh(acc.hours.to)}</p>}
          </li>
        )}
        {list.map((b) => {
          const m = mgr(b.managerId);
          return (
            <li key={b.id} className="rounded-[16px] border border-[#F3F4F6] bg-white p-5">
              <p className="text-[18px] font-semibold text-[#111827]">{b.name}</p>
              <p className="mt-1 text-[14px] text-[#6B7280]">{b.address}</p>
              <p className="mt-1 text-[14px] text-[#6B7280]">{hh(b.from)} – {hh(b.to)} · <a className="hover:text-[#FF6A00]" href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a></p>
              {m && <p className="mt-3 flex items-center gap-2 text-[14px] text-[#111827]"><Avatar s={m} className="size-[24px] text-[10px]" />{m.name} · menejer</p>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
