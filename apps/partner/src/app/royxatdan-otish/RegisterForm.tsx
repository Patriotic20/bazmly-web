"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { addressText, clearDraft, isSignedIn, readDraft, saveDraft, type VenueKind } from "@bazmly/api/partner";
import { ChevronRightIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { fieldLabel, PartnerCard, primaryBtn } from "@/components/PartnerCard";

const KINDS: { id: VenueKind; label: string }[] = [
  { id: "restoran", label: "Restoran" },
  { id: "toyxona", label: "To‘yxona" },
];

// Figma: "Registratsiya" — joy nomi, faoliyat turi, manzil
export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<VenueKind | null>(null);
  const [addr, setAddr] = useState("");
  const [touched, setTouched] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // "Akkaunt qo'shish" (Sozlamalar): tur oldindan tanlangan, telefon so'ralmaydi
    const q = params.get("qoshish");
    if ((q === "restoran" || q === "toyxona") && isSignedIn()) {
      const cur = readDraft();
      if (!cur.adding || cur.kind !== q) { clearDraft(); saveDraft({ kind: q, adding: true }); }
    }
    const d = readDraft();
    setAdding(!!d.adding);
    const t = params.get("turi");
    const k = d.kind ?? (t === "toyxona" || t === "restoran" ? t : null);
    setName(d.name ?? ""); setKind(k); setAddr(addressText(d.address));
    if (k && !d.kind) saveDraft({ kind: k });
  }, [params]);

  const title = kind === "toyxona" ? "To‘yxonangizni kiriting" : "Restoraningizni kiriting";
  const ok = name.trim().length >= 2 && !!kind && !!addr;

  const next = () => {
    setTouched(true);
    if (name.trim().length < 2) return toast("Joy nomini kiriting");
    if (!kind) return toast("Faoliyat turini tanlang");
    if (!addr) return toast("Manzilni kiriting");
    saveDraft({ name: name.trim(), kind });
    router.push("/royxatdan-otish/joylar");
  };

  return (
    <PartnerCard title={adding ? "Yangi akkaunt" : "Registratsiya"} onBack={() => { if (adding) { clearDraft(); router.push("/panel/sozlamalar"); } else router.push("/"); }} action={<button type="button" onClick={next} className={primaryBtn}>Tasdiqlash</button>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); next(); }} className="mx-auto w-full max-w-[356.5px] sm:pt-[113.5px] sm:fit-tight:pt-[12px]">
        <h2 className="text-[22px] font-bold leading-[30px] text-black sm:text-[24px]">{title}</h2>
        <p className="mt-[11px] max-w-[250px] text-[16px] leading-[20px] text-black">Ma‘lumotlarni to‘g‘ri kiritilishiga e‘tiborli bo‘ling!</p>

        <label className="mt-[42px] block">
          <span className={fieldLabel}>Joyingiz nomini kiriting</span>
          <input
            value={name} placeholder="Yozish" autoComplete="organization"
            onChange={(e) => { setName(e.target.value); saveDraft({ name: e.target.value }); }}
            aria-invalid={touched && name.trim().length < 2}
            className={`mt-[15.5px] h-[55px] w-full rounded-[16px] border bg-white px-[16px] text-[20px] text-black outline-none transition-colors placeholder:text-[#98A2B3] focus:border-brand ${touched && name.trim().length < 2 ? "border-red-500" : "border-[#D0D5DD]"}`}
          />
        </label>

        <fieldset className="mt-[22.5px]">
          <legend className={fieldLabel}>Faoliyat turini tanlang</legend>
          <div role="radiogroup" aria-label="Faoliyat turi" className="mt-[15.5px] flex flex-wrap gap-x-[16.5px] gap-y-[20px]">
            {KINDS.filter((k) => !adding || k.id === kind).map((k) => {
              const on = kind === k.id;
              return (
                <button
                  key={k.id} type="button" role="radio" aria-checked={on}
                  onClick={() => { if (adding) return; const v = on ? null : k.id; setKind(v); saveDraft({ kind: v ?? undefined }); }}
                  className={`flex h-[42px] items-center gap-[7px] rounded-full border pl-[14px] pr-[8px] text-[18px] transition-colors ${on ? "border-brand bg-brand text-white" : "border-[#D0D5DD] bg-white text-[#1F1F1F] hover:border-brand/60"}`}
                >
                  {k.label}
                  {on ? (
                    <span className="grid size-[22px] place-items-center rounded-full bg-white text-brand">
                      <svg viewBox="0 0 12 12" className="size-[10px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
                    </span>
                  ) : (
                    <span className="size-[22px] rounded-full border-[1.5px] border-[#1F1F1F] bg-[#FBFAFF]" />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-[22.5px]">
          <span className={fieldLabel}>Manzilni kiritish</span>
          <button
            type="button" onClick={() => { saveDraft({ name: name.trim(), kind: kind ?? undefined }); router.push("/royxatdan-otish/manzil"); }}
            className={`mt-[15.5px] flex h-[55px] w-full items-center justify-between gap-3 rounded-[16px] border bg-white pl-[16px] pr-[20px] text-left transition-colors hover:border-brand/60 ${touched && !addr ? "border-red-500" : "border-[#D0D5DD]"}`}
          >
            <span className={`truncate ${addr ? "text-[16px] text-black" : "text-[20px] text-black"}`}>{addr || "Manzilni kiriting"}</span>
            <ChevronRightIcon className="h-[22px] w-[11px] shrink-0 text-black" />
          </button>
        </div>
        <button type="submit" hidden disabled={!ok} />
      </form>
    </PartnerCard>
  );
}
