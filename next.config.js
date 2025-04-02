/**
 * @type {import('next').NextConfig}
 */

module.exports = {
  // Configuración para PWA (Progressive Web App)
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    scope: "/",
    sw: "service-worker.js",
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  },
  // Configuración para webhooks
  async headers() {
    return [
      {
        source: "/api/webhooks/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  // Configuración para imágenes externas
  images: {
    domains: ["res.cloudinary.com", "cloudinary.com"],
  },
  // Configuración de paquetes externos para componentes del servidor
  experimental: {
    serverComponentsExternalPackages: [
      "chrome-aws-lambda",
      "puppeteer-core",
      "html-pdf-node",
    ],
    esmExternals: "loose",
  },
  // Configuración para webpack en entornos serverless
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Evitar problemas con módulos nativos en entornos serverless
      config.externals = [
        ...config.externals,
        "chrome-aws-lambda",
        "puppeteer-core",
        "html-pdf-node",
      ];

      // Resolver problemas de dependencias nativas
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: false,
        child_process: false,
      };
    }
    return config;
  },
  // Desactivar eslint en producción para acelerar la construcción
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Desactivar TypeScript en producción
  typescript: {
    ignoreBuildErrors: true,
  },
  // Maximizar compatibilidad con diversas versiones de React
  reactStrictMode: false,
};
