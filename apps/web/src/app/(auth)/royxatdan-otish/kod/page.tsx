import type { Metadata } from "next";
import { CodeForm } from "./CodeForm";

export const metadata: Metadata = { title: "Parol — Bazmly" };

// Figma: "Bazmly" 1920×1080 — Send verification code (3344:12460); SMS kod o'rniga parol
export default function CodePage() {
  return (
    <main className="grid min-h-svh place-items-center bg-white dark:bg-[#2C2C2C] px-4 py-8">
      <CodeForm />
    </main>
  );
}
