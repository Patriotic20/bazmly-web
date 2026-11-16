"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { daysText, readAccount, saveAccount, type DayRange } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { DaysPicker } from "@/components/DaysPicker";
import { SettingsCard } from "@/components/SettingsCard";

// Figma: "Hafta davomidagi ish kunlarini kiriting" — "Belgilash" bosilganda saqlanadi
export default function DaysSettings() {
  const router = useRouter();
  const toast = useToast();
  const [days, setDays] = useState<DayRange | undefined | null>(null);
  useEffect(() => setDays(readAccount()?.days), []);
  const back = () => router.push("/panel/sozlamalar/profil");

  const save = async (r: DayRange) => {
    if (!(await saveAccount({ days: r }))) return toast("Saqlab bo‘lmadi");
    toast(`Ish kunlari saqlandi: ${daysText(r)}`);
    back();
  };

  if (days === null) return null;
  return (
    <SettingsCard title="Ish kunlari" onBack={back}>
      <DaysPicker value={days} onChange={() => {}} onDone={save} className="mx-auto w-full max-w-[356.5px] pt-2 sm:pt-[18px]" />
    </SettingsCard>
  );
}
