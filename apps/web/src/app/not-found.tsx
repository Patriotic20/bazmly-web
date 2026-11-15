import Link from "next/link";
import { BazmlyMark } from "@bazmly/ui/BazmlyMark";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-white dark:bg-[#2C2C2C] px-4 text-center">
      <div>
        <BazmlyMark className="mx-auto h-16 w-auto text-brand" />
        <h1 className="mt-6 text-[28px] font-bold text-[#181818] dark:text-[#FFFFFF]">Sahifa topilmadi</h1>
        <p className="mt-2 text-[16px] text-[#646464] dark:text-[#CFCFCF]">Bu joy mavjud emas yoki o‘chirib yuborilgan.</p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-8 text-[16px] font-semibold text-white hover:bg-brand-600">
          Asosiy sahifaga qaytish
        </Link>
      </div>
    </main>
  );
}
