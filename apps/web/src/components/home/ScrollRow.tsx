"use client";

import { useEffect, useRef, useState } from "react";

// Gorizontal suriladigan qator: telefonda barmoq bilan, kompyuterda strelkalar bilan
export function ScrollRow({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);

  const by = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 10), behavior: "smooth" });
  };

  const btn =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white dark:bg-[#2C2C2C] text-ink dark:text-[#FFFFFF] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition hover:bg-brand hover:text-white md:grid";

  return (
    <div className="group/row relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-[10px] overflow-x-auto px-4 md:mx-0 md:px-0 md:scroll-px-0"
      >
        {children}
      </div>
      {!edge.start && (
        <button type="button" aria-label="Oldingilar" onClick={() => by(-1)} className={`${btn} -left-5`}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      )}
      {!edge.end && (
        <button type="button" aria-label="Keyingilar" onClick={() => by(1)} className={`${btn} -right-5`}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
    </div>
  );
}
