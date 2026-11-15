"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { readAccount } from "@bazmly/api/partner";
import { basePrice, CATEGORIES, finalPrice, readMenu, removeDish, saveDish, som, type Dish, type Variant } from "@bazmly/api/menu";
import { readBranches, type Branch } from "@bazmly/api/staff";
import { useToast } from "@bazmly/ui/Toast";
import { PartnerCard, primaryBtn } from "@/components/PartnerCard";
import { shrinkImage } from "@/components/shrinkImage";

type Draft = {
  id?: string; name: string; description: string; image?: string; active: boolean;
  hasVariants: boolean; price: string; discount: string; variants: { name: string; price: string }[];
  category: string; branches: string[];
};
const KEY = "bazmly:partner:dish-draft";
const STEPS = ["Taom ma’lumotlari", "Narx va variantlar", "Filiallarga belgilash", "Ma’lumotlarni tasdiqlash"];
const empty = (): Draft => ({
  name: "", description: "", active: false, hasVariants: true, price: "", discount: "",
  variants: [{ name: "Kichik", price: "" }, { name: "O‘rtacha", price: "" }], category: CATEGORIES[0].id, branches: ["asosiy"],
});
const fromDish = (d: Dish): Draft => ({
  id: d.id, name: d.name, description: d.description ?? "", image: d.image, active: d.active !== false,
  hasVariants: !!d.variants?.length, price: String(d.price || ""), discount: d.discount ? String(d.discount) : "",
  variants: d.variants?.length ? d.variants.map((v) => ({ name: v.name, price: String(v.price) })) : [{ name: "", price: "" }],
  category: d.category, branches: d.branches ?? ["asosiy"],
});
const num = (s: string) => s.replace(/\D/g, "");
const spaced = (s: string) => (s ? Number(s).toLocaleString("ru-RU").replace(/\s/g, " ") : "");
const toVariants = (d: Draft): Variant[] => d.variants.filter((v) => v.name.trim() && Number(v.price) > 0).map((v) => ({ name: v.name.trim(), price: Number(v.price) }));

const ok1 = (d: Draft) => d.name.trim().length >= 2;
const ok2 = (d: Draft) => (d.hasVariants ? toVariants(d).length > 0 && d.variants.every((v) => (!v.name.trim() && !v.price) || (v.name.trim() && Number(v.price) > 0)) : Number(d.price) > 0)
  && (!d.discount || Number(d.discount) < 100);
const ok3 = (d: Draft) => d.branches.length > 0;

const label = "block font-sans text-[14px] leading-[18px] text-black";

// Figma: "Menyu" — yangi taom qo'shish (4 bosqich) va muvaffaqiyat oynasi
export function DishWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const step = Math.min(4, Math.max(1, Number(params.get("qadam") ?? 1)));
  const doneId = params.get("tayyor");
  const editId = params.get("id");
  const [d, setD] = useState<Draft | null>(null);
  const [places, setPlaces] = useState<{ id: string; name: string; sub: string }[]>([]);
  const [saved, setSaved] = useState<Dish | null>(null);

  useEffect(() => {
    const acc = readAccount();
    const br: Branch[] = readBranches();
    setPlaces([{ id: "asosiy", name: acc?.name ?? "Asosiy joy", sub: "Asosiy filial" }, ...br.map((b) => ({ id: b.id, name: b.name, sub: b.address }))]);
    if (doneId) { const dish = readMenu().find((x) => x.id === doneId); if (!dish) { router.replace("/panel/menyu"); return; } setSaved(dish); return; }
    let draft: Draft | null = null;
    try { draft = JSON.parse(sessionStorage.getItem(KEY) ?? "null"); } catch {}
    if (editId) {
      if (draft?.id !== editId) {
        const dish = readMenu().find((x) => x.id === editId);
        if (!dish) { router.replace("/panel/menyu"); return; }
        draft = fromDish(dish);
      }
    } else if (!draft || draft.id) draft = empty();
    if (step > 1 && !ok1(draft)) { router.replace(`/panel/menyu/yangi${editId ? `?id=${editId}` : ""}`); }
    setD(draft);
  }, [doneId, editId, step, router]);

  const patch = (p: Partial<Draft>) => setD((cur) => {
    const next = { ...(cur as Draft), ...p };
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  const go = (n: number) => {
    const sp = new URLSearchParams();
    if (editId) sp.set("id", editId);
    if (n > 1) sp.set("qadam", String(n));
    router.push(`/panel/menyu/yangi${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  if (doneId) return saved ? <Success dish={saved} /> : null;
  if (!d) return null;

  const valid = [ok1, ok2, ok3, () => true][step - 1](d);
  const next = () => {
    if (!valid) return;
    if (step < 4) return go(step + 1);
    const variants = d.hasVariants ? toVariants(d) : [];
    // TODO: backend — POST/PATCH /partner/menu
    const list = saveDish({
      id: d.id, name: d.name.trim(), description: d.description.trim() || undefined, image: d.image, active: d.active,
      variants: variants.length ? variants : undefined, price: variants.length ? Math.min(...variants.map((v) => v.price)) : Number(d.price),
      discount: Number(d.discount) || undefined, category: d.category, branches: d.branches,
    });
    try { sessionStorage.removeItem(KEY); } catch {}
    const id = d.id ?? list[0].id;
    router.replace(`/panel/menyu/yangi?tayyor=${id}${d.id ? "&tahrir=1" : ""}`);
  };
  const btnText = step === 1 ? (valid ? "Keyingisi" : "Tasdiqlash") : step === 4 ? (d.id ? "Saqlash" : "Tasdiqlash") : "Tasdiqlash";

  return (
    <PartnerCard inPanel title="Menyu" onBack={() => (step > 1 ? go(step - 1) : router.push("/panel/menyu"))}
      action={<button type="submit" form="dish-form" disabled={!valid} className={primaryBtn}>{btnText}</button>}>
      <div className="pt-2 sm:pt-[101px] sm:fit-tight:pt-[12px]">
        <Stepper step={step} />
        <form id="dish-form" noValidate onSubmit={(e) => { e.preventDefault(); next(); }} className={`mx-auto mt-8 w-full max-w-[720px] sm:px-0 ${step === 1 ? "sm:mt-[56px]" : "sm:mt-[55px] sm:h-[481px] sm:overflow-y-auto sm:pb-4"}`}>
          {step === 1 && <Step1 d={d} patch={patch} />}
          {step === 2 && <Step2 d={d} patch={patch} />}
          {step === 3 && <Step3 d={d} patch={patch} places={places} />}
          {step === 4 && <Step4 d={d} places={places} go={go} onRemove={() => {
            if (!d.id) return;
            removeDish(d.id); try { sessionStorage.removeItem(KEY); } catch {}
            toast(`${d.name} menyudan o‘chirildi`); router.replace("/panel/menyu");
          }} />}
          <button type="submit" hidden />
        </form>
      </div>
    </PartnerCard>
  );
}

function Stepper({ step, done = false }: { step: number; done?: boolean }) {
  return (
    <ol className="relative mx-auto flex w-[calc(100%-56px)] max-w-[720px] justify-between sm:w-full" aria-label="Bosqichlar">
      <span aria-hidden className="absolute left-[12px] right-[12px] top-[11px] h-[2px] bg-[#DADADA]" />
      <span aria-hidden className="absolute left-[12px] top-[11px] h-[2px] bg-[#E85102] transition-[width]" style={{ width: `calc((100% - 24px) * ${(Math.min(step, 4) - 1) / 3})` }} />
      {STEPS.map((s, i) => {
        const n = i + 1, past = done || n < step, cur = !done && n === step;
        return (
          <li key={s} className="relative flex w-[24px] flex-col items-center" aria-current={cur ? "step" : undefined}>
            <span className={`relative z-10 grid size-[24px] place-items-center rounded-full font-inter text-[11px] ${past || cur ? "bg-[#E85102] text-white" : "bg-[#DADADA] text-white"}`}>
              {past ? <svg viewBox="0 0 12 10" className="h-[9px] w-[11px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5.2l3.2 3.2L11 1.5" /></svg> : n}
            </span>
            <span className={`mt-[11px] w-[76px] text-center font-sans text-[11px] leading-[15px] sm:w-[96px] sm:text-[12px] sm:leading-[18px] ${past || cur ? "text-black" : "text-[#C7C7C7]"} ${i === 0 ? "sm:translate-x-0" : ""}`}>
              {s.split(" ").slice(0, -1).join(" ")}<br />{s.split(" ").slice(-1)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Toggle({ on, onChange, label: l }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={l} onClick={() => onChange(!on)}
      className={`relative h-[24px] w-[50px] shrink-0 rounded-full transition-colors ${on ? "bg-[#FF6A00]" : "bg-[#C7C7C7]"}`}>
      <span className={`absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left] ${on ? "left-[29px]" : "left-[3px]"}`} />
    </button>
  );
}

type P = { d: Draft; patch: (p: Partial<Draft>) => void };

function Step1({ d, patch }: P) {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const take = async (f?: File) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast("Faqat JPG yoki PNG rasm yuklang");
    if (f.size > 5 * 1024 * 1024) return toast("Rasm hajmi 5 MB dan oshmasin");
    try { patch({ image: await shrinkImage(f) }); } catch { toast("Rasmni o‘qib bo‘lmadi"); }
  };
  return (
    <div className="mx-auto grid max-w-[700px] gap-x-[31px] gap-y-5 sm:ml-[2px] sm:grid-cols-2 sm:gap-y-[16px]">
      <div>
        <span className={label}>Taom rasmi</span>
        <div
          role="button" tabIndex={0} aria-label={d.image ? "Rasmni almashtirish" : "Rasm yuklash"}
          onClick={() => file.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]); }}
          className={`group relative mt-[10px] grid h-[164px] cursor-pointer place-items-center overflow-hidden rounded-[8px] border-2 text-center transition-colors ${drag ? "border-[#FF6A00] bg-[#FFF8F3]" : "border-[#E5E7EB] hover:border-[#FFC9A3]"}`}
        >
          {d.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt="" className="absolute inset-0 size-full object-cover" />
              <span className="absolute bottom-2 right-2 rounded-[6px] bg-black/55 px-2 py-1 font-inter text-[12px] text-white opacity-0 transition-opacity group-hover:opacity-100">Almashtirish</span>
            </>
          ) : (
            <span className="flex flex-col items-center font-inter">
              <span className="grid size-[32px] place-items-center rounded-full bg-[#FFF0E5]" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-[20px] text-[#FF6A00]" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>
              </span>
              <span className="mt-[15px] font-sans text-[14px] font-medium text-black">Rasm yuklash</span>
              <span className="mt-[10px] font-sans text-[12px] text-[#6B7280]">JPG yoki PNG (Max 5MB)</span>
            </span>
          )}
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>
      <label className="block">
        <span className={label}>Qisqa tavsif</span>
        <textarea value={d.description} onChange={(e) => patch({ description: e.target.value.slice(0, 300) })} placeholder="Taom tarkibi va o‘ziga xosligi haqida qisqacha..."
          className="mt-[10px] h-[168px] w-full resize-none rounded-[8px] border border-[#E5E7EB] bg-white px-[16px] py-[12px] font-sans text-[16px] leading-[21px] text-black outline-none transition-colors placeholder:text-[#8B8987] focus:border-[#FF6A00]" />
      </label>
      <label className="block">
        <span className={label}>Taom nomi</span>
        <input value={d.name} onChange={(e) => patch({ name: e.target.value.slice(0, 60) })} placeholder="Masalan: Tovuqli shaurma"
          className="mt-[10px] h-[50px] w-full rounded-[8px] border border-[#E5E7EB] bg-white px-[16px] font-sans text-[16px] font-medium text-black outline-none transition-colors placeholder:font-normal placeholder:text-[#8B8987] focus:border-[#FF6A00]" />
      </label>
      <div className="flex h-[74px] items-center justify-between gap-3 self-end rounded-[8px] border border-[#E5E7EB] px-[16px]">
        <span>
          <span className="block font-sans text-[16px] leading-[20px] text-black" id="lbl-status">Status</span>
          <span className="block font-inter text-[12px] leading-[16px] text-[#6B7280]">Mijozlarga ko‘rinishi uchun yoqing</span>
        </span>
        <Toggle on={d.active} onChange={(v) => patch({ active: v })} label="Status — mijozlarga ko‘rinadi" />
      </div>
    </div>
  );
}

const box = "rounded-[12px] border border-[#F1ECE9] bg-white";
const field = "h-[42px] w-full rounded-[8px] border border-[#C6C6C6] bg-white px-[12px] font-sans text-[16px] text-black outline-none transition-colors placeholder:text-[#8B8987] focus:border-[#FF6A00]";

function Step2({ d, patch }: P) {
  const setV = (i: number, p: Partial<{ name: string; price: string }>) => patch({ variants: d.variants.map((v, j) => (j === i ? { ...v, ...p } : v)) });
  return (
    <div>
      <h2 className="text-[20px] font-bold leading-[26px] text-black">Narx va variantlar</h2>
      <div className={`${box} mt-[12px] flex min-h-[80px] items-center justify-between gap-3 px-[16px] py-3`}>
        <span>
          <span className="block text-[16px] font-medium leading-[20px] text-black">Variant mavjudmi?</span>
          <span className="mt-[4px] block text-[14px] leading-[18px] text-black">Portsiya o‘lchamlari bormi?</span>
        </span>
        <Toggle on={d.hasVariants} onChange={(v) => patch({ hasVariants: v })} label="Variant mavjudmi?" />
      </div>

      {!d.hasVariants && (
        <label className={`${box} mt-[20px] block px-[16px] pb-[18px] pt-[16px]`}>
          <span className="text-[16px] leading-[20px] text-black">Narxi (so‘m)</span>
          <input inputMode="numeric" value={spaced(d.price)} onChange={(e) => patch({ price: num(e.target.value).slice(0, 9) })} placeholder="0"
            className={`${field} mt-[12px] h-[46px] tabular-nums`} />
        </label>
      )}

      <div className={`${box} mt-[20px] px-[16px] pb-[18px] pt-[16px]`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-[12px] text-[16px] leading-[20px] text-black" id="lbl-disc">
            <svg viewBox="0 0 20 20" className="size-[19px] text-[#FF6A00]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M16 4L4 16" /><circle cx="5.5" cy="5.5" r="2.5" /><circle cx="14.5" cy="14.5" r="2.5" /></svg>
            Chegirma
          </span>
          <span className="rounded-[6px] bg-[#F3F4F6] px-[8px] py-[3px] font-inter text-[12px] text-[#6B7280]">Ixtiyoriy</span>
        </div>
        <div className="relative mt-[13px] sm:mr-[79px]">
          <input inputMode="numeric" aria-labelledby="lbl-disc" value={d.discount} onChange={(e) => patch({ discount: num(e.target.value).slice(0, 2) })} placeholder="0"
            className={`${field} h-[46px] pl-[12px] pr-10 tabular-nums`} />
          <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[16px] text-[#8B8987]" style={{ left: `${12 + Math.max(1, d.discount.length) * 9.5 + 6}px` }}>%</span>
        </div>
      </div>

      {d.hasVariants && (
        <>
          <h3 className="mt-[18.5px] text-[16px] font-semibold leading-[20px] text-black">Variantlar ro‘yxati</h3>
          <ul className="mt-[9.5px] space-y-[10px]">
            {d.variants.map((v, i) => (
              <li key={i} className={`${box} relative grid gap-3 px-[16px] pb-[16px] pt-[17px] pr-[56px] sm:gap-y-0 sm:grid-cols-[1fr_1fr] sm:gap-x-[76px] sm:pr-[130px]`}>
                <label className="block">
                  <span className="block font-sans text-[12px] leading-[14px] text-black">Nomi</span>
                  <input value={v.name} onChange={(e) => setV(i, { name: e.target.value.slice(0, 30) })} placeholder="Masalan: Katta" className={`${field} mt-[2px] h-[46px]`} />
                </label>
                <label className="block">
                  <span className="block font-sans text-[12px] leading-[14px] text-black">Narxi (so‘m)</span>
                  <input inputMode="numeric" value={spaced(v.price)} onChange={(e) => setV(i, { price: num(e.target.value).slice(0, 9) })} placeholder="0" className={`${field} mt-[2px] h-[46px] tabular-nums`} />
                </label>
                <button type="button" onClick={() => patch({ variants: d.variants.length > 1 ? d.variants.filter((_, j) => j !== i) : [{ name: "", price: "" }] })} aria-label={`${v.name || "Variant"}ni o‘chirish`}
                  className="absolute right-[16px] top-[22px] grid size-[36px] place-items-center rounded-full text-[#EF5B5B] hover:bg-[#FEF3F2] sm:right-[16px]">
                  <svg viewBox="0 0 24 24" className="size-[17px]" fill="currentColor" aria-hidden><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => patch({ variants: [...d.variants, { name: "", price: "" }] })} disabled={d.variants.length >= 8}
            className="mt-[12px] h-[44px] w-full rounded-[12px] border border-dashed border-[#FFC9A3] font-sans text-[15px] text-[#FF6A00] hover:bg-[#FFF8F3] disabled:opacity-40">
            + Variant qo‘shish
          </button>
        </>
      )}
    </div>
  );
}

function Step3({ d, patch, places }: P & { places: { id: string; name: string; sub: string }[] }) {
  const toggle = (id: string) => patch({ branches: d.branches.includes(id) ? d.branches.filter((x) => x !== id) : [...d.branches, id] });
  return (
    <div>
      <h2 className="text-[20px] font-bold leading-[26px] text-black">Filiallarga belgilash</h2>
      <p className="mt-[16px] text-[14px] font-medium text-black" id="lbl-cat">Kategoriya</p>
      <div className="mt-[10px] flex flex-wrap gap-[10px]" role="radiogroup" aria-labelledby="lbl-cat">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={d.category === c.id} onClick={() => patch({ category: c.id })}
            className={`h-[38px] rounded-full border px-[18px] font-inter text-[14px] transition-colors ${d.category === c.id ? "border-[#FFF0E5] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] text-[#475569] hover:border-[#FFC9A3]"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-[24px] flex items-center justify-between">
        <p className="text-[14px] font-medium text-black">Qaysi joylarda sotiladi?</p>
        <button type="button" onClick={() => patch({ branches: d.branches.length === places.length ? [] : places.map((p) => p.id) })} className="font-inter text-[13px] text-[#FF6A00] hover:underline">
          {d.branches.length === places.length ? "Hammasini olib tashlash" : "Hammasini tanlash"}
        </button>
      </div>
      <ul className="mt-[10px] space-y-[10px]">
        {places.map((p) => {
          const on = d.branches.includes(p.id);
          return (
            <li key={p.id}>
              <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-[14px] rounded-[12px] border px-[16px] py-[14px] text-left transition-colors ${on ? "border-[#FF6A00] bg-[#FFF8F3]" : "border-[#F1ECE9] hover:border-[#FFC9A3]"}`}>
                <span className={`grid size-[22px] shrink-0 place-items-center rounded-[6px] border-2 ${on ? "border-[#FF6A00] bg-[#FF6A00] text-white" : "border-[#C6C6C6]"}`} aria-hidden>
                  {on && <svg viewBox="0 0 12 10" className="h-[9px] w-[11px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5.2l3.2 3.2L11 1.5" /></svg>}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-medium text-black">{p.name}</span>
                  <span className="block truncate font-inter text-[13px] text-[#6B7280]">{p.sub}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {places.length === 1 && (
        <p className="mt-[12px] font-inter text-[13px] text-[#6B7280]">Filiallaringiz yo‘q. <Link href="/panel/filiallar/yangi" className="text-[#FF6A00] hover:underline">Filial qo‘shish</Link></p>
      )}
    </div>
  );
}

function Step4({ d, places, go, onRemove }: { d: Draft; places: { id: string; name: string }[]; go: (n: number) => void; onRemove: () => void }) {
  const variants = d.hasVariants ? toVariants(d) : [];
  const price = variants.length ? Math.min(...variants.map((v) => v.price)) : Number(d.price);
  const row = (k: string, v: React.ReactNode, step: number) => (
    <div className="relative grid gap-1 border-t border-[#F1ECE9] py-[12px] pr-[96px] first:border-0 sm:grid-cols-[130px_1fr] sm:gap-4">
      <span className="font-inter text-[13px] text-[#6B7280] sm:text-[14px]">{k}</span>
      <span className="min-w-0 text-[15px] text-black">{v}</span>
      <button type="button" onClick={() => go(step)} className="absolute right-0 top-[12px] font-inter text-[13px] text-[#FF6A00] hover:underline">O‘zgartirish</button>
    </div>
  );
  return (
    <div>
      <h2 className="text-[20px] font-bold leading-[26px] text-black">Ma’lumotlarni tasdiqlash</h2>
      <div className={`${box} mt-[12px] flex gap-[16px] p-[16px]`}>
        <span className="grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[#F3F3F3] text-[32px] font-bold text-[#FFC9A3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.image ? <img src={d.image} alt="" className="size-full object-cover" /> : d.name[0]}
        </span>
        <span className="min-w-0">
          <span className="block text-[18px] font-semibold text-black">{d.name}</span>
          <span className="mt-1 block line-clamp-2 font-inter text-[14px] text-[#6B7280]">{d.description || "Tavsif kiritilmagan"}</span>
          <span className="mt-2 block text-[16px] font-semibold text-[#FF6A00]">
            {variants.length > 1 ? "dan " : ""}{som(finalPrice(price, Number(d.discount)))}
            {!!Number(d.discount) && <s className="ml-2 text-[13px] font-normal text-[#94A3B8]">{som(price)}</s>}
          </span>
        </span>
      </div>
      <div className={`${box} mt-[12px] px-[16px]`}>
        {row("Kategoriya", CATEGORIES.find((c) => c.id === d.category)?.label, 3)}
        {row("Narx", variants.length ? variants.map((v) => `${v.name} — ${som(v.price)}`).join(", ") : som(price), 2)}
        {row("Chegirma", Number(d.discount) ? `${Number(d.discount)}%` : "Yo‘q", 2)}
        {row("Joylar", places.filter((p) => d.branches.includes(p.id)).map((p) => p.name).join(", "), 3)}
        {row("Status", d.active ? "Mijozlarga ko‘rinadi" : "Yashirin (mijozlarga ko‘rinmaydi)", 1)}
      </div>
      {d.id && <button type="button" onClick={onRemove} className="mt-[16px] font-inter text-[14px] text-[#D92D20] hover:underline">Taomni menyudan o‘chirish</button>}
    </div>
  );
}

function Success({ dish }: { dish: Dish }) {
  const router = useRouter();
  const params = useSearchParams();
  const edited = params.get("tahrir") === "1";
  const cat = CATEGORIES.find((c) => c.id === dish.category)?.label ?? "Menyu";
  return (
    <PartnerCard inPanel title="Menyu" onBack={() => router.push("/panel/menyu")} className="sm:min-h-[841px] sm:pb-[28px] sm:fit-tight:min-h-0">
      <div className="pt-2 sm:pt-[101px] sm:fit-tight:pt-[12px]">
        <Stepper step={4} done />
        <div className="mx-auto mt-10 flex max-w-[344.5px] flex-col items-center text-center sm:mt-[40.5px]">
          <span className="grid size-[96px] place-items-center rounded-full bg-[#22C55E]" aria-hidden>
            <svg viewBox="0 0 40 30" className="h-[30px] w-[40px] text-white" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15.5l11 11L37 3.5" /></svg>
          </span>
          <h2 className="mt-[40px] max-w-[240px] text-[30px] font-bold leading-[38px] text-[#0F172A]">Muvaffaqiyatli yakunlandi</h2>
          <p className="mt-[14px] max-w-[190px] text-[18px] leading-[23px] text-[#64748B]">{edited ? "Taom muvaffaqiyatli saqlandi" : "Taom muvaffaqiyatli qo‘shildi"}</p>
          <div className="mt-[34.5px] flex w-full max-w-[326.5px] items-center gap-[16px] rounded-[16px] border border-[#F1F5F9] bg-[#F8FAFC] px-[16px] py-[18px] text-left">
            <span className="grid size-[66px] shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[#E2E8F0] text-[24px] font-bold text-[#94A3B8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {dish.image ? <img src={dish.image} alt="" className="size-full object-cover" /> : dish.name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] leading-[18px] text-[#FF6A00]">{edited ? "Yangilandi" : "Yangi"}</span>
              <span className="mt-[4px] block truncate text-[16px] leading-[20px] text-[#0F172A]">{dish.name}</span>
              <span className="mt-[6px] block text-[14px] leading-[19px] text-[#64748B]">{cat} • {finalPrice(basePrice(dish), dish.discount).toLocaleString("en-US")} so‘m</span>
            </span>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#DCFCE7] text-[#22C55E]" aria-hidden>
              <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 6.5l4 4L14.5 1.5" /></svg>
            </span>
          </div>
          <Link href="/panel/menyu/yangi" className="mt-[44.5px] flex h-[56px] w-full items-center justify-center rounded-full bg-[#FF6A00] text-[20px] font-semibold text-white transition-colors hover:bg-[#F06300]">Taom qo‘shish</Link>
          <Link href="/panel/menyu" className="mt-[12px] flex h-[56px] w-full items-center justify-center rounded-full bg-[#E5E5E5] text-[20px] text-black transition-colors hover:bg-[#DADADA]">Menyuga qaytish</Link>
        </div>
      </div>
    </PartnerCard>
  );
}
