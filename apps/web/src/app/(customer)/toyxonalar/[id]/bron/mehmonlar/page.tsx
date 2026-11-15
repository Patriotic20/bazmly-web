import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HallTierStep } from "@/components/venue/HallFlow";
import { getVenue } from "@bazmly/api/venues";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = getVenue("toyxona", id);
  if (!v) notFound();
  return (
    <Suspense>
      <HallTierStep v={v} />
    </Suspense>
  );
}
