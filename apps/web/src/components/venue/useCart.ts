"use client";

import { useCallback, useEffect, useState } from "react";
import type { MenuItem } from "@bazmly/api/venues";

export type CartLine = { item: MenuItem; qty: number };

// Savat joy bo'yicha sessionStorage'da saqlanadi — keyingi (bron) qadamda o'qiladi
export const cartKey = (venueId: string) => `bazmly:cart:${venueId}`;

export function useCart(venueId: string, menu: MenuItem[]) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem(cartKey(venueId)) ?? "[]") as { id: string; qty: number }[];
      setLines(raw.flatMap((r) => {
        const item = menu.find((m) => m.id === r.id);
        return item && r.qty > 0 ? [{ item, qty: r.qty }] : [];
      }));
    } catch {}
  }, [venueId, menu]);

  const save = (next: CartLine[]) => {
    try { sessionStorage.setItem(cartKey(venueId), JSON.stringify(next.map((l) => ({ id: l.item.id, qty: l.qty })))); } catch {}
    return next;
  };

  const add = useCallback((item: MenuItem) => setLines((ls) => {
    const found = ls.find((l) => l.item.id === item.id);
    return save(found ? ls.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { item, qty: 1 }]);
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const dec = useCallback((id: string) => setLines((ls) =>
    save(ls.flatMap((l) => (l.item.id !== id ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : [])))
  ), []); // eslint-disable-line react-hooks/exhaustive-deps

  const qty = (id: string) => lines.find((l) => l.item.id === id)?.qty ?? 0;
  const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return { lines, add, dec, qty, total, count };
}
