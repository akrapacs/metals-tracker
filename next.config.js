/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/metals-tracker',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
