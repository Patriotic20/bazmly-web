"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createAccountRemote, daysText, hoursText, isSignedIn, readAccount, saveDraft, totalSeats, type AdvanceDays, type PartnerDraft } from "@bazmly/api/partner";
import { ChevronRightIcon } from "@bazmly/ui/icons";

const CloseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
);
import { useToast } from "@bazmly/ui/Toast";
import { fieldBox, fieldLabel, PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { useDraft } from "@/components/useDraft";

const KIND_WORD = { restoran: "Restorandagi", toyxona: "To‘yxonadagi", barchasi: "Muassasadagi" } as const;

// Figma: "Vaqt & Zal sozlamalari" — umumiy joylar, ish vaqti, ish kunlari, minimal oldindan band qilish
export default function SchedulePage() {
  const router = useRouter();
  const toast = useToast();
  const draft = useDraft("joylar");
  const [d, setD] = useState<PartnerDraft>({});

  useEffect(() => {
    if (!draft) return;
    // Joylar soni — stollar bo'yicha hisoblangan qiymat standart sifatida
    setD(draft.seats ? draft : saveDraft({ seats: totalSeats(draft.tables) || undefined }));
  }, [draft]);

  const patch = (p: PartnerDraft) => setD(saveDraft(p));
  const confirm = async () => {
    if (!d.seats) return toast("Umumiy joylar sonini kiriting");
    if (!d.hours) return toast("Ish vaqtini belgilang");
    if (!d.days) return toast("Ish kunlarini belgilang");
    if (!d.minAdvance) return toast("Minimal oldindan band qilish vaqtini tanlang");
    // Yangi akkaunt qo'shilmoqda: telefon allaqachon tasdiqlangan — darhol yaratiladi
    const owner = readAccount();
    if (d.adding && owner && isSignedIn()) {
      if (!(await createAccountRemote(owner.phone, true))) return toast("Akkauntni yaratib bo‘lmadi");
      return router.push("/royxatdan-otish/tayyor");
    }
    router.push("/royxatdan-otish/akkaunt");
  };

  if (!draft) return null;
  const seatsText = d.seats ? `${d.seats} ta` : "";
  return (
    <PartnerCard
      title="Vaqt & Zal sozlamalari" onBack={() => router.push("/royxatdan-otish/joylar")}
      action={<button type="button" onClick={confirm} className={primaryBtn}>Tasdiqlash</button>}
    >
      <div className="mx-auto w-full max-w-[356.5px] sm:pt-[119px] sm:fit-tight:pt-[12px]">
        <label className="block">
          <span className={`${fieldLabel} tracking-[-0.3px]`}>{KIND_WORD[d.kind ?? "restoran"]} umumiy joylar sonini kiriting</span>
          <input
            inputMode="numeric" aria-label="Umumiy joylar soni" placeholder="0 ta"
            value={seatsText}
            onChange={(e) => {
              let n = e.target.value.replace(/\D/g, "").slice(0, 5);
              // " ta" qo'shimchasi o'chirilsa (Backspace) — oxirgi raqam o'chiriladi
              if (e.target.value.length < seatsText.length && n === String(d.seats ?? "")) n = n.slice(0, -1);
              patch({ seats: n ? Number(n) : undefined });
            }}
            className={`${fieldBox} mt-[14.5px] text-[20px] font-medium outline-none placeholder:text-[#9A9A9A] focus:border-brand tabular-nums`}
          />
        </label>

        <span className={`${fieldLabel} tracking-[-0.3px] mt-[23.5px]`} id="lbl-hours">Ish vaqtini belgilang</span>
        <button type="button" aria-labelledby="lbl-hours" onClick={() => router.push("/royxatdan-otish/vaqt/soat")} className={`${fieldBox} mt-[14.5px] justify-between hover:border-brand`}>
          <span className={`text-[20px] font-medium ${d.hours ? "" : "text-[#9A9A9A]"}`}>{hoursText(d.hours) || "Belgilash"}</span>
          <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
        </button>

        <span className={`${fieldLabel} tracking-[-0.3px] mt-[23.5px]`} id="lbl-days">Ish kunlarini belgilang</span>
        <button type="button" aria-labelledby="lbl-days" onClick={() => router.push("/royxatdan-otish/vaqt/kunlar")} className={`${fieldBox} mt-[14.5px] justify-between hover:border-brand`}>
          <span className={`pt-[3px] text-[16px] font-medium ${d.days ? "" : "text-[#9A9A9A]"}`}>{daysText(d.days) || "Belgilash"}</span>
          <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
        </button>

        <span className={`${fieldLabel} tracking-[-0.3px] mt-[23.5px]`} id="lbl-adv">Minimal oldindan band qilish vaqti</span>
        <div role="radiogroup" aria-labelledby="lbl-adv" className="mt-[14.5px] grid grid-cols-3 gap-[12px] sm:gap-[25.5px]">
          {([1, 2, 3] as AdvanceDays[]).map((n) => {
            const on = d.minAdvance === n;
            return (
              <button
                key={n} type="button" role="radio" aria-checked={on}
                onClick={() => patch({ minAdvance: on ? undefined : n })}
                className={`flex h-[42px] items-center justify-between rounded-full border pl-[16px] pr-[5px] text-[16px] transition-colors sm:pl-[24px] ${
                  on ? "border-brand bg-brand text-white" : "border-[#D0D5DD] bg-white text-black hover:border-brand"
                }`}
              >
                {n} kun
                {on
                  ? <span className="grid size-[22px] place-items-center rounded-full bg-white text-brand" aria-hidden><CloseIcon className="size-[12px]" /></span>
                  : <span className="size-[22px] rounded-full border border-[#4D4D4D] bg-[#FAF8FC]" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
    </PartnerCard>
  );
}
