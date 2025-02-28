import withPWA from "next-pwa";
import type { NextConfig } from "next";

const config = {
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  sw: "/sw.js",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst" as const,
      options: {
        cacheName: "https-calls",
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};

const nextConfig = withPWA(config)({
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => [
    {
      source: "/manifest.json",
      headers: [
        {
          key: "Content-Type",
          value: "application/manifest+json",
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*",
        },
      ],
    },
  ],
});

export default nextConfig;
