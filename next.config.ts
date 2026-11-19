import type { NextConfig } from "next";

/**
 * Three build modes:
 *  - default (Railway): standalone Node server with API routes + JSON-file DB
 *  - NEXT_PUBLIC_STATIC=1 (GitHub Pages): fully static export, no server;
 *    app state persists in the browser (localStorage) — see src/lib/store.ts
 *  - NEXT_PUBLIC_TGCLOUD=1 (Telegram Serverless mini app): fully static export
 *    at the web root; inside Telegram the app talks to tgcloud endpoints via
 *    Telegram.WebApp.Serverless.call (see tgcloud/ folder + tgcloud.jsonc)
 */
const isStatic = process.env.NEXT_PUBLIC_STATIC === "1";
const isTgcloud = process.env.NEXT_PUBLIC_TGCLOUD === "1";

const shared = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
} satisfies Partial<NextConfig>;

const nextConfig: NextConfig = isTgcloud
  ? {
      ...shared,
      output: "export",
      distDir: ".next-tgcloud",
      basePath: "",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : isStatic
    ? {
        ...shared,
        output: "export",
        distDir: ".next-static",
        basePath: "/University_planner",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        ...shared,
        output: "standalone",
      };

export default nextConfig;
