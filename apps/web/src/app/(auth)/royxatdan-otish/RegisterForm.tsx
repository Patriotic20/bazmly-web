"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlagUz } from "@/components/ui/FlagUz";

// 90 123 45 67 ko'rinishida formatlaydi
function formatPhone(digits: string) {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export const PHONE_KEY = "bazmly:pending-phone";

export function RegisterForm() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showSoon = (name: string) => {
    setToast(`${name} orqali kirish tez orada qo‘shiladi`);
    setTimeout(() => setToast(null), 2500);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.length !== 9) {
      setError("Telefon raqamini to‘liq kiriting");
      return;
    }
    try { sessionStorage.setItem(PHONE_KEY, `+998${digits}`); } catch {}
    router.push("/royxatdan-otish/kod");
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="relative mt-[20px] w-full max-w-[416px] rounded-[20px] border-2 border-[#D0D0D0] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] px-4 pb-6 pt-6 sm:px-[18px] sm:pb-[28px] sm:pt-[28px]"
    >
      <div className="flex w-full flex-col gap-4 sm:gap-[20px]">
        <div className="flex gap-2 sm:gap-[10px]">
          <div className="flex h-[55px] w-[104px] shrink-0 items-center gap-[8px] rounded-[16px] border border-[#D0D5DD] dark:border-[#6C6C6C] bg-[#FDFAFE] dark:bg-[#2C2C2C] pl-[12px] sm:w-[121px] sm:gap-[10px] sm:pl-[16px]">
            <FlagUz className="size-[26px] shrink-0 sm:size-[29px]" />
            <span className="text-[18px] leading-[20px] text-[#101828] dark:text-[#FFFFFF] sm:text-[20px]">+998</span>
          </div>
          <label className="sr-only" htmlFor="phone">Telefon raqami</label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="Telefon raqami"
            value={formatPhone(digits)}
            onChange={(e) => {
              setDigits(e.target.value.replace(/\D/g, "").slice(0, 9));
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "phone-error" : undefined}
            className={`h-[55px] w-full min-w-0 flex-1 rounded-[16px] border bg-[#FDFAFE] dark:bg-[#2C2C2C] px-[14px] text-[18px] leading-[20px] sm:px-[16px] sm:text-[20px] text-[#101828] dark:text-[#FFFFFF] outline-none placeholder:text-[#98A2B3] dark:placeholder:text-[#8A8A8A] focus:border-brand ${
              error ? "border-red-500" : "border-[#D0D5DD] dark:border-[#6C6C6C]"
            }`}
          />
        </div>

        <button
          type="button"
          onClick={() => showSoon("Apple")}
          className="flex h-[55px] w-full items-center justify-center gap-[12px] rounded-[16px] border border-[#EAECF0] dark:border-[#6C6C6C] bg-[#FDFAFE] dark:bg-[#2C2C2C] text-[18px] font-semibold sm:gap-[14px] sm:text-[20px] leading-[20px] text-black dark:text-[#FFFFFF] transition-colors hover:bg-[#F6F3F8] dark:hover:bg-[#393939]"
        >
          <Image src="/icons/apple.png" alt="" width={23} height={27} className="dark:invert" />
          Continue with Apple
        </button>

        <button
          type="button"
          onClick={() => showSoon("Google")}
          className="flex h-[55px] w-full items-center justify-center gap-[12px] rounded-[16px] border border-[#EAECF0] dark:border-[#6C6C6C] bg-[#FDFAFE] dark:bg-[#2C2C2C] text-[18px] font-semibold sm:gap-[14px] sm:text-[20px] leading-[20px] text-black dark:text-[#FFFFFF] transition-colors hover:bg-[#F6F3F8] dark:hover:bg-[#393939]"
        >
          <Image src="/icons/google.png" alt="" width={28} height={27} />
          Continue with Google
        </button>

        {error && (
          <p id="phone-error" role="alert" className="-mt-2 text-[14px] text-red-600">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="mx-auto mt-10 block h-[55px] w-full max-w-[357px] rounded-[16px] bg-brand text-[22px] font-medium sm:mt-[100px] sm:text-[24px] text-[#FCFCFD] transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Tasdiqlash
      </button>

      {toast && (
        <div role="status" className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-[14px] text-white">
          {toast}
        </div>
      )}
    </form>
  );
}
