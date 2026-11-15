import type { Metadata } from "next";
import { SettingsHome } from "./SettingsHome";

export const metadata: Metadata = { title: "Sozlamalar — Bazmly hamkor" };

export default function Page() {
  return <SettingsHome />;
}
