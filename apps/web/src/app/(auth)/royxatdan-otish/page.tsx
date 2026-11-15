import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Akkaunt yaratish — Bazmly" };

// Figma: "Bazmly" 1920×1080 — Akkaunt yaratish (3342:12257)
export default function RegisterPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-white dark:bg-[#2C2C2C] px-4 py-8">
      <div className="flex w-full max-w-[416px] flex-col items-center">
        <h1 className="h-[30px] text-[24px] font-bold leading-[30px] tracking-[-0.01em] text-black dark:text-[#FFFFFF]">Akkaunt yaratish</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
