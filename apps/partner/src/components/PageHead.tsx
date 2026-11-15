"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@bazmly/ui/icons";

// Panel sahifalari sarlavhasi: orqaga · sarlavha · sana (Figma: "Kutilayotgan mijozlar", "Hodimlar")
export function PageHead({ title, subtitle, back = "/panel", right }: { title: string; subtitle: React.ReactNode; back?: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-[6px] md:gap-[13px]">
        <button type="button" onClick={() => router.push(back)} aria-label="Orqaga" className="-ml-[9px] mt-[1px] grid size-[40px] shrink-0 place-items-center rounded-full text-[#FF6A00] hover:bg-[#FFF0E5]">
          <ChevronLeftIcon className="h-[20px] w-[10px]" />
        </button>
        <div>
          <h1 className="font-sans text-[22px] font-bold leading-[30px] text-[#0F172A] md:text-[24px] md:leading-[32px]">{title}</h1>
          <p className="mt-[9px] font-inter text-[14px] leading-[20px] text-[#64748B]">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
