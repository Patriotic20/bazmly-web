"use client";

import { useState } from "react";

// Parol maydoni: SMS kod maydonlari bilan bir xil o'lcham va ramka, ko'rsatish/yashirish tugmasi bilan
export function PasswordInput({ value, onChange, autoComplete, placeholder = "Parol", invalid, autoFocus, className = "" }: {
  value: string; onChange: (v: string) => void; autoComplete: "current-password" | "new-password";
  placeholder?: string; invalid?: boolean; autoFocus?: boolean; className?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <span className={`relative block ${className}`}>
      <input
        type={shown ? "text" : "password"} value={value} placeholder={placeholder} aria-label={placeholder}
        autoComplete={autoComplete} autoFocus={autoFocus} aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[55px] w-full rounded-[16px] border bg-white pl-[16px] pr-[52px] text-[20px] text-black outline-none placeholder:text-[#98A2B3] focus:border-brand ${invalid ? "border-red-500" : "border-[#D0D5DD]"}`}
      />
      <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Parolni yashirish" : "Parolni ko‘rsatish"}
        className="absolute right-[12px] top-1/2 grid size-[32px] -translate-y-1/2 place-items-center text-[#98A2B3] hover:text-brand">
        <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {shown && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </span>
  );
}
