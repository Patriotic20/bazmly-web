"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createAccountRemote } from "@bazmly/api/partner";
import { focusFirstEmpty, OtpBoxes } from "@bazmly/ui/OtpBoxes";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { useDraft } from "@/components/useDraft";

const LEN = 6;
const COOLDOWN = 60;

// Figma: "Akkaunt yaratish" — Send verification code (6 xonali SMS kod)
export default function CodePage() {
  const router = useRouter();
  const toast = useToast();
  const draft = useDraft("telefon");
  const [code, setCode] = useState<string[]>(Array(LEN).fill(""));
  const [error, setError] = useState(false);
  const [left, setLeft] = useState(COOLDOWN);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const resend = () => {
    if (left > 0) return toast(`Kodni ${left} soniyadan so‘ng qayta yuborish mumkin`);
    // TODO: backend — POST /auth/partner/otp
    setLeft(COOLDOWN);
    toast("Kod qayta yuborildi");
  };
  const [busy, setBusy] = useState(false);
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.join("").length !== LEN) { setError(true); focusFirstEmpty(code); return toast("Kodni to‘liq kiriting"); }
    if (busy) return;
    // SMS kod backendda hali yo'q — istalgan 6 xonali kod qabul qilinadi; akkaunt backend'da yaratiladi
    if (!draft?.phone) return router.replace("/royxatdan-otish");
    setBusy(true);
    const acc = await createAccountRemote(draft.phone);
    setBusy(false);
    if (!acc) return toast("Akkauntni yaratib bo‘lmadi");
    router.replace("/royxatdan-otish/tayyor");
  };

  if (!draft) return null;
  return (
    <PartnerCard
      title="Akkaunt yaratish" smallTitle onBack={() => router.push("/royxatdan-otish/akkaunt")}
      action={<button type="submit" form="code-form" className={primaryBtn}>Tasdiqlash</button>}
    >
      <form id="code-form" noValidate onSubmit={submit} className="mx-auto w-full max-w-[356.5px] sm:pt-[121px] sm:fit-tight:pt-[12px]">
        <h2 className="text-[26px] font-bold leading-[1.25] tracking-[-0.01em] text-black sm:text-[32px] sm:leading-[40px]">
          Send verification<br className="hidden sm:block" />{" "}code
        </h2>
        <p className="mt-[10px] text-[16px] leading-[1.4] text-black sm:whitespace-nowrap sm:text-[20px] sm:leading-[25px] sm:tracking-[-0.3px]">
          We’ll send a code to your<br className="hidden sm:block" />{" "}phone number to verify your account.
        </p>
        <p className="sr-only">{draft.phone} raqamiga yuborildi</p>
        <div className="mt-[20px]">
          <OtpBoxes value={code} onChange={(v) => { setCode(v); setError(false); }} error={error} />
        </div>
        <div className="mt-[19px] text-center">
          <button type="button" onClick={resend} aria-describedby="resend-hint" className="text-[16px] leading-[20px] text-brand hover:underline">
            Resent code
          </button>
          <span id="resend-hint" className="sr-only">{left > 0 ? `${left} soniyadan so‘ng` : ""}</span>
        </div>
        <button type="submit" hidden />
      </form>
    </PartnerCard>
  );
}
