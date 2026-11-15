"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { num, readSettings, type HallSettings } from "@bazmly/api/hall";
import { daysText, hoursText, readAccount, totalSeats, updateAccount, type AdvanceDays, type PartnerAccount } from "@bazmly/api/partner";
import { ChevronRightIcon, LocationIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { fieldBox, fieldLabel } from "@/components/PartnerCard";
import { SettingsCard } from "@/components/SettingsCard";
import { shrinkImage } from "@/components/shrinkImage";
import { VenueAvatar } from "@/components/VenueAvatar";
import { placeText } from "../SettingsHome";

const KIND_WORD = { restoran: "Restorandagi", toyxona: "To‘yxonadagi", barchasi: "Muassasadagi" } as const;

const EditIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13.26 3.6L5.05 12.29c-.31.33-.61.98-.67 1.43l-.37 3.24c-.13 1.17.71 1.97 1.87 1.77l3.22-.55c.45-.08 1.08-.41 1.39-.75l8.21-8.69c1.42-1.5 2.06-3.21-.15-5.3-2.2-2.07-3.87-1.34-5.29.16z" />
    <path d="M11.89 5.05a6.126 6.126 0 005.45 5.15M3 22h18" />
  </svg>
);
const CloseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M2 2l8 8M10 2l-8 8" /></svg>
);

/** Tanlov "chip"i (Figma: 42px, o'ngda doira; tanlangani to'q sariq, ✕ bilan) */
function Chip({ on, children, onClick, className = "" }: { on: boolean; children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`flex h-[42px] shrink-0 items-center justify-between gap-[10px] rounded-full border pl-[16px] pr-[5px] text-[16px] transition-colors ${
        on ? "border-brand bg-brand text-white" : "border-[#D0D5DD] bg-white text-[#2C2C2C] hover:border-brand"
      } ${className}`}
    >
      {children}
      {on
        ? <span className="grid size-[22px] place-items-center rounded-full bg-white text-brand"><CloseIcon className="size-[12px]" /></span>
        : <span className="size-[22px] rounded-full border border-[#4D4D4D] bg-[#FAF8FC]" />}
    </button>
  );
}

// Figma: "Sozlamalar" (tahrirlash) — rasm, nom (qalam), faoliyat turi, joylar, ish vaqti, ish kunlari, oldindan band qilish.
// O'zgarishlar darhol saqlanadi; joylar / vaqt / kunlar alohida sahifalarda tahrirlanadi.
export default function ProfileEdit() {
  const router = useRouter();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [acc, setAcc] = useState<PartnerAccount | null>(null);
  const [hs, setHs] = useState<HallSettings | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  useEffect(() => { const a = readAccount(); setAcc(a); setName(a?.name ?? ""); if (a?.kind === "toyxona") setHs(readSettings()); }, []);

  const patch = (p: Partial<PartnerAccount>) => {
    const next = updateAccount(p);
    if (!next) { toast("Saqlab bo‘lmadi"); return false; }
    setAcc(next); return true;
  };
  const saveName = () => {
    const v = name.trim();
    if (v.length < 2) { toast("Muassasa nomini kiriting"); setName(acc?.name ?? ""); }
    else if (v !== acc?.name && patch({ name: v })) toast("Nom saqlandi");
    setEditing(false);
  };
  const pickImage = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Faqat rasm faylini tanlang");
    try { if (patch({ avatar: await shrinkImage(f, 480) })) toast("Rasm yangilandi"); } catch { toast("Rasmni o‘qib bo‘lmadi"); }
  };

  if (!acc) return null;
  const seats = acc.seats ?? totalSeats(acc.tables);
  const hall = acc.kind === "toyxona";
  const nav = "flex h-[55px] w-full items-center justify-between rounded-[16px] border border-[#D0D5DD] bg-white pl-[16px] pr-[23.5px] text-left text-black transition-colors hover:border-brand";

  return (
    <SettingsCard title="Sozlamalar" onBack={() => router.push("/panel/sozlamalar")}>
      <div className="flex flex-col items-center pt-4 sm:pt-[15px]">
        <button type="button" onClick={() => file.current?.click()} aria-label="Muassasa rasmini o‘zgartirish" className="group relative size-[150px] fit-tight:size-[120px] overflow-hidden rounded-full">
          <VenueAvatar className="size-full" />
          <span className="absolute inset-0 grid place-items-center bg-black/35 text-[14px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Rasmni almashtirish</span>
        </button>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />

        {editing ? (
          <input
            autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} maxLength={60}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(acc.name); setEditing(false); } }}
            aria-label="Muassasa nomi"
            className="mt-[15.5px] h-[49px] w-full max-w-[320px] rounded-[16px] border-2 border-brand px-[19px] text-center text-[18px] font-semibold text-black outline-none"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} aria-label={`Nomni o‘zgartirish: ${acc.name}`}
            className="mt-[15.5px] flex h-[49px] max-w-full items-center gap-[23px] rounded-[16px] border-2 border-[#F2F2F2] pl-[17.5px] pr-[16.5px] transition-colors hover:border-[#E3E3E3]">
            <span className="truncate text-[18px] font-semibold leading-[22px] text-black">{acc.name}</span>
            <EditIcon className="size-[21px] shrink-0 text-[#949698]" />
          </button>
        )}
        <p className="mt-[13.5px] flex items-center gap-[10px] text-[14px] leading-[19px] text-black">
          <LocationIcon className="size-[19px] shrink-0" />{placeText(acc.address)}
        </p>
      </div>

      <div className="mx-auto mt-[20.5px] w-full max-w-[734px] lg:ml-[150.5px]">
        {/* Akkaunt turi o'zgarmaydi: restoran va to'yxona — alohida akkauntlar (Sozlamalar → Akkauntlar) */}
        <div className="sm:pl-[235px]">
          <span className={`${fieldLabel} tracking-[-0.3px]`}>Faoliyat turi</span>
          <div className="mt-[13px] flex flex-wrap items-center gap-[12px]">
            <span className="flex h-[42px] items-center rounded-full bg-brand px-[18px] text-[16px] text-white">{hall ? "To‘yxona" : "Restoran"} akkaunti</span>
            <Link href="/panel/sozlamalar#akkauntlar" className="text-[14px] text-[#64748B] underline-offset-2 hover:text-brand hover:underline">Akkauntni almashtirish yoki qo‘shish</Link>
          </div>
        </div>

        <div className="mt-[28.5px] grid gap-x-[21px] gap-y-[22.5px] md:grid-cols-2">
          {hall ? (
            <>
              <div>
                <span id="lbl-halls" className={`${fieldLabel} tracking-[-0.3px]`}>Zallar va sig‘imi</span>
                <button type="button" aria-labelledby="lbl-halls" onClick={() => router.push("/panel/toyxona/paketlar")} className={`${nav} mt-[15.5px]`}>
                  <span className="truncate text-[18px]">{hs ? hs.halls.map((h) => `${h.name} · ${h.capacity}`).join(", ") : ""}</span>
                  <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
                </button>
              </div>
              <div>
                <span id="lbl-sessions" className={`${fieldLabel} tracking-[-0.3px]`}>Seanslar</span>
                <button type="button" aria-labelledby="lbl-sessions" onClick={() => router.push("/panel/toyxona/paketlar")} className={`${nav} mt-[15.5px]`}>
                  <span className="truncate text-[18px]">{hs ? hs.sessions.map((x) => `${x.from.replace(/^0/, "")}–${x.to}`).join(" · ") : ""}</span>
                  <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
                </button>
              </div>
            </>
          ) : (
            <>
          <div>
            <span id="lbl-seats" className={`${fieldLabel} tracking-[-0.3px]`}>{KIND_WORD[acc.kind]} umumiy joylar sonini kiriting</span>
            <button type="button" aria-labelledby="lbl-seats" onClick={() => router.push("/panel/sozlamalar/stollar")} className={`${nav} mt-[15.5px]`}>
              <span className="text-[18px]">{seats ? `${seats} ta` : "Belgilash"}</span>
              <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
            </button>
          </div>
              <div>
            <span id="lbl-hours" className={`${fieldLabel} tracking-[-0.3px]`}>Ish vaqtini belgilang</span>
            <button type="button" aria-labelledby="lbl-hours" onClick={() => router.push("/panel/sozlamalar/ish-vaqti")} className={`${nav} mt-[15.5px]`}>
              <span className="text-[18px]">{hoursText(acc.hours) || "Belgilash"}</span>
              <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
            </button>
          </div>
            </>
          )}
          <div>
            <span id="lbl-days" className={`${fieldLabel} tracking-[-0.3px]`}>Ish kunlarini belgilang</span>
            <button type="button" aria-labelledby="lbl-days" onClick={() => router.push("/panel/sozlamalar/ish-kunlari")} className={`${nav} mt-[15.5px]`}>
              <span className="text-[18px]">{daysText(acc.days) || "Belgilash"}</span>
              <ChevronRightIcon className="h-[25px] w-[12.5px] shrink-0" />
            </button>
          </div>
          <div className="md:pt-[6px]">
            <span id="lbl-adv" className={`${fieldLabel} tracking-[-0.3px]`}>Minimal oldindan band qilish vaqti</span>
            <div role="radiogroup" aria-labelledby="lbl-adv" className="mt-[15.5px] grid grid-cols-3 gap-[12px] sm:gap-[21px]">
              {([1, 2, 3] as AdvanceDays[]).map((n) => (
                <Chip key={n} on={acc.minAdvance === n} onClick={() => { if (acc.minAdvance !== n) patch({ minAdvance: n }); }} className="pl-[21px]">{n} kun</Chip>
              ))}
            </div>
          </div>
        </div>
        {hall && hs && (
          <Link href="/panel/toyxona/paketlar" className="mt-[22.5px] flex items-center justify-between rounded-[16px] bg-[#F6F7F9] px-[16px] py-[14px] text-[15px] text-black transition-colors hover:bg-[#EEF0F3]">
            <span>Narxlar, dasturxon paketlari va depozit <span className="text-[#64748B]">· depozit {hs.depositPct}%, xizmat haqi {num(hs.serviceFee)} so‘m</span></span>
            <ChevronRightIcon className="h-[16px] w-[8px] shrink-0" />
          </Link>
        )}
      </div>
    </SettingsCard>
  );
}
