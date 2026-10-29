/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows standalone tracing needs symlink privileges; only Docker needs it.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  reactStrictMode: true,
};

export default nextConfig;
