"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveDraft } from "@bazmly/api/partner";
import { FlagUz } from "@bazmly/ui/FlagUz";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { useDraft } from "@/components/useDraft";

const fmt = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");

// Figma: "Akkaunt yaratish" — telefon raqami (+998)
export default function PhonePage() {
  const router = useRouter();
  const draft = useDraft("vaqt");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (draft?.phone) setDigits(draft.phone.replace(/^\+998/, "")); }, [draft]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (digits.length !== 9) return setError("Telefon raqamni to‘liq kiriting");
    // TODO: backend — POST /auth/partner/otp
    saveDraft({ phone: `+998${digits}` });
    router.push("/royxatdan-otish/akkaunt/kod");
  };

  if (!draft) return null;
  return (
    <PartnerCard
      title="Akkaunt yaratish" smallTitle onBack={() => router.push("/royxatdan-otish/vaqt")}
      action={<button type="submit" form="phone-form" className={primaryBtn}>Tasdiqlash</button>}
    >
      <form id="phone-form" noValidate onSubmit={submit} className="mx-auto w-full max-w-[357.5px] sm:pt-[120px] sm:fit-tight:pt-[12px]">
        <div className="flex gap-2 sm:gap-[10px]">
          <div className="flex h-[56px] w-[104px] shrink-0 items-center gap-[8px] rounded-[16px] border border-[#D0D5DD] bg-[#FDFAFE] pl-[12px] sm:w-[121.5px] sm:gap-[10px] sm:pl-[16.5px]">
            <FlagUz className="size-[26px] shrink-0 sm:size-[29px]" />
            <span className="text-[18px] leading-[20px] text-[#101828] sm:text-[20px]">+998</span>
          </div>
          <label className="sr-only" htmlFor="phone">Telefon raqami</label>
          <input
            id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus placeholder="Telefon raqami"
            value={fmt(digits)}
            onChange={(e) => { setDigits(e.target.value.replace(/\D/g, "").slice(0, 9)); setError(null); }}
            aria-invalid={!!error} aria-describedby={error ? "phone-error" : undefined}
            className={`h-[56px] w-full min-w-0 flex-1 rounded-[16px] border bg-[#FDFAFE] px-[14px] text-[18px] leading-[20px] text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-brand sm:px-[16px] sm:text-[20px] tabular-nums ${
              error ? "border-red-500" : "border-[#D0D5DD]"
            }`}
          />
        </div>
        {error && <p id="phone-error" role="alert" className="mt-[10px] text-[14px] text-red-500">{error}</p>}
      </form>
    </PartnerCard>
  );
}
