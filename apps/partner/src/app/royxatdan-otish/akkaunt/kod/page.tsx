"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { passwordError, phoneCheck, type PhoneCheckResult } from "@bazmly/api/auth";
import { createAccountRemote } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { PasswordInput } from "@/components/PasswordInput";
import { useDraft } from "@/components/useDraft";

/** login — raqam ro'yxatdan o'tgan va paroli bor; set — eski akkaunt, parol o'rnatiladi; new — yangi akkaunt */
type Mode = "login" | "set" | "new";
const TEXT: Record<Mode, { title: string; hint: string }> = {
  login: { title: "Parolni kiriting", hint: "Bu raqam ro‘yxatdan o‘tgan — akkauntingiz parolini kiriting." },
  set: { title: "Parol o‘rnating", hint: "Endi akkauntga telefon raqami va shu parol bilan kirasiz." },
  new: { title: "Parol o‘ylab toping", hint: "Akkauntga telefon raqami va shu parol bilan kirasiz." },
};

// Figma: "Akkaunt yaratish" — SMS kod o'rniga parol (login — telefon raqami)
export default function PasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const draft = useDraft("telefon");
  const [check, setCheck] = useState<PhoneCheckResult | null>(null);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!draft?.phone) return;
    phoneCheck(draft.phone).then(setCheck).catch(() => toast("Raqamni tekshirib bo‘lmadi, qayta urinib ko‘ring"));
  }, [draft?.phone, toast]);

  const mode: Mode = !check?.registered ? "new" : check.password_required ? "login" : "set";

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft?.phone) return router.replace("/royxatdan-otish");
    if (!check || busy) return;
    const bad = mode === "login" ? (password ? null : "Parolni kiriting") : passwordError(password);
    if (bad) { setError(true); return toast(bad); }
    if (mode !== "login" && password !== repeat) { setError(true); return toast("Parollar bir xil emas"); }
    setBusy(true);
    const acc = await createAccountRemote(draft.phone, false, password);
    setBusy(false);
    if (!acc) return toast(mode === "login" ? "Parol noto‘g‘ri yoki akkauntni yaratib bo‘lmadi" : "Akkauntni yaratib bo‘lmadi");
    router.replace("/royxatdan-otish/tayyor");
  };

  if (!draft) return null;
  return (
    <PartnerCard
      title="Akkaunt yaratish" smallTitle onBack={() => router.push("/royxatdan-otish/akkaunt")}
      action={<button type="submit" form="code-form" disabled={!check || busy} className={primaryBtn}>Tasdiqlash</button>}
    >
      <form id="code-form" noValidate onSubmit={submit} className="mx-auto w-full max-w-[356.5px] sm:pt-[121px] sm:fit-tight:pt-[12px]">
        <h2 className="text-[26px] font-bold leading-[1.25] tracking-[-0.01em] text-black sm:text-[32px] sm:leading-[40px]">
          {check ? TEXT[mode].title : "Parol"}
        </h2>
        <p className="mt-[10px] text-[16px] leading-[1.4] text-black sm:text-[20px] sm:leading-[25px] sm:tracking-[-0.3px]">
          {check ? TEXT[mode].hint : "Raqam tekshirilmoqda…"}
        </p>
        <p className="mt-[6px] text-[15px] text-[#667085] tabular-nums">{draft.phone?.replace(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/, "+998 $1 $2 $3 $4")}</p>
        <div className="mt-[20px] flex flex-col gap-[12px]">
          <PasswordInput value={password} onChange={(v) => { setPassword(v); setError(false); }} invalid={error} autoFocus
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
          {check && mode !== "login" && (
            <PasswordInput value={repeat} onChange={(v) => { setRepeat(v); setError(false); }} invalid={error}
              autoComplete="new-password" placeholder="Parolni takrorlang" />
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </PartnerCard>
  );
}
