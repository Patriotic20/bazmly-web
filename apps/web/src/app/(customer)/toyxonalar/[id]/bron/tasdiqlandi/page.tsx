import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HallSuccess } from "@/components/venue/HallFlow";
import { getVenue } from "@bazmly/api/venues";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getVenue("toyxona", id);
  if (!v) notFound();
  return (
    <Suspense>
      <HallSuccess v={v} />
    </Suspense>
  );
}
