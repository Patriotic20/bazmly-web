"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { promos } from "@bazmly/api/venues";

const GAP = 10;
const N = promos.length;
// Cheksiz aylanish uchun ro'yxat 3 marta takrorlanadi, o'rtadagisidan boshlanadi
const items = [...promos, ...promos, ...promos];

// Figma: "reklam" — 354×199 bannerlar, ostida 4 nuqta. Telefonda banner ekran kengligining 85%.
export function PromoCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(354 + GAP);
  const [pos, setPos] = useState(N);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const active = ((pos % N) + N) % N;

  // banner kengligi ekranga qarab o'zgaradi — qadamni o'lchab olamiz
  useEffect(() => {
    const el = trackRef.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const ro = new ResizeObserver(() => setStep(el.offsetWidth + GAP));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((next: number) => { setAnimate(true); setPos(next); }, []);

  const onEnd = () => {
    if (pos >= 2 * N || pos < N) {
      setAnimate(false);
      setPos(N + active);
    }
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(pos + 1), 5000);
    return () => clearInterval(t);
  }, [pos, paused, go]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        className="relative overflow-hidden rounded-[16px] sm:rounded-none"
        aria-roledescription="karusel"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={(e) => {
          if (touch.current != null) {
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 40) go(pos + (dx < 0 ? 1 : -1));
          }
          touch.current = null;
          setPaused(false);
        }}
      >
        <div
          ref={trackRef}
          onTransitionEnd={onEnd}
          className={`flex gap-[10px] ${animate ? "transition-transform duration-500 ease-out" : ""}`}
          style={{ transform: `translateX(${-pos * step}px)` }}
        >
          {items.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              aria-hidden={i < pos || i > pos + 3}
              className="relative aspect-[354/199] w-[85%] shrink-0 overflow-hidden rounded-[16px] sm:w-[354px]"
            >
              <Image src={p.image} alt={p.alt} fill sizes="(min-width: 640px) 354px, 85vw" className="object-cover" priority={i >= N && i < N + 4} />
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-[10px] h-[10px]">
        <div className="absolute left-1/2 flex -translate-x-1/2 gap-[6px] xl:left-[694px] xl:translate-x-0">
          {promos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(N + i)}
              aria-label={`${i + 1}-banner`}
              aria-current={i === active}
              className={`size-[10px] rounded-full transition-colors ${i === active ? "bg-brand" : "bg-[#D9D9D9] dark:bg-white"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
