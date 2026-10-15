import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.app.github.dev"],
    },
  },
  // Image optimization for WebP/AVIF
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // SEO-friendly configuration
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Redirects for common variations
  async redirects() {
    return [
      {
        source: "/index",
        destination: "/",
        permanent: true,
      },
      {
        source: "/portfolio",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/agency",
        destination: "/about",
        permanent: true,
      },
    ];
  },
  // Security and SEO headers with performance optimization
  async headers() {
    return [
      {
        source: "/:path(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Cache static images for SEO
      {
        source: "/og-:path(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache brand assets aggressively
      {
        source: "/brand-assets/:path(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache vector brand assets and icons
      {
        source: "/(brand|icons)/:path(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
