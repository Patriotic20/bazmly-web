"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveDraft, type DayRange } from "@bazmly/api/partner";
import { DaysPicker } from "@/components/DaysPicker";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { useDraft } from "@/components/useDraft";

// Figma: "Vaqt sozlamalari" — hafta ish kunlari oralig'i (boshlanish va tugash kuni)
export default function DaysPage() {
  const router = useRouter();
  const draft = useDraft("joylar");
  const [days, setDays] = useState<DayRange | null | undefined>(undefined);
  const full = days === undefined ? draft?.days ?? null : days;

  const save = () => {
    if (!full) return;
    saveDraft({ days: full });
    router.push("/royxatdan-otish/vaqt");
  };

  if (!draft) return null;
  return (
    <PartnerCard
      title="Vaqt sozlamalari" onBack={() => router.push("/royxatdan-otish/vaqt")}
      action={<button type="button" disabled={!full} onClick={save} className={primaryBtn}>Tasdiqlash</button>}
    >
      <DaysPicker value={draft.days} onChange={setDays} className="mx-auto w-full max-w-[356.5px] sm:pt-[119px] sm:fit-tight:pt-[12px]" />
    </PartnerCard>
  );
}
