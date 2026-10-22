import type { NextConfig } from "next";

/**
 * Two build modes:
 *  - default (Railway): standalone Node server with API routes + JSON-file DB
 *  - NEXT_PUBLIC_STATIC=1 (GitHub Pages): fully static export, no server;
 *    app state persists in the browser (localStorage) — see src/lib/store.ts
 */
const isStatic = process.env.NEXT_PUBLIC_STATIC === "1";

const shared = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
} satisfies Partial<NextConfig>;

const nextConfig: NextConfig = isStatic
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
