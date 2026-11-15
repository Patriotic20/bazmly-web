import type { Metadata } from "next";
import { LanguageView } from "@/components/profile/LanguageView";

export const metadata: Metadata = { title: "Til sozlamalari — Bazmly" };

export default function Page() {
  return <LanguageView />;
}
