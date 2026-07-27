import type { NextConfig } from "next"

const nextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  reactStrictMode: true,
} satisfies NextConfig

export default nextConfig
