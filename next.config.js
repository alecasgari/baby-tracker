/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid build failures on constrained hosts; run lint locally instead.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type-checking during build to reduce worker usage.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

