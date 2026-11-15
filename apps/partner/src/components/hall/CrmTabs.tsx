"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readEvents, readSettings, reminders } from "@bazmly/api/hall";

const TABS = [
  { href: "/panel/toyxona", label: "Kalendar" },
  { href: "/panel/toyxona/bronlar", label: "Bronlar" },
  { href: "/panel/toyxona/tolovlar", label: "To‘lovlar" },
  { href: "/panel/toyxona/eslatmalar", label: "Eslatmalar" },
  { href: "/panel/toyxona/hisobot", label: "Hisobotlar" },
  { href: "/panel/toyxona/paketlar", label: "Zallar va narxlar" },
];

/** To'yxona CRM bo'limlari (Kalendar · Bronlar · To'lovlar · Zallar va narxlar) */
export function CrmTabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  // Eslatmalar soni (bajarilmaganlar)
  const [due, setDue] = useState(0);
  useEffect(() => { try { setDue(reminders(readEvents(), readSettings()).length); } catch {} }, [pathname]);
  return (
    <nav aria-label="To‘yxona bo‘limlari" className={`no-scrollbar -mx-4 flex gap-[6px] overflow-x-auto px-4 md:mx-0 md:px-0 ${className}`}>
      <div className="flex shrink-0 gap-[4px] rounded-[12px] bg-[#F4F5F7] p-[4px]">
        {TABS.map((t) => {
          const on = t.href === "/panel/toyxona" ? pathname === t.href : pathname.startsWith(t.href) || (t.href.endsWith("bronlar") && (pathname.startsWith("/panel/toyxona/bron") || pathname.startsWith("/panel/toyxona/tadbir")));
          return (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
              className={`flex h-[36px] items-center whitespace-nowrap rounded-[9px] px-[16px] font-inter text-[14px] font-medium transition-colors ${on ? "bg-white text-[#0F172A] shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-[#64748B] hover:text-[#0F172A]"}`}>
              {t.label}
              {t.href.endsWith("eslatmalar") && due > 0 && <span className="ml-1.5 grid grid-cols-[minmax(0,1fr)] h-[18px] min-w-[18px] place-items-center rounded-full bg-[#FF6A00] px-1 text-[11px] font-semibold text-white">{due}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Bosqich belgisi */
export function StageBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex h-[22px] items-center gap-[6px] whitespace-nowrap rounded-full px-[9px] font-inter text-[12px] font-medium" style={{ background: `${color}1A`, color }}>
      <i className="size-[6px] rounded-full" style={{ background: color }} />{label}
    </span>
  );
}

/** To'lov holati chizig'i */
export function PaidBar({ paid, total }: { paid: number; total: number }) {
  const pct = total ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <span className="block h-[6px] w-full overflow-hidden rounded-full bg-[#EEF0F3]" role="img" aria-label={`${pct}% to‘langan`}>
      <span className={`block h-full rounded-full ${pct >= 100 ? "bg-[#22C55E]" : "bg-[#FF6A00]"}`} style={{ width: `${pct}%` }} />
    </span>
  );
}
