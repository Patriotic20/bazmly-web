"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BazmlyMark } from "@bazmly/ui/BazmlyMark";
import { useToast } from "@bazmly/ui/Toast";
import { FrameButton, ProfileFrame } from "./ProfileFrame";

type Note = { id: string; text: string; at: number; read?: boolean };
const KEY = "bazmly:notifications";
const H = 3600_000, D = 24 * H;

// Namunaviy xabarlar (backend ulanganda API'dan keladi)
function seed(now: number): Note[] {
  return [
    { id: "n1", text: "Bazmly yanada qulay bo‘ldi! 🚀 Yangi imkoniyatlarni hoziroq ko‘ring", at: now - 2 * H },
    { id: "n2", text: "Rest One’da shu hafta 10% chegirma 🎉", at: now - 2 * D },
    { id: "n3", text: "Yangi to‘yxonalar qo‘shildi: Sayqal va Panorama", at: now - 4 * D, read: true },
    { id: "n4", text: "Profilingizni to‘ldiring va maxsus takliflardan birinchi bo‘lib xabardor bo‘ling", at: now - 12 * D, read: true },
    { id: "n5", text: "Bazmly’ga xush kelibsiz! Restoran va to‘yxonalarni bir necha soniyada band qiling", at: now - 20 * D, read: true },
  ];
}
function readNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    const s = seed(Date.now()); localStorage.setItem(KEY, JSON.stringify(s)); return s;
  } catch { return seed(Date.now()); }
}
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (t: number) => { const d = new Date(t); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// Figma: Xabarlar — Bugun / Shu hafta / Shu oy, o'qilmagani to'q sariq fonda va qizil nuqta bilan
export function NotificationsView() {
  const router = useRouter();
  const toast = useToast();
  const [notes, setNotes] = useState<Note[] | null>(null);
  useEffect(() => setNotes(readNotes()), []);

  const groups = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const g: { title: string; items: Note[] }[] = [
      { title: "Bugun", items: [] }, { title: "Shu hafta", items: [] }, { title: "Shu oy", items: [] }, { title: "Avvalroq", items: [] },
    ];
    for (const n of [...(notes ?? [])].sort((a, b) => b.at - a.at)) {
      g[n.at >= today ? 0 : n.at >= today - 6 * D ? 1 : n.at >= today - 30 * D ? 2 : 3].items.push(n);
    }
    return g.filter((x) => x.items.length);
  }, [notes]);

  const markAll = () => {
    const next = (notes ?? []).map((n) => ({ ...n, read: true }));
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setNotes(next);
    toast("Barcha xabarlar o‘qildi");
    router.push("/profil");
  };
  const open = (id: string) => {
    const next = (notes ?? []).map((n) => (n.id === id ? { ...n, read: true } : n));
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setNotes(next);
  };

  return (
    <ProfileFrame scroll title="Xabarlar" onBack={() => router.push("/profil")} footer={<FrameButton onClick={markAll}>Tasdiqlash</FrameButton>}>
      <div className="px-4 pb-10 sm:px-[29px] xl:pb-[110px]">
        {notes && !notes.length && <p className="py-20 text-center text-[16px] text-[#646464] dark:text-[#CFCFCF]">Hozircha xabarlar yo‘q</p>}
        {groups.map((g, gi) => (
          <section key={g.title} className={gi ? "mt-[19.5px] border-t border-[#E5E5E5] dark:border-[#6C6C6C] pt-[22px]" : "pt-[4.5px]"}>
            <h2 className="text-[20px] font-semibold leading-[24px] text-black dark:text-[#FFFFFF]">{g.title}</h2>
            <ul className="mt-[23.5px] space-y-[22px]">
              {g.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button" onClick={() => open(n.id)}
                    className={`relative flex min-h-[90px] w-full items-center gap-[17px] rounded-[16px] px-[18px] py-3 text-left transition-colors ${n.read ? "bg-[#F0F0F0] dark:bg-[#393939]" : "bg-[#FDEEE3] dark:bg-[#483126]"}`}
                  >
                    {!n.read && <span aria-label="o‘qilmagan" className="absolute right-[1px] top-[0px] size-[11.5px] rounded-full bg-[#F33]" />}
                    <span className="grid size-[56px] shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#FF7A1A] to-[#E85102] text-white">
                      <BazmlyMark className="h-[26px] w-[24px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium leading-[20px] text-black dark:text-[#FFFFFF] sm:text-[16px]">{n.text}</span>
                      <span className={`mt-[10px] block text-[14px] leading-[18px] ${n.read ? "text-[#646464] dark:text-[#CFCFCF]" : "text-brand"}`}>{fmt(n.at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ProfileFrame>
  );
}
