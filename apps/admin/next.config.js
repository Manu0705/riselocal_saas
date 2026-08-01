/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@saas/database', '@saas/domain-core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
