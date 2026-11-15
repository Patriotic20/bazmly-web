"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, ImagePlusIcon, TrashIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { readLocation, REGIONS, saveLocation } from "@bazmly/api/regions";
import { readUser, resizeImage, saveUser, wipeAccount } from "@bazmly/api/user";
import { ConfirmSheet, FrameButton, ProfileFrame } from "./ProfileFrame";
import { UserAvatar } from "./ProfileView";

const fmtPhone = (d: string) => {
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return p.join(" ");
};
const field = "mt-[7.5px] h-[44px] w-full rounded-[6px] border border-[#E5E5E5] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] px-[15.5px] text-[16px] text-[#555] dark:text-[#CFCFCF] outline-none transition-colors focus:border-brand";
const label = "block text-[16px] font-semibold leading-[16px] text-black dark:text-[#FFFFFF]";

// Figma: Sozlamalar — rasm, ism, telefon, manzil, "Xavfli zona", Tasdiqlash
export function SettingsView() {
  const router = useRouter();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [sheet, setSheet] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const u = readUser();
    setName(u.name ?? "");
    setPhone((u.phone ?? "").replace(/^\+998/, "").replace(/\D/g, "").slice(0, 9));
    setAvatar(u.avatar);
    setRegion(readLocation().region);
  }, []);

  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.length === 9;

  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Faqat rasm faylini tanlang");
    try { setAvatar(await resizeImage(f)); } catch { toast("Rasmni o‘qib bo‘lmadi"); }
  };

  const submit = () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    // TODO: backend — telefon o'zgarsa SMS bilan tasdiqlash
    if (!saveUser({ name: name.trim(), phone: `+998${phone}`, avatar })) return toast("Saqlab bo‘lmadi — rasm juda katta");
    const cur = readLocation();
    if (cur.region !== region) saveLocation({ region });
    toast("Ma‘lumotlar saqlandi");
    router.push("/profil");
  };

  return (
    <ProfileFrame title="Sozlamalar" onBack={() => router.push("/profil")} footer={<FrameButton onClick={submit}>Tasdiqlash</FrameButton>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="mx-auto w-full max-w-[344.5px] px-4 pb-10 sm:px-0 xl:pt-[79px] xl:fit-tight:pt-[24px]">
        <div className="relative mx-auto size-[154px] xl:fit-tight:[zoom:0.72]">
          <UserAvatar src={avatar} size={154} />
          <button type="button" onClick={() => file.current?.click()} aria-label="Rasmni o‘zgartirish" className="absolute bottom-[1px] right-[-2px] grid size-[44px] place-items-center rounded-full bg-white dark:bg-[#2C2C2C] text-[#8A8A8A] dark:text-[#B0B0B0] shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:text-brand">
            <ImagePlusIcon className="size-[24px]" />
          </button>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </div>

        <label className="mt-[16.5px] block">
          <span className={label}>Ism/Familiya</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={touched && !nameOk} className={`${field} ${touched && !nameOk ? "border-red-500" : ""}`} />
        </label>
        {touched && !nameOk && <p role="alert" className="mt-1 text-[13px] text-red-600">Ismingizni kiriting</p>}

        <label className="mt-[20.5px] block">
          <span className={label}>Telefon raqam</span>
          <span className={`${field} flex items-center gap-[4px] ${touched && !phoneOk ? "border-red-500" : ""} focus-within:border-brand`}>
            <span>+998</span>
            <input type="tel" inputMode="numeric" value={fmtPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} autoComplete="tel-national" aria-invalid={touched && !phoneOk} className="w-full bg-transparent outline-none" />
          </span>
        </label>
        {touched && !phoneOk && <p role="alert" className="mt-1 text-[13px] text-red-600">Telefon raqamni to‘liq kiriting</p>}

        <label className="mt-[20.5px] block">
          <span className={label}>Manzil</span>
          <span className="relative block">
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={`${field} appearance-none pr-10`}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.short === "Toshkent" ? "Toshkent" : r.name}</option>)}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-[18px] top-[19px] size-[20px] text-black dark:text-[#FFFFFF]" />
          </span>
        </label>

        <p className="mt-[20.5px] text-[16px] leading-[16px] text-[#D00000]">Xavfli zona</p>
        <button type="button" onClick={() => setSheet(true)} className="mt-[15.5px] flex h-[43.5px] w-full items-center rounded-[8px] bg-[#FFEEEE] dark:bg-[#4A2B2B] pl-[12px] pr-[14px] text-left text-[16px] text-black dark:text-[#FFFFFF] transition-colors hover:bg-[#FFE1E1] dark:hover:bg-[#4A2B2B]">
          <TrashIcon className="size-[24px] text-[#D00000]" />
          <span className="ml-[21px] flex-1">Akkauntni o‘chirish</span>
          <ChevronRightIcon className="h-[17px] w-[9px]" />
        </button>
        <button type="submit" className="hidden" />
      </form>

      {sheet && (
        <ConfirmSheet
          title="Akkauntni o‘chirmoqchimisiz?" action="Akkauntni o‘chirish"
          icon={<TrashIcon className="size-[24px]" />}
          onClose={() => setSheet(false)}
          onConfirm={() => { wipeAccount(); router.replace("/onboarding"); }}
        />
      )}
    </ProfileFrame>
  );
}
