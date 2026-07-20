/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_EXPLORER_API: process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000',
    NEXT_PUBLIC_GENESIS_HASH: '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e',
  },
};

module.exports = nextConfig;
