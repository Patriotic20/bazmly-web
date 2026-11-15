"use client";

import { createContext, useCallback, useContext, useState } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout((show as unknown as { t?: number }).t);
    (show as unknown as { t?: number }).t = window.setTimeout(() => setMsg(null), 2500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center">
        {msg && <div role="status" className="rounded-full bg-ink px-5 py-2.5 text-[14px] text-white shadow-lg">{msg}</div>}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
