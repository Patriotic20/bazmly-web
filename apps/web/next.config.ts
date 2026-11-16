import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo ildizi — uy papkasidagi ortiqcha lockfile'ni ildiz deb olmasligi uchun
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Umumiy paketlar TypeScript manbasi sifatida ulanadi
  transpilePackages: ["@bazmly/ui", "@bazmly/api"],
  // Backend'dan keladigan rasmlar (muassasa, taom) istalgan https manzilda bo'lishi mumkin
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // Brauzer so'rovlari backend'ga shu proksi orqali boradi (CORS muammosisiz)
  async rewrites() {
    const origin = (process.env.BAZMLY_API_ORIGIN ?? "https://bazmly-backend-production.up.railway.app").replace(/\/$/, "");
    return [{ source: "/bapi/:path*", destination: `${origin}/api/:path*` }];
  },
};

export default nextConfig;
