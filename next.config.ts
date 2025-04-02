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

const baseConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
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
  // Configuración específica para entorno serverless y chrome-aws-lambda
  webpack: (
    config: any,
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    // Configuración para chrome-aws-lambda en entorno de producción
    if (isServer && !dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Evitar conflictos con módulos nativos
        fs: false,
        child_process: false,
      };
    }

    return config;
  },
};

const nextConfig = withPWA(config)(baseConfig);

export default nextConfig;
