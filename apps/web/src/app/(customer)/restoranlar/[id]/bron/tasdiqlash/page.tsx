import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingConfirm } from "@/components/venue/BookingConfirm";
import { getVenue } from "@bazmly/api/venues";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = getVenue("restoran", id);
  if (!v) notFound();
  return (
    <Suspense>
      <BookingConfirm v={v} />
    </Suspense>
  );
}
