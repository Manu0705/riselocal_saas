/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@saas/database'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
