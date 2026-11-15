"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDays, fromIso, iso, MONTHS_SHORT, readBookings, type PartnerBooking } from "@bazmly/api/partnerBookings";
import { SettingsCard } from "@/components/SettingsCard";

// Figma'da chizilmagan: bronlar bo'yicha xabarlar — yangi bronlar va bekor qilinganlar (yangilari tepada)
const dayLabel = (d: string) => {
  const t = new Date();
  if (d === iso(t)) return "Bugun";
  if (d === iso(addDays(t, 1))) return "Ertaga";
  if (d === iso(addDays(t, -1))) return "Kecha";
  const x = fromIso(d);
  return `${x.getDate()} ${MONTHS_SHORT[x.getMonth()]}`;
};

export default function Notifications() {
  const router = useRouter();
  const [list, setList] = useState<PartnerBooking[] | null>(null);
  useEffect(() => {
    const today = iso(new Date());
    setList(readBookings().filter((b) => b.status === "bekor" || (b.status === "kutilmoqda" && b.date >= today)).slice(-30).reverse());
  }, []);

  return (
    <SettingsCard title="Xabarlar" onBack={() => router.push("/panel/sozlamalar")}>
      <ul className="mx-auto w-full max-w-[560px] space-y-[12px] pt-2 sm:max-h-[600px] sm:fit-tight:max-h-[440px] sm:overflow-y-auto sm:px-2 sm:pt-[17px]">
        {list?.map((b) => {
          const cancel = b.status === "bekor";
          return (
            <li key={b.id}>
              <Link href={`/panel/kutilayotgan?sana=${b.date}&q=${encodeURIComponent(b.name)}`} className="flex items-start gap-[14px] rounded-[16px] bg-[#F7F7F7] px-[16px] py-[14px] transition-colors hover:bg-[#F0F0F0]">
                <span className={`mt-[6px] size-[10px] shrink-0 rounded-full ${cancel ? "bg-[#F12828]" : "bg-brand"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold leading-[22px] text-black">{cancel ? "Bron bekor qilindi" : "Yangi bron"}</span>
                  <span className="mt-[2px] block text-[14px] leading-[20px] text-[#555]">
                    {b.name} · {b.people} kishi · {b.table.replace(/\s*\(.*\)/, "")}
                  </span>
                </span>
                <span className="shrink-0 pt-[2px] text-right text-[13px] leading-[18px] text-[#8D8D8D] tabular-nums">{dayLabel(b.date)}<br />{b.time}</span>
              </Link>
            </li>
          );
        })}
        {list && !list.length && <li className="py-16 text-center text-[15px] text-[#8D8D8D]">Hozircha xabar yo‘q</li>}
      </ul>
    </SettingsCard>
  );
}
