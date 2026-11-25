/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['**.manuspre.computer', '**.manus.computer'],
  transpilePackages: ['@rentr/ui'],
};

export default nextConfig;
