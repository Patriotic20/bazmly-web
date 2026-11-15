"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveDraft, type Hours } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { fieldLabel, PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { Select } from "@/components/Select";
import { useDraft } from "@/components/useDraft";

// Figma'da alohida chizilmagan: "Vaqt sozlamalari" uslubida — ochilish va yopilish vaqti (30 daqiqalik qadam)
const SLOTS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export default function HoursPage() {
  const router = useRouter();
  const toast = useToast();
  const draft = useDraft("joylar");
  const [h, setH] = useState<Partial<Hours>>({});
  useEffect(() => { if (draft?.hours) setH(draft.hours); }, [draft]);

  const save = () => {
    if (!h.from || !h.to) return toast("Ochilish va yopilish vaqtini belgilang");
    if (h.from === h.to) return toast("Ochilish va yopilish vaqti bir xil bo‘lmasin");
    saveDraft({ hours: { from: h.from, to: h.to } });
    router.push("/royxatdan-otish/vaqt");
  };

  if (!draft) return null;
  return (
    <PartnerCard
      title="Vaqt sozlamalari" onBack={() => router.push("/royxatdan-otish/vaqt")}
      action={<button type="button" disabled={!h.from || !h.to} onClick={save} className={primaryBtn}>Tasdiqlash</button>}
    >
      <div className="mx-auto w-full max-w-[356.5px] sm:pt-[119px] sm:fit-tight:pt-[12px]">
        <span className={fieldLabel}>Ish vaqtini belgilang</span>
        <Select className="mt-[16.5px]" label="Ochilish vaqti" value={h.from} options={SLOTS} onChange={(v) => setH({ ...h, from: v })} />
        <Select className="mt-[20px]" label="Yopilish vaqti" value={h.to} options={SLOTS} onChange={(v) => setH({ ...h, to: v })} />
        {h.from && h.to && h.to < h.from && (
          <p className="mt-[12px] text-[14px] text-[#646464]">Yopilish ertasi kuni — tungi ish vaqti.</p>
        )}
      </div>
    </PartnerCard>
  );
}
