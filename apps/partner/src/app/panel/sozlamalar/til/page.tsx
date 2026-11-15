"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGS, readLang, READY_LANGS, saveLang, type Lang } from "@bazmly/api/lang";
import { LangList } from "@bazmly/ui/LangList";
import { useToast } from "@bazmly/ui/Toast";
import { pillBtn, SettingsCard } from "@/components/SettingsCard";

// Figma: "Til sozlamalari" — O'zbek / Ingliz / Rus tili
export default function LanguageSettings() {
  const router = useRouter();
  const toast = useToast();
  const [lang, setLang] = useState<Lang | null>(null);
  useEffect(() => setLang(readLang()), []);
  const back = () => router.push("/panel/sozlamalar");

  const save = () => {
    if (!lang) return;
    saveLang(lang);
    toast(READY_LANGS.includes(lang) ? "Til saqlandi" : `${LANGS.find((l) => l.id === lang)?.label} tez orada qo‘shiladi — hozircha interfeys o‘zbek tilida`);
    back();
  };

  return (
    <SettingsCard title="Til sozlamalari" onBack={back} action={<button type="button" onClick={save} className={pillBtn}>Tasdiqlash</button>}>
      {lang && <LangList items={LANGS} value={lang} onChange={setLang} className="pt-6 sm:pt-[170px] sm:fit-tight:pt-[51px]" />}
    </SettingsCard>
  );
}
