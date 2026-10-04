import { pages } from "./src/data/pages.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
