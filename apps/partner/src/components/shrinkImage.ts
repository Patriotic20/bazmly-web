/** Rasmni 640px gacha kichraytirib data-URL qiladi (backend ulanguncha brauzer xotirasida saqlash uchun) */
export function shrinkImage(file: File, max = 640): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL("image/webp", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); rej(new Error("image")); };
    img.src = URL.createObjectURL(file);
  });
}
