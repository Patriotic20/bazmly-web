"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readAccount, saveAccount, totalSeats, totalTables, type Tables } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { pillBtn, SettingsCard } from "@/components/SettingsCard";
import { TableCounts } from "@/components/TableCounts";

// Figma: "Stollar" — har bir sig'imdagi stollar soni; umumiy joylar soni shundan hisoblanadi
export default function TablesSettings() {
  const router = useRouter();
  const toast = useToast();
  const [t, setT] = useState<Tables | null>(null);
  useEffect(() => setT(readAccount()?.tables ?? {}), []);
  const back = () => router.push("/panel/sozlamalar/profil");

  const save = async () => {
    if (!t || !totalTables(t)) return toast("Kamida bitta stol sonini kiriting");
    if (!(await saveAccount({ tables: t, seats: totalSeats(t) }))) return toast("Saqlab bo‘lmadi");
    toast(`Saqlandi: ${totalTables(t)} ta stol, ${totalSeats(t)} ta joy`);
    back();
  };

  if (!t) return null;
  return (
    <SettingsCard title="Stollar" onBack={back} action={<button type="button" onClick={save} className={pillBtn}>Tasdiqlash</button>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TableCounts value={t} onChange={setT} className="pt-2 sm:pt-[37px]" />
        <button type="submit" hidden />
      </form>
    </SettingsCard>
  );
}
