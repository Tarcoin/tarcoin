/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_EXPLORER_API: process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000',
    NEXT_PUBLIC_GENESIS_HASH: '000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0',
  },
};

module.exports = nextConfig;
