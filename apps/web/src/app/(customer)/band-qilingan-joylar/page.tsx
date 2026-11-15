import type { Metadata } from "next";
import { BookingsView } from "@/components/bookings/BookingsView";

export const metadata: Metadata = { title: "Band qilingan joylar — Bazmly" };

export default function Page() {
  return <BookingsView />;
}
