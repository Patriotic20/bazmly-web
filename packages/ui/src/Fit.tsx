"use client";

import { useLayoutEffect, useRef } from "react";

/** Kompyuter ekrani (≥1024px): sahifa bitta oynaga sig'ishi kerak */
export const DESKTOP = "(min-width: 1024px)";

/**
 * Kontentni ekranning qolgan balandligiga sig'diradi (faqat kompyuterda):
 *  1) avval bo'sh joy qisqaradi — ichidagi `fit-tight:` klasslari ishlaydi (masalan, kartaning min-balandligi olib tashlanadi);
 *  2) shunda ham sig'masa — kontent proporsional ixchamlashadi (CSS zoom), lekin `min` dan kichik emas;
 *  3) o'shanda ham sig'masa — atrofdagi bo'lim (data-screen) ichida aylantiriladi.
 * Telefon va planshetda hech narsa o'zgarmaydi.
 */
export function Fit({ children, className = "", min = 0.75, gap = 16, fill = 0 }: {
  children: React.ReactNode; className?: string;
  /** Eng kichik masshtab (matn o'qiladigan bo'lib qolishi uchun) */
  min?: number;
  /** Pastdan qoladigan bo'sh joy, px */
  gap?: number;
  /**
   * >0 bo'lsa — "ekranni to'ldirish" rejimi: dizayn ekranga sig'masa, bo'sh joylar qisqaradi va kontent
   * ekran balandligigacha kattalashtiriladi (shu qiymatgacha, masalan 1.3). Karta balandligi ekranni to'ldiradi
   * (`fit-tight:min-h-[var(--fit-min)]`).
   */
  fill?: number;
}) {
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const mq = matchMedia(DESKTOP);
    let busy = false;
    const run = () => {
      if (busy) return;
      busy = true;
      el.style.zoom = "";
      el.removeAttribute("data-tight");
      el.style.removeProperty("--fit-min");
      if (mq.matches) {
        const screen = el.closest<HTMLElement>("[data-screen]");
        const bottom = screen ? screen.getBoundingClientRect().bottom : window.innerHeight;
        const avail = bottom - el.getBoundingClientRect().top - gap;
        const h0 = el.offsetHeight;
        const zoom = (h: number) => { if (h > avail) el.style.zoom = String(Math.max(min, Math.floor((avail / h) * 1000) / 1000)); };
        if (h0 <= avail) {
          // Dizayn sig'adi. "To'ldirish" rejimida (1760px dan tor ekranda) bo'sh joy ko'p bo'lsa — kattalashtiriladi;
          // Figma o'lchamida (1920) esa aynan dizayndek qoladi
          if (fill && window.innerWidth < 1760) {
            const inner = (el.firstElementChild as HTMLElement | null)?.offsetWidth || el.clientWidth;
            const z = Math.min(fill, el.clientWidth / inner, Math.floor((avail / h0) * 1000) / 1000);
            if (z > 1.02) el.style.zoom = String(z);
          }
        }
        // Ozgina oshsa — faqat biroz kichraytiriladi (dizayn o'zgarmaydi); ko'p oshsa — avval bo'sh joylar qisqaradi
        else if (!fill && h0 * 0.9 <= avail) zoom(h0);
        else if (!fill) { el.setAttribute("data-tight", ""); zoom(el.offsetHeight); }
        else {
          el.setAttribute("data-tight", "");
          const h1 = el.offsetHeight;
          // Kenglik ham chegaralaydi: kontent konteynerdan kengayib ketmasin
          const inner = (el.firstElementChild as HTMLElement | null)?.offsetWidth || el.clientWidth;
          const z = Math.max(min, Math.min(fill, el.clientWidth / inner, Math.floor((avail / h1) * 1000) / 1000));
          if (z !== 1) el.style.zoom = String(z);
          el.style.setProperty("--fit-min", `${Math.floor(avail / z)}px`);
        }
      }
      busy = false;
    };
    run();
    const ro = new ResizeObserver(() => run());
    ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    window.addEventListener("resize", run);
    mq.addEventListener("change", run);
    document.fonts?.ready.then(run).catch(() => {});
    return () => { ro.disconnect(); window.removeEventListener("resize", run); mq.removeEventListener("change", run); };
  }, [min, gap, fill]);

  return <div ref={box} className={`group/fit ${className}`}>{children}</div>;
}

/**
 * Sarlavha ostidagi ekran qismi (kompyuterda — qolgan balandlik, ichida aylanadi).
 * Ichidagi elementlar uchun `--screen-h` (shu qismning balandligi) beriladi.
 */
export function Screen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const e = el.current;
    if (!e) return;
    const set = () => e.style.setProperty("--screen-h", `${e.clientHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(e);
    return () => ro.disconnect();
  }, []);
  return <div ref={el} data-screen className={`lg:min-h-0 lg:flex-1 lg:overflow-y-auto ${className}`}>{children}</div>;
}
