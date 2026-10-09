import { resolve } from "node:path";
import { pages } from "@ames/core/data/pages.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { cpus: Number(process.env.NEXT_BUILD_WORKERS || 2) },
  turbopack: { root: resolve("..") },
  transpilePackages: ["@ames/core"],
  serverExternalPackages: ["pg", "sharp", "sanitize-html"],
  allowedDevOrigins: ["127.0.0.1", "192.168.1.7"],
  async redirects() {
    return pages.map(({ slug }) => ({
      source: `/${slug}.html`,
      destination: slug === "index" ? "/" : `/${slug}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
