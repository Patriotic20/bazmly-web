"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isAuthed } from "@bazmly/api/client";
import { syncMe, USER_KEY } from "@bazmly/api/user";

export { USER_KEY };

// Ro'yxatdan o'tmagan foydalanuvchini onboarding'ga yo'naltiradi.
// Splash root layout'da turgani uchun yo'naltirish uning ostida bo'ladi va
// splash yo'qolganda to'g'ridan-to'g'ri onboarding ko'rinadi.
// Sessiya — backend tokeni (bazmly:auth). Tokensiz eski (namunaviy) profil bo'lsa ham qayta kirish so'raladi.
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let user: string | null = null;
    try { user = localStorage.getItem(USER_KEY); } catch {}
    if (user && isAuthed()) {
      setAllowed(true);
      syncMe().catch(() => {});
    } else router.replace("/onboarding");
  }, [router]);

  return allowed ? <>{children}</> : null;
}
