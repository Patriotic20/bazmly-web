"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readDraft, saveDraft } from "@bazmly/api/partner";
import { REGIONS } from "@bazmly/api/regions";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { Select } from "@/components/Select";

const input = "mt-[3.5px] h-[52px] w-full rounded-[8px] border border-[#9D9D9D] bg-white px-[12px] text-[16px] text-black outline-none transition-colors placeholder:text-[#8A8A8A] focus:border-brand";

// Figma: "Manzil" — viloyat va shahar; ikkalasi tanlangach ko'cha va uy maydonlari chiqadi
export default function AddressPage() {
  const router = useRouter();
  const toast = useToast();
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");

  useEffect(() => {
    const a = readDraft().address ?? {};
    setRegion(a.region ?? ""); setCity(a.city ?? ""); setStreet(a.street ?? ""); setHouse(a.house ?? "");
  }, []);

  const r = REGIONS.find((x) => x.short === region);
  const full = !!region && !!city;

  const confirm = () => {
    if (!region) return toast("Viloyatni belgilang");
    if (!city) return toast("Shaharni belgilang");
    if (!street.trim()) return toast("Ko‘cha nomini yozing");
    saveDraft({ address: { region, city, street: street.trim(), house: house.trim() || undefined } });
    router.push("/royxatdan-otish");
  };

  return (
    <PartnerCard title="Manzil" onBack={() => router.push("/royxatdan-otish")} action={<button type="button" onClick={confirm} className={primaryBtn}>Tasdiqlash</button>}>
      <div className="mx-auto w-full max-w-[344.5px] sm:pt-[116.5px] sm:fit-tight:pt-[12px]">
        <Select label="Viloyat" value={region} options={REGIONS.map((x) => x.short)} onChange={(v) => { setRegion(v); if (v !== region) setCity(""); }} />
        <Select className={full ? "mt-[19.5px]" : "mt-[29.5px]"} label="Shahar" value={city} options={r?.districts ?? []} disabled={!r} onChange={setCity} />
        {full ? (
          <>
            <label className="mt-[19.5px] block">
              <span className="block text-[14px] leading-[18px] text-black">Ko‘cha</span>
              <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ko‘cha nomini yozing" autoComplete="address-line1" className={input} />
            </label>
            <label className="mt-[19.5px] block">
              <span className="block text-[14px] leading-[18px] text-black">Uy</span>
              <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="Uy raqamini yozing" autoComplete="address-line2" className={input} />
            </label>
          </>
        ) : (
          <button type="button" onClick={() => toast("Xaritadan belgilash tez orada qo‘shiladi")} className="mx-auto mt-[40.5px] flex items-center gap-[22px] text-[16px] font-semibold text-black hover:text-brand">
            Xarita orqali belgilash
            <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="8.8" cy="8.6" r="2.3" /><path d="M8.8 11v0M6 22L22 6M13 22l9-9" />
            </svg>
          </button>
        )}
      </div>
    </PartnerCard>
  );
}
