import { notFound } from "next/navigation";
import { VenuePage } from "@/components/venue/VenuePage";
import { getVenue } from "@bazmly/api/venues";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = getVenue("restoran", id);
  if (!v) notFound();
  return <VenuePage v={v} />;
}
