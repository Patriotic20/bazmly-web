"use client";

import { useEffect, useState } from "react";
import { BazmlyMark } from "@bazmly/ui/BazmlyMark";
import { BazmlyLogo } from "@bazmly/ui/BazmlyLogo";


// Figma kadrlari: 1) to'q sariq fon + oq "B" (97×106)
//                 2) to'q sariq doira markazga qisqaradi, oq fon ochiladi
//                 3) oq fonda to'q sariq "Bazmly" logotipi (390×96)
//                 4) (ixtiyoriy, hamkor paneli) yuklanish halqasi
const T = { reveal: 1000, logo: 1250, fade: 2700, done: 3100 };
const S = 900; // yuklanish halqasi davomiyligi

type Phase = "mark" | "reveal" | "logo" | "spinner" | "fade" | "done";

export function Splash({ spinner = false }: { spinner?: boolean }) {
  const [phase, setPhase] = useState<Phase>("mark");

  useEffect(() => {
    const extra = spinner ? S : 0;
    const timers = [
      setTimeout(() => setPhase("reveal"), T.reveal),
      setTimeout(() => setPhase("logo"), T.logo),
      ...(spinner ? [setTimeout(() => setPhase("spinner"), T.fade)] : []),
      setTimeout(() => setPhase("fade"), T.fade + extra),
      setTimeout(() => setPhase("done"), T.done + extra),
    ];
    return () => timers.forEach(clearTimeout);
  }, [spinner]);

  if (phase === "done") return null;

  const revealed = phase !== "mark";
  const showLogo = phase === "logo" || (phase === "fade" && !spinner);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] overflow-hidden bg-white dark:bg-[#2C2C2C] transition-opacity duration-400 ease-out ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* 3-kadr: oq fonda logotip */}
      <div className="absolute inset-0 grid place-items-center">
        <BazmlyLogo
          className={`h-auto w-[min(390px,78vw)] text-brand dark:text-white transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
            showLogo ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        />
      </div>

      {/* 4-kadr: yuklanish halqasi (Figma: 56px, kulrang gradient) */}
      {spinner && (
        <div className={`absolute inset-0 grid place-items-center transition-opacity duration-300 ${phase === "spinner" || phase === "fade" ? "opacity-100" : "opacity-0"}`}>
          <span className="size-[56px] animate-[spin_900ms_linear_infinite] rounded-full" style={{ background: "conic-gradient(from 0deg, #F2F2F2, #C7C7C7)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8.5px))", mask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8.5px))" }} />
        </div>
      )}

      {/* 1–2-kadr: to'q sariq doira markazga qisqaradi */}
      <div
        className="absolute inset-0 grid place-items-center bg-brand text-white transition-[clip-path] duration-700 ease-[cubic-bezier(.7,0,.3,1)]"
        style={{ clipPath: revealed ? "circle(0% at 50% 50%)" : "circle(75% at 50% 50%)" }}
      >
        <BazmlyMark
          className={`h-[106.23px] w-[97px] transition-transform duration-500 ease-in ${
            revealed ? "scale-[.3]" : "scale-100"
          } animate-[splash-in_600ms_cubic-bezier(.2,.8,.2,1)_both]`}
        />
      </div>
    </div>
  );
}
