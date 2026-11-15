"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readDraft, saveDraft, TABLE_SIZES, type Tables } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { TableCounts } from "@/components/TableCounts";

// Figma: "Joylar soni" — har bir sig'imdagi stollar soni
export default function TablesPage() {
  const router = useRouter();
  const toast = useToast();
  const [t, setT] = useState<Tables>({});
  useEffect(() => {
    const d = readDraft();
    if (!d.name || !d.kind || !d.address?.region) { router.replace("/royxatdan-otish"); return; }
    setT(d.tables ?? {});
  }, [router]);

  const set = (next: Tables) => { setT(next); saveDraft({ tables: next }); };
  const confirm = () => {
    if (!TABLE_SIZES.some((n) => (t[n] ?? 0) > 0)) return toast("Kamida bitta stol sonini kiriting");
    router.push("/royxatdan-otish/vaqt");
  };

  return (
    <PartnerCard title="Joylar soni" onBack={() => router.push("/royxatdan-otish")} action={<button type="button" onClick={confirm} className={primaryBtn}>Tasdiqlash</button>}>
      <TableCounts value={t} onChange={set} className="sm:pt-[118.5px] sm:fit-tight:pt-[12px]" />
    </PartnerCard>
  );
}
