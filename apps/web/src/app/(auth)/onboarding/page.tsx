import Image from "next/image";
import Link from "next/link";

// Figma: "Bazmly" 1920×1080 — onboarding (3342:12128).
// hd (≥1760) — Figma'ning aynan o'lchamlari; kichikroq ekranlarda proporsional kichrayadi,
// lg dan kichikda rasm tepaga, matn pastga o'tadi.
export default function OnboardingPage() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-black px-4 py-8 md:px-6">
      <Image
        src="/onboarding/bg-lines.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-cover"
      />

      <section className="relative flex w-full max-w-[560px] flex-col gap-6 rounded-[28px] border border-[#6C6C6C] dark:border-[#6C6C6C] bg-[#202020] p-3 sm:p-[19px] lg:max-w-[1370px] lg:flex-row lg:items-center lg:gap-10 lg:rounded-[40px] xl:gap-[50px] hd:h-[530px] hd:w-[1370px] hd:gap-[65px]">
        <div className="relative aspect-[600/490] w-full shrink-0 overflow-hidden rounded-[18px] lg:w-[46%] lg:rounded-[20px] hd:h-[490px] hd:w-[600px]">
          <Image
            src="/onboarding/hero-food.webp"
            alt="Restoran dasturxoni"
            fill
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col px-2 pb-3 sm:px-3 lg:px-0 lg:pb-0">
          <h1 className="text-[34px] font-bold leading-[1.1] text-white sm:text-[44px] lg:text-[48px] xl:text-[56px] 2xl:text-[64px] 2xl:leading-[68px]">
            Bazmlarni oson
            <br />
            rejalashtiring
          </h1>
          <p className="mt-3 text-[18px] font-light leading-[1.4] text-[#C8C8C8] dark:text-[#8A8A8A] sm:text-[22px] lg:mt-[20px] xl:text-[26px] 2xl:text-[28px] hd:text-[32px] hd:leading-[40px]">
            Qidiruv va oson band qilish
            <br className="hidden sm:block" />{" "}
            uchun ilovadan to‘liq ro‘yxatdan o‘ting
          </p>
          <Link
            href="/royxatdan-otish"
            className="mt-8 flex h-[56px] w-full items-center justify-center rounded-full bg-brand text-[18px] font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-[344px] sm:text-[20px] lg:mt-12 hd:mt-[80px]"
          >
            Ro‘yxatdan o‘tish
          </Link>
        </div>
      </section>
    </main>
  );
}
