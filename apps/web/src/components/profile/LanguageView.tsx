"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGS, readLang, READY_LANGS, saveLang, type Lang } from "@bazmly/api/lang";
import { LangList } from "@bazmly/ui/LangList";
import { useToast } from "@bazmly/ui/Toast";
import { FrameButton, ProfileFrame } from "./ProfileFrame";

// Figma: "Til sozlamalari" — O'zbek / Ingliz / Rus tili, o'ng pastda "Tasdiqlash"
export function LanguageView() {
  const router = useRouter();
  const toast = useToast();
  const [lang, setLang] = useState<Lang | null>(null);
  useEffect(() => setLang(readLang()), []);

  const back = () => (window.history.length > 1 ? router.back() : router.push("/profil"));
  const submit = () => {
    if (!lang) return;
    saveLang(lang);
    toast(READY_LANGS.includes(lang) ? "Til saqlandi" : `${LANGS.find((l) => l.id === lang)?.label} tez orada qo‘shiladi — hozircha interfeys o‘zbek tilida`);
    back();
  };

  return (
    <ProfileFrame title="Til sozlamalari" onBack={back} footer={<FrameButton onClick={submit}>Tasdiqlash</FrameButton>}>
      {lang && <LangList items={LANGS} value={lang} onChange={setLang} className="px-4 pb-10 pt-10 sm:px-0 xl:pt-[222px] xl:fit-tight:pt-[67px]" />}
    </ProfileFrame>
  );
}
