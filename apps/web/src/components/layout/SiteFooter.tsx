import Image from "next/image";
import Link from "next/link";
import { BazmlyLogo } from "@bazmly/ui/BazmlyLogo";

// dark: Figma dark footer — oq belgilar (fonsiz), [rasm, eni, bo'yi]
const SOCIAL: { name: string; icon: string; dark: [string, number, number]; href: string }[] = [
  { name: "Facebook", icon: "/home/facebook.png", dark: ["/home/facebook-dark.png", 9.5, 18], href: "#" },
  { name: "X (Twitter)", icon: "/home/twitter.png", dark: ["/home/twitter-dark.png", 14, 12], href: "#" },
  { name: "Instagram", icon: "/home/instagram.png", dark: ["/home/instagram-dark.png", 18, 18], href: "#" },
  { name: "YouTube", icon: "/home/youtube.png", dark: ["/home/youtube-dark.png", 17, 12], href: "#" },
];

// Figma: "Footer" 1920×396, fon #F6F6F6. Telefonda ustunlar ustma-ust.
export function SiteFooter() {
  return (
    <footer className="bg-[#F6F6F6] dark:bg-[#393939]">
      <div className="container-page flex flex-col pb-8 pt-10 md:h-[396px] md:pb-0 md:pt-[104px]">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" aria-label="Bazmly" className="block w-fit text-brand">
              <BazmlyLogo className="h-[40px] w-[165px] dark:text-white" />
            </Link>
            <p className="mt-8 text-[18px] font-medium leading-[17px] text-brand md:mt-[47px] md:h-[17px] md:text-[20px] dark:text-white">Bizning ijtimoy tarmoqlar</p>
            <ul className="mt-4 flex gap-[23.6px] md:mt-[23.5px]">
              {SOCIAL.map((s) => (
                <li key={s.name}>
                  <a href={s.href} aria-label={s.name} className="grid size-[41px] place-items-center rounded-full transition-opacity hover:opacity-70">
                    <Image src={s.icon} alt="" width={41} height={41} className="dark:hidden" />
                    <Image src={s.dark[0]} alt="" width={s.dark[1]} height={s.dark[2]} className="hidden dark:block" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:mt-[6px] sm:w-[180px] sm:items-end">
            <p className="text-[18px] font-medium leading-[12px] text-brand md:h-[12px] md:text-[20px] dark:text-white">Mobil ilovalar</p>
            <div className="mt-5 flex gap-3 sm:flex-col sm:gap-[20px]">
              <a href="#" aria-label="App Store'dan yuklab olish" className="block">
                <Image src="/home/appstore.png" alt="" width={180} height={52} className="h-[44px] w-auto dark:hidden sm:h-[52px]" />
                <Image src="/home/appstore-dark.png" alt="" width={180} height={52} className="hidden h-[44px] w-auto dark:block sm:h-[52px]" />
              </a>
              <a href="#" aria-label="Google Play'dan yuklab olish" className="block">
                <Image src="/home/googleplay.png" alt="" width={180} height={52} className="h-[44px] w-auto dark:hidden sm:h-[52px]" />
                <Image src="/home/googleplay-dark.png" alt="" width={180} height={52} className="hidden h-[44px] w-auto dark:block sm:h-[52px]" />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-[14px] leading-[10px] text-brand md:mt-auto md:mb-[40px] md:text-[16px] dark:text-white">
          © {new Date().getFullYear()} Powered by BAZMLY technology
        </p>
      </div>
    </footer>
  );
}
