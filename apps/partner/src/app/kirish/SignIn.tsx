"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { fieldLabel, PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { PasswordInput } from "@/components/PasswordInput";

const fmt = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");

// Figma'da hali chizilmagan: mavjud hamkor akkauntiga kirish (login — telefon raqami, parol)
export function SignIn() {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (phone.length !== 9) return toast("Telefon raqamni to‘liq kiriting");
    if (!password) return toast("Parolni kiriting");
    if (busy) return;
    setBusy(true);
    const r = await signIn(`+998${phone}`, password);
    setBusy(false);
    if (r === "no-account") return toast("Bu raqam bilan akkaunt topilmadi — ro‘yxatdan o‘ting");
    if (r === "bad-password") return toast("Telefon raqam yoki parol noto‘g‘ri");
    if (r === "error") return toast("Kirib bo‘lmadi, qayta urinib ko‘ring");
    router.replace("/panel");
  };

  return (
    <PartnerCard
      title="Kirish" onBack={() => router.push("/")}
      action={<button type="button" onClick={submit} disabled={busy} className={primaryBtn}>Kirish</button>}
    >
      <form noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} className="mx-auto w-full max-w-[356.5px] sm:pt-[113.5px] sm:fit-tight:pt-[12px]">
        <h2 className="text-[22px] font-bold leading-[30px] text-black sm:text-[24px]">Hamkor akkauntiga kirish</h2>
        <p className="mt-[8px] text-[16px] leading-[20px] text-black">Telefon raqamingiz va parolingizni kiriting.</p>
        <label className="mt-[39px] block">
          <span className={fieldLabel}>Telefon raqam</span>
          <span className="mt-[13.5px] flex h-[55px] items-center gap-[6px] rounded-[16px] border border-[#D0D5DD] bg-white px-[16px] text-[20px] focus-within:border-brand">
            <span className="text-black">+998</span>
            <input type="tel" inputMode="numeric" autoComplete="username" value={fmt(phone)} placeholder="__ ___ __ __"
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full bg-transparent text-black outline-none placeholder:text-[#98A2B3] tabular-nums" />
          </span>
        </label>
        <label className="mt-[24.5px] block">
          <span className={fieldLabel}>Parol</span>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" className="mt-[13.5px]" />
        </label>
        <button type="submit" hidden />
      </form>
    </PartnerCard>
  );
}
