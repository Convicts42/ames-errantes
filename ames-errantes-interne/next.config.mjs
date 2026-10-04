import { resolve } from "node:path";

export default {
  poweredByHeader: false,
  experimental: { cpus: Number(process.env.NEXT_BUILD_WORKERS || 2) },
  transpilePackages: ["@ames/core"],
  serverExternalPackages: ["pg", "sharp", "sanitize-html"],

  turbopack: { root: resolve("..") },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
