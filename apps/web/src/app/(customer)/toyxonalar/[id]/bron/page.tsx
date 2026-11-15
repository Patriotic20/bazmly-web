import { notFound } from "next/navigation";
import { HallDateStep } from "@/components/venue/HallBooking";
import { getVenue } from "@bazmly/api/venues";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = getVenue("toyxona", id);
  if (!v) notFound();
  return <HallDateStep v={v} />;
}
