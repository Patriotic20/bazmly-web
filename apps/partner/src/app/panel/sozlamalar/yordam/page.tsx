"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@bazmly/ui/icons";
import { SettingsCard } from "@/components/SettingsCard";

// Figma'da chizilmagan: tez-tez beriladigan savollar — har bir javob tegishli bo'limga olib boradi
const FAQ: { q: string; a: string; href: string; link: string }[] = [
  { q: "Menyuga taom qanday qo‘shiladi?", a: "Menyu bo‘limida “Taom qo‘shish”ni bosing: rasm, nom, narx va kategoriyani kiriting.", href: "/panel/menyu/yangi", link: "Taom qo‘shish" },
  { q: "Mijoz kelganini qanday belgilayman?", a: "“Kutilayotgan mijozlar” ro‘yxatida mijoz kartasidagi “Keldi” tugmasini bosing — stolga buyurtma ochiladi.", href: "/panel/kutilayotgan", link: "Kutilayotgan mijozlar" },
  { q: "Buyurtmani qanday yakunlayman?", a: "Buyurtmalar bo‘limida stolni tanlang va “Yakunlash”ni bosing.", href: "/panel/buyurtmalar", link: "Buyurtmalar" },
  { q: "Stollar sonini qanday o‘zgartiraman?", a: "Sozlamalar → Tahrirlash → umumiy joylar soni. Har bir sig‘imdagi stollar sonini kiriting.", href: "/panel/sozlamalar/stollar", link: "Stollar" },
  { q: "Ish vaqti va kunlarini qayerda o‘zgartiraman?", a: "Sozlamalar → Tahrirlash sahifasida ish vaqti, ish kunlari va minimal oldindan band qilish vaqti bor.", href: "/panel/sozlamalar/profil", link: "Tahrirlash" },
  { q: "Hodim qanday qo‘shiladi?", a: "Hodimlar bo‘limida “Hodim qo‘shish”ni bosing: ism, telefon va lavozimni kiriting.", href: "/panel/hodimlar/yangi", link: "Hodim qo‘shish" },
  { q: "Filial qanday qo‘shiladi?", a: "Asosiy sahifadagi “Restoranlar soni” kartasidan filiallar ro‘yxatiga o‘ting va yangi filial qo‘shing.", href: "/panel/filiallar/yangi", link: "Filial qo‘shish" },
];

export default function Help() {
  const router = useRouter();
  return (
    <SettingsCard title="Yordam" onBack={() => router.push("/panel/sozlamalar")}>
      <div className="mx-auto w-full max-w-[560px] space-y-[12px] pt-2 sm:pt-[17px]">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-[16px] bg-[#F7F7F7] px-[18px] open:bg-[#FFF6F0]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[15px] text-[16px] font-semibold text-black [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDownIcon className="size-[20px] shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-[16px] text-[15px] leading-[22px] text-[#444]">
              {f.a}{" "}
              <Link href={f.href} className="font-semibold text-brand hover:underline">{f.link} →</Link>
            </p>
          </details>
        ))}
      </div>
    </SettingsCard>
  );
}
