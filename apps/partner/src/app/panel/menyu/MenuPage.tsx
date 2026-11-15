"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { basePrice, CATEGORIES, finalPrice, readMenu, som, type Dish } from "@bazmly/api/menu";
import { addItem, readOrders, type Order } from "@bazmly/api/orders";
import { iso } from "@bazmly/api/partnerBookings";
import { PlusIcon, SearchIcon } from "@bazmly/ui/icons";
import { useToast } from "@bazmly/ui/Toast";
import { Fit } from "@bazmly/ui/Fit";

// Figma: "Menyu" — kategoriyalar, qidiruv, "Taom qo'shish", taomlar to'ri (+ — buyurtmaga qo'shish)
export function MenuPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [menu, setMenu] = useState<Dish[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [local, setLocal] = useState("");
  const [pick, setPick] = useState<Dish | null>(null);
  const [added, setAdded] = useState(0);
  useEffect(() => { setMenu(readMenu()); setOrders(readOrders()); }, []);

  const cat = params.get("kategoriya");
  const orderId = params.get("buyurtma");
  const q = `${params.get("q") ?? ""} ${local}`.trim().toLowerCase();
  const set = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v === null) sp.delete(k); else sp.set(k, v);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  if (!menu) return null;
  if (!menu.length) return <EmptyMenu />;
  const order = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const shown = menu.filter((d) => (!cat || d.category === cat) && (!q || d.name.toLowerCase().includes(q)));
  const openOrders = orders.filter((o) => o.date === iso(new Date()) && o.status !== "yakunlandi");

  const addTo = (o: Order, d: Dish) => {
    setOrders(addItem(o.id, d));
    setAdded((n) => n + 1);
    toast(`${d.name} — Stol ${o.table} buyurtmasiga qo‘shildi`);
  };
  const plus = (d: Dish) => {
    if (order) return addTo(order, d);
    if (!openOrders.length) return toast("Ochiq buyurtma yo‘q — avval stolga buyurtma oching");
    setPick(d);
  };

  return (
    <main className="container-page pb-28 pt-8 font-sans md:pt-[67px]">
      <h1 className="text-[20px] font-bold leading-[26px] text-[#0F172A]">Menyu</h1>
      <div className="no-scrollbar -mx-4 mt-[14px] flex gap-[12px] overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Kategoriya">
        {CATEGORIES.map((c) => {
          const on = cat === c.id;
          const n = menu.filter((d) => d.category === c.id).length;
          return (
            <button key={c.id} type="button" aria-pressed={on} onClick={() => set("kategoriya", on ? null : c.id)}
              className={`flex h-[38px] min-w-[124px] shrink-0 items-center justify-center gap-[7px] rounded-full border px-[20.5px] font-inter text-[14px] transition-colors ${on ? "border-[#FFF0E5] bg-[#FFF0E5] text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FFC9A3]"}`}>
              {c.label}
              {on && <span className="grid size-[20.5px] place-items-center rounded-full bg-[#FF6A00] text-[11px] font-medium text-white">{n}</span>}
            </button>
          );
        })}
      </div>

      <p className="mt-[24px] text-[16px] font-medium leading-[20px] text-[#111827]">Menu&nbsp; ({shown.length} mahsulot)</p>
      <label className="mt-[12px] flex h-[44px] items-center gap-[12px] rounded-[12px] bg-[#F3F3F3] px-[16px]">
        <SearchIcon className="size-[22px] shrink-0 text-[#FF6A00]" />
        <input type="search" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Qidirish" aria-label="Menyudan qidirish"
          className="h-full w-full bg-transparent text-[16px] text-[#111827] outline-none placeholder:text-[#7A7A7A] [&::-webkit-search-cancel-button]:hidden" />
      </label>
      <Link href="/panel/menyu/yangi" className="mt-[20px] flex h-[58px] w-full items-center justify-center gap-[8px] rounded-[16px] bg-[#FF6A00] text-[20px] text-white transition-colors hover:bg-[#F06300]">
        Taom qo‘shish <PlusIcon className="size-[18px]" />
      </Link>

      {order && (
        <p className="mt-[16px] rounded-[12px] bg-[#FFF0E5] px-4 py-3 font-inter text-[14px] text-[#0F172A]">
          <b>Stol {order.table}</b> buyurtmasiga taom qo‘shyapsiz — taom ustidagi <b>+</b> ni bosing.
        </p>
      )}

      <ul className="mt-[20px] grid grid-cols-2 gap-x-4 gap-y-[18px] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-x-[47.5px] lg:gap-y-[18px]">
        {shown.map((d) => (
          <li key={d.id}>
            <div className="relative">
              <Link href={`/panel/menyu/yangi?id=${d.id}`} aria-label={`${d.name} — tahrirlash`} className="relative block aspect-[172.5/166] w-full overflow-hidden rounded-[12px] bg-[#F3F3F3]">
                {d.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={d.image} alt="" loading="lazy" className="size-full object-cover transition-transform hover:scale-[1.03]" />
                  : <span className="grid size-full place-items-center text-[40px] font-bold text-[#FFC9A3]">{d.name[0]}</span>}
                {d.active === false && <span className="absolute left-[8px] top-[8px] rounded-[6px] bg-black/60 px-2 py-0.5 font-inter text-[12px] text-white">Yashirin</span>}
                {!!d.discount && <span className="absolute right-[8px] top-[8px] rounded-[6px] bg-[#FF6A00] px-2 py-0.5 font-inter text-[12px] text-white">−{d.discount}%</span>}
              </Link>
              <button type="button" onClick={() => plus(d)} aria-label={`${d.name} — buyurtmaga qo‘shish`}
                className="absolute bottom-[6.5px] right-[7px] grid size-[44px] place-items-center rounded-full bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-transform hover:scale-105">
                <PlusIcon className="size-[20px]" />
              </button>
            </div>
            <p className="mt-[8px] text-[20px] font-semibold leading-[26px] text-black tabular-nums">{som(finalPrice(basePrice(d), d.discount))}</p>
            <p className="mt-[2px] truncate text-[15px] leading-[20px] text-black">{d.name}</p>
          </li>
        ))}
      </ul>
      {!shown.length && <p className="mt-10 text-center font-inter text-[14px] text-[#94A3B8]">Taom topilmadi</p>}

      {order && added > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <Link href="/panel/buyurtmalar?bolim=jarayonda" className="flex h-[56px] w-full max-w-[420px] items-center justify-between rounded-[16px] bg-[#0F172A] px-5 font-inter text-[15px] text-white shadow-xl">
            <span>Stol {order.table}: {added} ta taom qo‘shildi</span>
            <span className="font-semibold text-[#FFB480]">Buyurtmaga qaytish →</span>
          </Link>
        </div>
      )}

      {pick && (
        <Sheet title={`“${pick.name}” — qaysi buyurtmaga?`} onClose={() => setPick(null)}>
          <ul className="space-y-2">
            {openOrders.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => { addTo(o, pick); setPick(null); }} className="flex w-full items-center justify-between rounded-[12px] border border-[#E2E8F0] px-4 py-3 text-left font-inter hover:border-[#FF6A00]">
                  <span><b className="text-[#0F172A]">Stol {o.table}</b> <span className="text-[14px] text-[#64748B]">· {o.customer}</span></span>
                  <PlusIcon className="size-[16px] text-[#FF6A00]" />
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </main>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[85svh] w-full overflow-y-auto rounded-t-[20px] bg-white p-5 sm:max-w-[440px] sm:rounded-[20px] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 shrink-0 place-items-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Figma: "Hozircha menyu yo'q" — birinchi taomni kiritishga taklif
function EmptyMenu() {
  return (
    <main className="relative overflow-hidden pb-20 lg:pb-0">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute left-1/2 top-[230px] size-[460px] -translate-x-[115%] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.05),transparent_68%)]" />
        <div className="absolute left-1/2 top-[330px] size-[460px] -translate-x-[30%] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.10),transparent_66%)]" />
      </div>
      <Fit gap={24}>
      <div className="relative mx-auto flex max-w-[377px] flex-col items-center px-4 pt-16 text-center md:pt-[216.5px] md:fit-tight:pt-[65px]">
        <span className="grid size-[150px] place-items-center rounded-full bg-[#FFFAF7] md:size-[183.5px]" aria-hidden>
          <svg viewBox="0 0 72 72" className="size-[58px] md:size-[70px]" fill="none" stroke="#FF6A00" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6c9 3 22 14 31 24l-6 6C22 26 13 15 8 6zM33 36l25 26a4 4 0 01-5.6 5.6L27 42" />
            <path d="M64 6L45 25M58 4l-15 15M68 10L53 25M43 19a7 7 0 009 9L8 64a4 4 0 01-5.6-5.6z" />
          </svg>
        </span>
        <h1 className="mt-[40px] text-[24px] font-bold leading-[30px] text-[#111827]">Hozircha menyu yo‘q</h1>
        <p className="mt-[21.5px] font-inter text-[14px] leading-[18px] text-[#6B7280]">Buyurtmalarni oson belgilash uchun<br />menyuyingizni kiriting</p>
        <Link href="/panel/menyu/yangi" className="mt-[42px] flex h-[56.5px] w-full max-w-[345px] items-center justify-center gap-[12px] rounded-full bg-[#FF6A00] text-[16px] font-medium text-white transition-colors hover:bg-[#F06300]">
          Menyuni kiritish <PlusIcon className="size-[16px]" />
        </Link>
      </div>
      </Fit>
    </main>
  );
}
