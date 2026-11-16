"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readAccount, saveAccount, type Hours } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { pillBtn, SettingsCard } from "@/components/SettingsCard";
import { TimeField } from "@/components/TimeField";

// Figma: "Ish boshlash vaqti" / "Ish tugash vaqti"
export default function HoursSettings() {
  const router = useRouter();
  const toast = useToast();
  const [h, setH] = useState<Partial<Hours> | null>(null);
  useEffect(() => setH(readAccount()?.hours ?? {}), []);
  const back = () => router.push("/panel/sozlamalar/profil");

  const save = async () => {
    if (!h?.from || !h.to) return toast("Ish boshlash va tugash vaqtini tanlang");
    if (h.from === h.to) return toast("Boshlash va tugash vaqti bir xil bo‘lmasin");
    if (!(await saveAccount({ hours: { from: h.from, to: h.to } }))) return toast("Saqlab bo‘lmadi");
    toast("Ish vaqti saqlandi");
    back();
  };

  if (!h) return null;
  return (
    <SettingsCard title="Ish vaqti" onBack={back} action={<button type="button" disabled={!h.from || !h.to} onClick={save} className={pillBtn}>Tasdiqlash</button>}>
      <div className="mx-auto w-full max-w-[356.5px] pt-2 sm:pt-[18px]">
        <TimeField label="Ish boshlash vaqti" value={h.from} onChange={(v) => setH({ ...h, from: v })} />
        <TimeField label="Ish tugash vaqti" value={h.to} onChange={(v) => setH({ ...h, to: v })} className="mt-[22.5px]" />
        {h.from && h.to && h.to < h.from && <p className="mt-[12px] text-[14px] text-[#646464]">Tugash ertasi kuni — tungi ish vaqti.</p>}
      </div>
    </SettingsCard>
  );
}
