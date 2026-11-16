import { notFound } from "next/navigation";
import { BookingPage } from "@/components/venue/BookingPage";
import { getVenue } from "@bazmly/api/venues";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getVenue("restoran", id);
  if (!v) notFound();
  return <BookingPage v={v} />;
}
