import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
// Panel ro'yxatlari (Inter) va kalendar (Roboto) — Figma'dagi shriftlar
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import type { Metadata } from "next";
import { Splash } from "@bazmly/ui/Splash";
import { ToastProvider } from "@bazmly/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bazmly — hamkor paneli",
  description: "Restoran va to‘yxonalar uchun bronlarni boshqarish paneli",
  // Panel qidiruv tizimlarida ko'rinmasligi kerak
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        <Splash spinner />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
