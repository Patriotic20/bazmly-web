import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo ildizi — uy papkasidagi ortiqcha lockfile'ni ildiz deb olmasligi uchun
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Umumiy paketlar TypeScript manbasi sifatida ulanadi
  transpilePackages: ["@bazmly/ui", "@bazmly/api"],
};

export default nextConfig;
