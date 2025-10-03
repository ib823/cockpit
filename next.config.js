/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Enable bundle analyzer when ANALYZE=true
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          concatenateModules: true,
          usedExports: true,
        };
      }
      return config;
    },
  }),
};

module.exports = nextConfig;
