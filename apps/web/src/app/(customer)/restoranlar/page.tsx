import type { Metadata } from "next";
import { ListingView } from "@/components/home/ListingView";

export const metadata: Metadata = { title: "Restoranlar — Bazmly" };

export default function Page() {
  return <ListingView type="restoran" />;
}
