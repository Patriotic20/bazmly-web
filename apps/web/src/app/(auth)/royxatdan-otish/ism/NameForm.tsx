"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthCard, primaryBtn, textInput } from "@/components/auth/AuthCard";
import { heldPassword, holdPassword, register } from "@bazmly/api/auth";
import { errorText } from "@bazmly/api/client";
import { syncMe } from "@bazmly/api/user";
import { PHONE_KEY } from "../RegisterForm";

export function NameForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let phone: string | null = null;
    try { phone = sessionStorage.getItem(PHONE_KEY); } catch {}
    if (!phone) router.replace("/royxatdan-otish");
    // Parol oldingi bosqichda kiritiladi (faqat xotirada) — sahifa yangilansa qayta so'raladi
    else if (!heldPassword()) router.replace("/royxatdan-otish/kod");
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (value.length < 2) {
      setError("Ismingizni kiriting");
      return;
    }
    if (busy.current) return;
    busy.current = true;
    try {
      const phone = sessionStorage.getItem(PHONE_KEY) ?? "";
      await register(phone, value, null, heldPassword() ?? undefined);
      holdPassword(null);
      await syncMe();
      sessionStorage.removeItem(PHONE_KEY);
      router.replace("/");
    } catch (err) {
      setError(errorText(err));
    } finally {
      busy.current = false;
    }
  };

  return (
    <AuthCard onSubmit={submit} className="mt-[20px]">
      <div>
        <label htmlFor="name" className="sr-only">Ismingizni kiriting</label>
        <input
          id="name"
          autoFocus
          autoComplete="given-name"
          placeholder="Ismingizni kiriting"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null); }}
          aria-invalid={!!error}
          className={`w-full ${textInput} ${error ? "border-red-500" : ""}`}
        />
        {error && <p role="alert" className="mt-[10px] text-[14px] text-red-600">{error}</p>}
      </div>
      <button type="submit" className={`mt-16 sm:mt-[160px] ${primaryBtn}`}>
        Next
      </button>
    </AuthCard>
  );
}
