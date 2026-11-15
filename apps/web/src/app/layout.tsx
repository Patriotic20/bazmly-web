import "@fontsource/plus-jakarta-sans/300.css";import "@fontsource/plus-jakarta-sans/400.css";import "@fontsource/plus-jakarta-sans/500.css";import "@fontsource/plus-jakarta-sans/600.css";import "@fontsource/plus-jakarta-sans/700.css";import "@fontsource/plus-jakarta-sans/800.css";
import type { Metadata } from "next";

import "./globals.css";
import { Splash } from "@bazmly/ui/Splash";

const jakarta = { variable: "" };

export const metadata: Metadata = {
  title: "Bazmly — restoran va to‘yxonalarni band qilish",
  description: "Toshkentdagi restoran va to‘yxonalarni onlayn band qiling",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0"
        />
      </head>
      <body className={`${jakarta.variable} font-sans antialiased overflow-x-hidden`}>
        <Splash />
        {children}
      </body>
    </html>
  );
}
