"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard, primaryBtn, textInput } from "@/components/auth/AuthCard";
import { USER_KEY } from "@bazmly/api/user";
import { PHONE_KEY } from "../RegisterForm";

export function NameForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let phone: string | null = null;
    try { phone = sessionStorage.getItem(PHONE_KEY); } catch {}
    if (!phone) router.replace("/royxatdan-otish");
  }, [router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (value.length < 2) {
      setError("Ismingizni kiriting");
      return;
    }
    let phone = "";
    try {
      phone = sessionStorage.getItem(PHONE_KEY) ?? "";
      // TODO: backend — POST /auth/register; hozircha foydalanuvchi brauzerda saqlanadi
      localStorage.setItem(USER_KEY, JSON.stringify({ name: value, phone }));
      sessionStorage.removeItem(PHONE_KEY);
    } catch {}
    router.replace("/");
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
