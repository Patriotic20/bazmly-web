import { useMemo } from "react";
import qrcode from "@/lib/vendor/qrcode-generator";

// QR kod — SVG, har bir modul aniq piksel (xira bo'lmaydi)
export function QrCode({ value, className = "", title = "QR kod" }: { value: string; className?: string; title?: string }) {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { d, n };
  }, [value]);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className={className} role="img" aria-label={title} shapeRendering="crispEdges">
      <path d={d} fill="#000" />
    </svg>
  );
}
