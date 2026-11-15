"use client";

import { useEffect, useState } from "react";
import { ACCOUNT_EVENT, readAccount } from "@bazmly/api/partner";

/** Muassasa rasmi: yuklangan bo'lsa — o'sha, bo'lmasa namunaviy rasm */
export function useVenueAvatar() {
  const [src, setSrc] = useState("/avatar.webp");
  useEffect(() => {
    const sync = () => setSrc(readAccount()?.avatar || "/avatar.webp");
    sync();
    window.addEventListener(ACCOUNT_EVENT, sync);
    return () => window.removeEventListener(ACCOUNT_EVENT, sync);
  }, []);
  return src;
}

export function VenueAvatar({ className = "" }: { className?: string }) {
  const src = useVenueAvatar();
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`rounded-full object-cover ${className}`} />;
}
