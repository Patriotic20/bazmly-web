"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthCard, primaryBtn } from "@/components/auth/AuthCard";
import { PHONE_KEY } from "../RegisterForm";

const LEN = 6;
const COOLDOWN = 60;

export function CodeForm() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(LEN).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(COOLDOWN);
  const [toast, setToast] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Telefon raqamisiz bu sahifaga kirilsa — orqaga
  useEffect(() => {
    let phone: string | null = null;
    try { phone = sessionStorage.getItem(PHONE_KEY); } catch {}
    if (!phone) router.replace("/royxatdan-otish");
    else refs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const fill = (start: number, digits: string) => {
    const next = [...code];
    let i = start;
    for (const d of digits) {
      if (i >= LEN) break;
      next[i++] = d;
    }
    setCode(next);
    setError(null);
    refs.current[Math.min(i, LEN - 1)]?.focus();
  };

  const onChange = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      const next = [...code];
      next[i] = "";
      setCode(next);
      return;
    }
    fill(i, digits);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      e.preventDefault();
      const next = [...code];
      next[i - 1] = "";
      setCode(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const resend = () => {
    if (left > 0) return;
    // TODO: backend — POST /auth/send-code
    setLeft(COOLDOWN);
    setToast("Kod qayta yuborildi");
    setTimeout(() => setToast(null), 2500);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.join("");
    if (value.length !== LEN) {
      setError("Kodni to‘liq kiriting");
      refs.current[code.findIndex((d) => !d)]?.focus();
      return;
    }
    // TODO: backend — POST /auth/verify-code; hozircha istalgan 6 xonali kod qabul qilinadi
    router.push("/royxatdan-otish/ism");
  };

  return (
    <AuthCard onSubmit={submit}>
      <div>
        <button
          type="button"
          onClick={() => router.push("/royxatdan-otish")}
          aria-label="Yopish"
          className="grid size-[18px] place-items-center text-black dark:text-[#FFFFFF]"
        >
          <svg viewBox="0 0 18 18" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M1 1l16 16M17 1L1 17" />
          </svg>
        </button>

        <h1 className="mt-[20px] text-[26px] font-bold leading-[1.25] tracking-[-0.01em] text-black dark:text-[#FFFFFF] sm:whitespace-nowrap sm:text-[32px] sm:leading-[40px]">
          Send verification
          <br className="hidden sm:block" />{" "}
          code
        </h1>
        <p className="mt-[10px] text-[16px] leading-[1.4] text-black dark:text-[#FFFFFF] sm:whitespace-nowrap sm:text-[20px] sm:leading-[25px] sm:tracking-[-0.3px]">
          We’ll send a code to your
          <br className="hidden sm:block" />{" "}
          phone number to verify your account.
        </p>

        <div className="mt-[20px] flex justify-between gap-1.5" role="group" aria-label="Tasdiqlash kodi">
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LEN}
              aria-label={`${i + 1}-raqam`}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              onPaste={(e) => {
                e.preventDefault();
                fill(i, e.clipboardData.getData("text").replace(/\D/g, ""));
              }}
              className={`h-[56px] w-full min-w-0 max-w-[55px] flex-1 rounded-[12px] border sm:h-[62px] bg-[#FDFAFE] dark:bg-[#2C2C2C] text-center text-[24px] font-medium text-brand caret-brand outline-none transition-colors focus:border-brand dark:text-white dark:caret-white dark:focus:border-white ${
                d ? "border-brand dark:border-white" : error ? "border-red-500" : "border-[#D0D5DD] dark:border-[#6C6C6C]"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={resend}
          disabled={left > 0}
          className="mt-[20px] block h-[20px] w-full text-center text-[16px] font-medium leading-[20px] text-brand disabled:text-brand/60 dark:text-white dark:disabled:text-white/60"
        >
          Resent code{left > 0 ? ` (${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")})` : ""}
        </button>

        {error && (
          <p role="alert" className="mt-[12px] text-center text-[14px] text-red-600">{error}</p>
        )}
      </div>

      <button type="submit" className={`mt-10 sm:mt-[111px] ${primaryBtn}`}>
        Next
      </button>

      {toast && (
        <div role="status" className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-[14px] text-white">
          {toast}
        </div>
      )}
    </AuthCard>
  );
}
