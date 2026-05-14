/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  serverExternalPackages: [
    "typeorm",
    "pg",
    "pg-native",
    "reflect-metadata",
    "bcryptjs",
    "jsonwebtoken",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
        "pg-native": false,
        "cpu-features": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
