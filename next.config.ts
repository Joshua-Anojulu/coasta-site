import type { NextConfig } from "next"

const nextConfig = {
  compress: true,
  // `next dev` and `next build` share .next by default, so running a
  // verification build while the dev server is up overwrites the chunks it is
  // serving and its stylesheet starts 404ing. The page then renders as raw DOM,
  // which looks exactly like a CSS bug and is not one. `npm run verify` sets
  // this to a scratch directory so the two can never collide.
  distDir: process.env["COASTA_DIST_DIR"] ?? ".next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  reactStrictMode: true,
} satisfies NextConfig

export default nextConfig
