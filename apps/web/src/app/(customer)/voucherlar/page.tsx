import type { Metadata } from "next";
import { VouchersView } from "@/components/vouchers/VouchersView";

export const metadata: Metadata = { title: "Voucherlar — Bazmly" };

export default function Page() {
  return <VouchersView />;
}
