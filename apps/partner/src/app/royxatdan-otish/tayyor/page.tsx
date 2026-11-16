"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addressText, isSignedIn, readAccount, saveAccount, type PartnerAccount } from "@bazmly/api/partner";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard } from "@/components/PartnerCard";

const LIVE = { restoran: "Restaurant is live", toyxona: "Wedding hall is live", barchasi: "Venue is live" } as const;
const ASKED = "bazmly:partner:geo-asked";

// Figma: akkaunt yaratildi — "Restaurant is live" + qurilma joylashuviga ruxsat so'rash oynasi
export default function LivePage() {
  const router = useRouter();
  const toast = useToast();
  const [acc, setAcc] = useState<PartnerAccount | null>(null);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    const a = readAccount();
    if (!a || !isSignedIn()) { router.replace("/"); return; }
    setAcc(a);
    let asked = false;
    try { asked = !!sessionStorage.getItem(ASKED); } catch {}
    if (asked || a.location || !("geolocation" in navigator)) return;
    const t = setTimeout(() => setAsk(true), 500);
    return () => clearTimeout(t);
  }, [router]);

  const answer = (allow: boolean) => {
    setAsk(false);
    try { sessionStorage.setItem(ASKED, "1"); } catch {}
    if (!allow) return;
    navigator.geolocation.getCurrentPosition(
      async (p) => { const next = await saveAccount({ location: { lat: p.coords.latitude, lng: p.coords.longitude } }); if (!next) return toast("Saqlab bo‘lmadi"); setAcc(next); toast("Joylashuv saqlandi"); },
      () => toast("Joylashuvga ruxsat berilmadi — keyinroq sozlamalardan yoqishingiz mumkin"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!acc) return null;
  return (
    <>
      <PartnerCard title="Akkaunt yaratish" smallTitle onBack={() => router.push("/panel")} className="flex flex-col sm:min-h-[840px] sm:pb-[48px]">
        <div className="mx-auto flex w-full max-w-[344.5px] flex-1 flex-col items-center text-center sm:pt-[195px] sm:fit-tight:pt-[12px]">
          <span className="grid size-[55px] place-items-center rounded-full bg-[#DCFCE7]" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-[32px] text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
          </span>
          <h2 className="mt-[19.5px] text-[26px] font-bold leading-[36px] text-black sm:text-[32px] sm:leading-[40px]">{LIVE[acc.kind]}</h2>
          <p className="mt-[24px] text-[20px] font-semibold leading-[28px] text-black">{acc.name}</p>
          <p className="mt-[10px] text-[16px] leading-[22px] text-[#646464]">{addressText(acc.address)}</p>
          <span className="mt-[30.5px] inline-flex h-[25px] items-center gap-[6px] rounded-full bg-[#F0FDF4] px-[12px] text-[16px] leading-none text-[#15803D]">
            Active <span className="size-[6px] rounded-full bg-[#22C55E]" aria-hidden />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/venue-live.webp" alt="" width={128} height={128} className="mt-[20.5px] size-[128px] rounded-[14px] border border-[#DCFCE7] object-cover" />
          <button
            type="button" onClick={() => router.replace("/panel")}
            className="mt-10 h-[56px] w-full shrink-0 rounded-full bg-brand text-[22px] text-white transition-colors hover:bg-brand-600 sm:mt-auto sm:text-[24px]"
          >
            Go Home
          </button>
        </div>
      </PartnerCard>

      {ask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="geo-t" className="w-full max-w-[309.5px] rounded-[8px] bg-white pb-[16px] pl-[19.5px] pr-[22.5px] pt-[13px] font-[Roboto,Arial,sans-serif] shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            <div className="flex gap-[18px]">
              <svg viewBox="0 0 40 50" className="mt-[1px] h-[46px] w-[39px] shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                <path d="M20 47S37.5 30.5 37.5 19.5a17.5 17.5 0 10-35 0C2.5 30.5 20 47 20 47z" /><circle cx="20" cy="19.5" r="6" />
              </svg>
              <p id="geo-t" className="text-[22px] leading-[29px] text-black">Allow <b>Bazmly</b> to access this device’s location</p>
            </div>
            <div className="mt-[16px] flex justify-end gap-[26px] text-[20px] leading-[22px] text-brand">
              <button type="button" onClick={() => answer(false)} className="uppercase hover:opacity-80">Deny</button>
              <button type="button" onClick={() => answer(true)} autoFocus className="uppercase hover:opacity-80">Allow</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
