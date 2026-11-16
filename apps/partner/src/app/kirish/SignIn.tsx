"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { fieldLabel, PartnerCard, primaryBtn } from "@/components/PartnerCard";

const fmt = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");

// Figma'da hali chizilmagan: mavjud hamkor akkauntiga kirish (telefon + SMS kod)
export function SignIn() {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [left, setLeft] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (left > 0) { const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); } }, [left]);

  const send = () => {
    if (phone.length !== 9) return toast("Telefon raqamni to‘liq kiriting");
    // TODO: backend — POST /auth/partner/otp
    setSent(true); setLeft(60); setTimeout(() => codeRef.current?.focus(), 50);
  };
  const [busy, setBusy] = useState(false);
  const verify = async () => {
    if (code.length !== 6) return toast("SMS kodni to‘liq kiriting");
    if (busy) return;
    const full = `+998${phone}`;
    // SMS kod backendda hali yo'q — istalgan 6 xonali kod qabul qilinadi, so'ng backend orqali kiriladi
    setBusy(true);
    const ok = await signIn(full);
    setBusy(false);
    if (!ok) return toast("Bu raqam bilan akkaunt topilmadi — ro‘yxatdan o‘ting");
    router.replace("/panel");
  };

  return (
    <PartnerCard
      title="Kirish" onBack={() => router.push("/")}
      action={<button type="button" onClick={sent ? verify : send} className={primaryBtn}>{sent ? "Tasdiqlash" : "Kod olish"}</button>}
    >
      <form noValidate onSubmit={(e) => { e.preventDefault(); if (sent) verify(); else send(); }} className="mx-auto w-full max-w-[356.5px] sm:pt-[113.5px] sm:fit-tight:pt-[12px]">
        <h2 className="text-[22px] font-bold leading-[30px] text-black sm:text-[24px]">Hamkor akkauntiga kirish</h2>
        <p className="mt-[8px] text-[16px] leading-[20px] text-black">Raqamingizga SMS orqali tasdiqlash kodi yuboriladi.</p>
        <label className="mt-[39px] block">
          <span className={fieldLabel}>Telefon raqam</span>
          <span className="mt-[13.5px] flex h-[55px] items-center gap-[6px] rounded-[16px] border border-[#D0D5DD] bg-white px-[16px] text-[20px] focus-within:border-brand">
            <span className="text-black">+998</span>
            <input type="tel" inputMode="numeric" autoComplete="tel-national" value={fmt(phone)} placeholder="__ ___ __ __" disabled={sent}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full bg-transparent text-black outline-none placeholder:text-[#98A2B3] disabled:text-[#646464] tabular-nums" />
          </span>
        </label>
        {sent && (
          <label className="mt-[24.5px] block">
            <span className={fieldLabel}>SMS kod</span>
            <input ref={codeRef} inputMode="numeric" autoComplete="one-time-code" value={code} placeholder="______" maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-[13.5px] h-[55px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-[16px] text-[20px] tracking-[0.4em] text-black outline-none focus:border-brand tabular-nums" />
            <span className="mt-3 flex justify-between text-[14px]">
              <button type="button" onClick={() => { setSent(false); setCode(""); }} className="text-[#646464] hover:text-brand">Raqamni o‘zgartirish</button>
              <button type="button" disabled={left > 0} onClick={() => setLeft(60)} className="text-brand disabled:text-brand/50">Qayta yuborish{left > 0 ? ` (0:${String(left).padStart(2, "0")})` : ""}</button>
            </span>
          </label>
        )}
        <button type="submit" hidden />
      </form>
    </PartnerCard>
  );
}
