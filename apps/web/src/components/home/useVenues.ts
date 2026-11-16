"use client";

import { useEffect, useState } from "react";
import { readLocation } from "@bazmly/api/regions";
import { type GridVenue, gridVenues, topVenues, type Venue, type VenueType } from "@bazmly/api/venues";

/** Backenddan "Top" qatori va to'r ro'yxatini yuklaydi. Yuklanguncha — null. */
export function useVenues<T extends Venue | GridVenue>(type: VenueType, kind: "top" | "grid"): T[] | null {
  const [list, setList] = useState<T[] | null>(null);
  useEffect(() => {
    let alive = true;
    const l = readLocation();
    const p = { type, coords: l.lat && l.lng ? { lat: l.lat, lng: l.lng } : undefined };
    (kind === "top" ? topVenues(p) : gridVenues(p)).then((x) => { if (alive) setList(x as T[]); }).catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [type, kind]);
  return list;
}
