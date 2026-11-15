import type { Metadata } from "next";
import { ListingView } from "@/components/home/ListingView";

export const metadata: Metadata = { title: "To‘yxonalar — Bazmly" };

export default function Page() {
  return <ListingView type="toyxona" />;
}
