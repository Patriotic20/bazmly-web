"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readDraft, totalTables, type PartnerDraft } from "@bazmly/api/partner";

/** Ro'yxatdan o'tish bosqichlari ketma-ketligi: oldingi bosqich to'ldirilmagan bo'lsa — o'sha bosqichga qaytaradi */
export type Step = "nom" | "manzil" | "joylar" | "vaqt" | "telefon";

const missing = (d: PartnerDraft, upTo: Step): string | null => {
  if (!d.name || !d.kind) return "/royxatdan-otish";
  if (upTo === "nom") return null;
  if (!d.address?.region) return "/royxatdan-otish";
  if (upTo === "manzil") return null;
  if (!totalTables(d.tables)) return "/royxatdan-otish/joylar";
  if (upTo === "joylar") return null;
  if (!d.seats || !d.hours || !d.days || !d.minAdvance) return "/royxatdan-otish/vaqt";
  if (upTo === "vaqt") return null;
  if (!d.phone) return "/royxatdan-otish/akkaunt";
  return null;
};

/** `needs` — shu sahifa ochilishi uchun to'ldirilgan bo'lishi kerak bo'lgan oxirgi bosqich */
export function useDraft(needs: Step) {
  const router = useRouter();
  const [draft, setDraft] = useState<PartnerDraft | null>(null);
  useEffect(() => {
    const d = readDraft();
    const to = missing(d, needs);
    if (to) router.replace(to);
    else setDraft(d);
  }, [needs, router]);
  return draft;
}
