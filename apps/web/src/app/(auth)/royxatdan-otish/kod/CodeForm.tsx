"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthCard, primaryBtn, textInput } from "@/components/auth/AuthCard";
import { holdPassword, loginWithPassword, passwordError, phoneCheck, type PhoneCheckResult } from "@bazmly/api/auth";
import { errorText } from "@bazmly/api/client";
import { syncMe } from "@bazmly/api/user";
import { PHONE_KEY } from "../RegisterForm";

/** login — parol bor akkaunt; set — eski (parolsiz) akkaunt, parol o'rnatiladi; new — yangi foydalanuvchi */
type Mode = "login" | "set" | "new";

const TEXT: Record<Mode, { title: string; hint: string }> = {
  login: { title: "Parolni kiriting", hint: "Akkauntingizga kirish uchun parolingizni kiriting." },
  set: { title: "Parol o‘rnating", hint: "Endi akkauntingizga telefon raqami va shu parol bilan kirasiz." },
  new: { title: "Parol o‘ylab toping", hint: "Keyingi safar telefon raqami va shu parol bilan kirasiz." },
};

function EyeButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={shown ? "Parolni yashirish" : "Parolni ko‘rsatish"}
      className="absolute right-[14px] top-1/2 grid size-[32px] -translate-y-1/2 place-items-center text-[#98A2B3] hover:text-brand dark:text-[#8A8A8A]">
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
        {shown && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );
}

export function CodeForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [check, setCheck] = useState<PhoneCheckResult | null>(null);
  const [password, setPw] = useState("");
  const [repeat, setRepeat] = useState("");
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Telefon raqamisiz bu sahifaga kirilsa — orqaga; raqam bo'lsa — akkaunt bor-yo'qligi tekshiriladi
  useEffect(() => {
    let p: string | null = null;
    try { p = sessionStorage.getItem(PHONE_KEY); } catch {}
    if (!p) { router.replace("/royxatdan-otish"); return; }
    setPhone(p);
    phoneCheck(p).then(setCheck).catch((err) => setError(errorText(err)));
  }, [router]);
  useEffect(() => { if (check) input.current?.focus(); }, [check]);

  const mode: Mode = !check?.registered ? "new" : check.password_required ? "login" : "set";
  const confirm = mode !== "login";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check || busy) return;
    const bad = mode === "login" ? (password ? null : "Parolni kiriting") : passwordError(password);
    if (bad) { setError(bad); input.current?.focus(); return; }
    if (confirm && password !== repeat) { setError("Parollar bir xil emas"); return; }
    // Yangi foydalanuvchi — parol ism bosqichigacha xotirada turadi, ro'yxatdan o'tishda yuboriladi
    if (mode === "new") { holdPassword(password); router.push("/royxatdan-otish/ism"); return; }
    setBusy(true);
    try {
      await loginWithPassword(phone, password, check);
      await syncMe();
      sessionStorage.removeItem(PHONE_KEY);
      router.replace("/");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (value: string, onChange: (v: string) => void, label: string, ref?: React.Ref<HTMLInputElement>, autoComplete = "current-password") => (
    <div className="relative">
      <input
        ref={ref} type={shown ? "text" : "password"} autoComplete={autoComplete} placeholder={label} aria-label={label}
        value={value} onChange={(e) => { onChange(e.target.value); setError(null); }} aria-invalid={!!error}
        className={`w-full pr-[54px] ${textInput} ${error ? "border-red-500" : ""}`}
      />
      <EyeButton shown={shown} onClick={() => setShown((s) => !s)} />
    </div>
  );

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
          {check ? TEXT[mode].title : "Parol"}
        </h1>
        <p className="mt-[10px] text-[16px] leading-[1.4] text-black dark:text-[#FFFFFF] sm:text-[20px] sm:leading-[25px] sm:tracking-[-0.3px]">
          {check ? TEXT[mode].hint : "Raqam tekshirilmoqda…"}
        </p>
        {phone && <p className="mt-[6px] text-[15px] text-[#667085] dark:text-[#B0B0B0] tabular-nums">{phone.replace(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/, "+998 $1 $2 $3 $4")}</p>}

        <div className="mt-[20px] flex flex-col gap-[12px]">
          {field(password, setPw, "Parol", input, mode === "login" ? "current-password" : "new-password")}
          {check && confirm && field(repeat, setRepeat, "Parolni takrorlang", undefined, "new-password")}
        </div>

        {error && (
          <p role="alert" className="mt-[12px] text-center text-[14px] text-red-600">{error}</p>
        )}
      </div>

      <button type="submit" disabled={!check || busy} className={`mt-10 sm:mt-[111px] ${primaryBtn} disabled:opacity-60`}>
        Next
      </button>
    </AuthCard>
  );
}
