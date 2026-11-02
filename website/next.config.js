/** @type {import('next').NextConfig} */
const isIPFS = process.env.NEXT_PUBLIC_IPFS === 'true' || process.env.FLEEK === 'true';

const nextConfig = {
  output: isIPFS ? 'export' : 'standalone',
  trailingSlash: isIPFS ? true : false,
  images: {
    domains: ['tarcoin.org'],
    unoptimized: isIPFS ? true : false,
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons', 'recharts'],
  },
  ...(isIPFS ? {} : {
    headers: async () => [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ],
    async rewrites() {
      return [
        // Explorer API proxy
        {
          source: '/api/explorer/:path*',
          destination: 'http://localhost:4000/api/:path*',
        },
        // Main API proxy
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:5555/api/v1/:path*',
        },
        // Mining pool API proxy
        {
          source: '/api/pool/:path*',
          destination: 'http://localhost:3001/api/pool/:path*',
        },
        // Health check proxy
        {
          source: '/health',
          destination: 'http://localhost:4000/health',
        },
      ];
    },
  }),
};

module.exports = nextConfig;
