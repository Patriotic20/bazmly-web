import Link from "next/link";

// Dizayni hali kelmagan panel bo'limlari uchun vaqtinchalik sahifa
export function SoonSection({ title, text }: { title: string; text: string }) {
  return (
    <main className="container-page pt-10 md:pt-[58px]">
      <h1 className="text-[24px] font-bold text-ink md:text-[28px]">{title}</h1>
      <div className="mt-6 rounded-[24px] bg-[#F0F0F0] px-6 py-10 text-center md:py-16">
        <p className="text-[18px] font-semibold text-ink">Bu bo‘lim tez orada qo‘shiladi</p>
        <p className="mx-auto mt-2 max-w-[460px] text-[15px] text-muted">{text}</p>
        <Link href="/panel/kutilayotgan" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-[16px] text-white hover:bg-brand-600">
          Kutilayotgan mijozlar
        </Link>
      </div>
    </main>
  );
}
