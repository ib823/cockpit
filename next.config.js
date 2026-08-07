/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://127.0.0.1", "http://localhost"],

  // Keep these server-only. jsdom (pulled in by isomorphic-dompurify for
  // server-side sanitization) reads its default stylesheet from disk at module
  // load via `fs.readFileSync(path.resolve(__dirname, "../../browser/default-stylesheet.css"))`.
  // Bundling it into the .next server chunks breaks that __dirname-relative path
  // and fails the build during page-data collection (ENOENT). Externalizing makes
  // Next require them from node_modules at runtime, where the asset exists.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],

  // React 19 compatibility
  experimental: {
    reactCompiler: false,
  },

  // SECURITY: Strictly enforce type checking during builds to prevent broken code in production
  typescript: {
    ignoreBuildErrors: false,
  },
  // SECURITY: Strictly enforce linting during builds to maintain code quality standards
  eslint: {
    ignoreDuringBuilds: false,
  },

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
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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

// Sentry wrapping is applied only when a DSN is configured. Without one the
// plugin would still run its build-time work (source-map generation and upload
// attempts) for no benefit, and would fail the build in CI where no auth token
// exists — so the unwrapped config is exported instead.
const sentryEnabled = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
);

if (!sentryEnabled) {
  module.exports = nextConfig;
} else {
  const { withSentryConfig } = require("@sentry/nextjs");

  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Uploading source maps needs SENTRY_AUTH_TOKEN. When it is absent the
    // build still succeeds; stack traces are just minified until it is set.
    silent: !process.env.CI,

    // Strip the uploaded maps from the client bundle so minified sources are
    // not publicly served alongside the app.
    sourcemaps: { deleteSourcemapsAfterUpload: true },

    // Route Sentry's browser requests through the app's own origin so ad
    // blockers do not silently drop error reports.
    tunnelRoute: "/monitoring",

    // Ship the error-reporting SDK only. Tracing/performance monitoring is what
    // this app needs least and costs most — the audit finding was "no error
    // tracking", not "no APM" — so it is tree-shaken out entirely rather than
    // merely sampled at a low rate.
    webpack: { treeshake: { removeDebugLogging: true, removeTracing: true } },
  });
}
