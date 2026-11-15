import type { Metadata } from "next";
import { NameForm } from "./NameForm";

export const metadata: Metadata = { title: "Ismingizni kiriting — Bazmly" };

// Figma: "Bazmly" 1920×1080 — Ismingizni kiriting (3344:12536)
export default function NamePage() {
  return (
    <main className="grid min-h-svh place-items-center bg-white dark:bg-[#2C2C2C] px-4 py-8">
      <div className="flex w-full max-w-[416px] flex-col items-center">
        <h1 className="h-[30px] text-[24px] font-bold leading-[30px] tracking-[-0.01em] text-black dark:text-[#FFFFFF]">Ismingizni kiriting</h1>
        <NameForm />
      </div>
    </main>
  );
}
