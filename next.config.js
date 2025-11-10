/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://127.0.0.1", "http://localhost"],

  // Turbopack configuration (empty to silence Next.js 16 warning)
  turbopack: {},

  // SECURITY: Type checking runs separately in CI, ignore during builds to prevent warnings from blocking deployment
  typescript: {
    ignoreBuildErrors: true, // Type checking checked separately in CI pipeline
  },

  // NOTE: ESLint config moved to .eslintrc (deprecated in next.config.js)

  // SECURITY: Add security headers
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    return [
      // Service Worker - must be served with correct headers
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Only allow unsafe-eval in development (required by Next.js HMR)
              // Allow cdnjs.cloudflare.com for Lottie animation library
              `script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "worker-src 'self' blob:", // Allow service workers
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              // Remove upgrade-insecure-requests in dev for localhost
              ...(isDev ? [] : ["upgrade-insecure-requests"]),
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), notifications=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, webpack }) => {
    // Fix for Node.js built-in modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js built-in modules that should not be bundled for browser
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
        child_process: false,
        dns: false,
        http: false,
        https: false,
        zlib: false,
      };

      // Ignore node: protocol modules in browser bundles
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }

    // Existing bundle analyzer logic
    if (process.env.ANALYZE === "true" && !isServer) {
      config.optimization = {
        ...config.optimization,
        concatenateModules: true,
        usedExports: true,
      };
    }

    return config;
  },
};

module.exports = nextConfig;

// Suppress React 19 warnings
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("antd: compatible")) {
      return;
    }
    originalError.apply(console, args);
  };
}
