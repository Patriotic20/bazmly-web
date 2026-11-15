"use client";

import { useEffect, useState } from "react";
import { readAccount } from "@bazmly/api/partner";
import { HallUpcoming } from "@/components/hall/HallUpcoming";
import { Waiting } from "./Waiting";

// Restoran — kutilayotgan mijozlar (stollar), to'yxona — kutilayotgan tadbirlar (zallar, seanslar)
export function WaitingSwitch() {
  const [kind, setKind] = useState<string | null>(null);
  useEffect(() => setKind(readAccount()?.kind ?? "restoran"), []);
  if (!kind) return null;
  return kind === "toyxona" ? <HallUpcoming /> : <Waiting />;
}
