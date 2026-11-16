"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BazmlyLogo } from "@bazmly/ui/BazmlyLogo";
import { CallIcon, CardIcon, ChevronLeftIcon, LocationIcon, MapIcon, ScanIcon, ShareBoxIcon } from "@bazmly/ui/icons";
import { QrCode } from "@/components/ui/QrCode";
import { type Booking, bookingVenue, fetchBooking, STATUS_TEXT } from "@bazmly/api/bookings";
import type { VenueDetails } from "@bazmly/api/venues";

// Eski bronlarda (chek/kod yo'q) id'dan barqaror raqam hosil qilinadi
function digitsFrom(seed: string, n: number) {
  let h = 2166136261, out = "";
  while (out.length < n) { for (const ch of seed + out.length) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; out += String(h % 1e6).padStart(6, "0"); }
  return out.slice(0, n);
}

// Backend chek raqami va chipta kodi harf-raqamli bo'lishi mumkin
const fmtReceipt = (r: string) => (/^\d{10}$/.test(r) ? `${r.slice(0, 4)} ${r.slice(4, 7)} ${r.slice(7, 10)}` : r.replace(/(.{4})(?=.)/g, "$1 "));
const fmtCode = (c: string) => c.replace(/(.{4})(?=.)/g, "$1 ");
const fmtDate = (iso?: string) => (iso ? iso.split("-").reverse().join("/") : "—");
const fmtPrice = (n: number) => `${n.toLocaleString("de-DE")} so‘m`; // Figma: 600.000 so‘m

// Figma: "Band qilish tasdiqlandi" (3407:17477) va QR holati (3408:22605)
export function BookingSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const showQr = params.get("qr") === "1";
  const [b, setB] = useState<Booking | null | undefined>(undefined);
  const [v, setV] = useState<VenueDetails | null>(null);

  useEffect(() => {
    let alive = true;
    fetchBooking(id ?? "").then((x) => {
      if (!alive) return;
      setB(x);
      if (x) bookingVenue(x).then((vv) => { if (alive) setV(vv); });
    });
    return () => { alive = false; };
  }, [id]);

  if (b === undefined) return null;
  if (!b) {
    return (
      <main className="grid min-h-svh place-items-center px-4 text-center">
        <div>
          <h1 className="text-[24px] font-semibold">Bron topilmadi</h1>
          <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-[12px] bg-brand px-6 text-[18px] font-semibold text-white">Bosh sahifaga qaytish</Link>
        </div>
      </main>
    );
  }

  const receipt = b.receipt ?? digitsFrom(b.id, 10);
  const code = b.code ?? digitsFrom(b.id + "k", 16);
  const toggleQr = (on: boolean) => router.push(`/bron/tasdiqlandi?id=${b.id}${on ? "&qr=1" : ""}`, { scroll: false });

  return (
    <main className="mx-auto flex min-h-svh max-w-[1920px] flex-col items-center px-4 pb-10 pt-8 lg:pb-0 lg:pt-[min(202px,18.7vh)] print:p-0">
      <div className={`flex w-full flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center ${showQr ? "lg:gap-x-[max(80px,min(308.5px,calc(100vw-1300px)))]" : "lg:gap-x-[max(80px,min(300.5px,calc(100vw-1300px)))]"}`}>
        {/* Chap tomon: logotip yoki QR kod */}
        {showQr ? (
          <section aria-label="QR kod" className="order-2 flex w-full max-w-[352px] flex-col lg:order-none print:hidden">
            <button type="button" onClick={() => toggleQr(false)} aria-label="Orqaga" className="grid size-[41px] place-items-center rounded-full bg-brand text-white hover:bg-brand-600 dark:bg-white dark:text-[#2C2C2C] dark:hover:bg-[#E8E8E8]">
              <ChevronLeftIcon className="h-[22px] w-[11px]" />
            </button>
            <div className="mt-6 aspect-square w-full lg:mt-[94px] lg:size-[352px] dark:bg-white dark:p-[5px] dark:lg:size-[362px] dark:lg:mt-[89px]">
              <QrCode value={b.qr ?? `BAZMLY:${b.id}:${code}`} className="size-full" title={`Bron QR kodi: ${fmtCode(code)}`} />
            </div>
            <p className="mt-[38px] text-center text-[20px] leading-[29px] text-black dark:text-[#FFFFFF]">
              Ushbu QR kodni sotuvchiga
              <br />
              ko‘rsating
            </p>
          </section>
        ) : (
          <div className="flex justify-center lg:mt-[min(277px,25.6vh)] print:hidden">
            <BazmlyLogo className="h-auto w-[min(498.5px,70vw)] text-brand dark:text-white lg:h-[122.5px] lg:w-[498.5px]" title="Bazmly" />
          </div>
        )}

        {/* O'ng tomon: chipta */}
        <div className="w-full max-w-[345px]">
          <Ticket b={b} v={v} receipt={receipt} code={code} qrLabel={showQr ? "QR" : "QR kod orqali"} onQr={() => toggleQr(!showQr)} />
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-[30px] flex h-[56px] w-full items-center justify-center gap-[16px] rounded-full bg-white text-[20px] font-semibold text-[#F27423] shadow-[0_6px_22px_rgba(232,81,2,0.14)] transition hover:shadow-[0_8px_28px_rgba(232,81,2,0.22)] print:hidden"
          >
            Pdf yuborish
            <ShareBoxIcon className="size-[24px]" />
          </button>
        </div>
      </div>

      {!showQr && (
        <Link href="/" className="mt-10 inline-flex h-[56px] items-center rounded-[12px] bg-brand px-[21px] text-[24px] font-semibold text-white transition-colors hover:bg-brand-600 lg:mt-[75px] print:hidden">
          Bosh sahifaga qaytish
        </Link>
      )}
    </main>
  );
}

function Ticket({ b, v, receipt, code, qrLabel, onQr }: {
  b: Booking; v: VenueDetails | null; receipt: string; code: string; qrLabel: string; onQr: () => void;
}) {
  const rows: [string, string][] = [
    ["Holat", b.status ? STATUS_TEXT[b.status] : "Band qilish tasdiqlandi"],
    ["Chek raqami:", fmtReceipt(receipt)],
    ["Belgilandi:", `${b.time ?? "—"} • ${fmtDate(b.date)}`],
    b.type === "toyxona" ? ["Mehmonlar:", b.people ? `${b.people} kishi` : "—"] : ["Stol raqami:", b.table ? `${b.table} - stol` : "—"],
    [b.type === "toyxona" ? "To‘yxona raqami:" : "Restoran raqami:", v?.phone ?? "—"],
  ];
  // Chipta chetidagi yarim doira kesiklar (y = 420px, r = 20px) — mask bilan
  const notch = "radial-gradient(circle 20px at 0 420px, transparent 19.5px, #000 20px), radial-gradient(circle 20px at 100% 420px, transparent 19.5px, #000 20px)";
  return (
    <div className="drop-shadow-[0_6px_14px_rgba(232,81,2,0.13)]">
      <article
        className="relative h-[591px] w-full rounded-[16px] bg-white px-[20px] pt-[20px]"
        style={{ WebkitMaskImage: notch, maskImage: notch, WebkitMaskComposite: "source-in", maskComposite: "intersect" }}
      >
        <header className="flex gap-[17px]">
          <div className="relative h-[92px] w-[90px] shrink-0 overflow-hidden rounded-[10px] bg-[#EEE]">
            {v && <Image src={v.gallery[0]} alt={v.name} fill sizes="90px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <h1 className="-mt-[4.5px] truncate text-[18px] font-semibold leading-[22px] text-[#1E1E1E]">{b.venueName || v?.name}</h1>
            <p className="mt-[10px] flex items-center gap-[6px] text-[12px] text-[#646465]">
              <MapIcon className="size-[14px]" />{v?.distanceKm ?? 1} km
              <span className="h-[10px] w-px bg-[#646465]" />
              <span className="flex items-center gap-[4px] font-semibold text-[#3ACD3F]"><span className="size-[5px] rounded-full bg-[#3ACD3F]" />{v?.open === false ? "Yopiq" : "Ochiq"}</span>
            </p>
            <p className="mt-[6px] flex items-center gap-[8px] text-[12px] text-[#635858]"><CallIcon className="size-[14px]" />{v?.phone}</p>
            <p className="mt-[6px] flex items-center gap-[8px] truncate text-[12px] text-[#635858]"><LocationIcon className="size-[15px] shrink-0" /><span className="truncate">{v?.address}</span></p>
          </div>
        </header>

        <hr className="mt-[18px] border-[#8D8D8D]" />

        <dl className="mt-[16px] space-y-[17px] pr-[4px]">
          {rows.map(([k, val]) => (
            <div key={k} className="flex h-[19px] items-center justify-between gap-3 text-[16px]">
              <dt className="shrink-0 text-[#4C4C4C]">{k}</dt>
              <dd className="truncate font-medium text-[#1F1F1F]">{val}</dd>
            </div>
          ))}
        </dl>

        {(b.amount ?? 0) > 0 && (
          <div className="absolute inset-x-[19px] top-[331px] flex h-[41px] items-center justify-between rounded-full border border-brand bg-[#FFF6F1] px-[11px] text-brand">
            <span className="text-[16px]">Narx:</span>
            <span className="flex items-center gap-[10px] text-[18px] font-semibold"><CardIcon className="size-[24px]" />{fmtPrice(b.amount ?? 0)}</span>
          </div>
        )}

        <p className="absolute inset-x-0 top-[377px] text-center text-[24px] font-medium tabular-nums text-[#1F1F1F]">{fmtCode(code)}</p>
        <div className="absolute inset-x-[20px] top-[420px] border-t border-dashed border-[#8D8D8D] [border-image:repeating-linear-gradient(90deg,#8D8D8D_0_8px,transparent_8px_14px)_1]" />

        <button type="button" onClick={onQr} className="absolute left-1/2 top-[452px] flex -translate-x-1/2 flex-col items-center print:hidden" aria-label={qrLabel === "QR" ? "QR kodni yopish" : "QR kodni ko‘rsatish"}>
          <span className="grid h-[77px] w-[80px] place-items-center rounded-[16px] bg-brand text-white transition hover:bg-brand-600"><ScanIcon className="size-[52px]" /></span>
          <span className="mt-[15px] whitespace-nowrap text-[20px] font-medium text-[#1F1F1F]">{qrLabel}</span>
        </button>
      </article>
    </div>
  );
}
