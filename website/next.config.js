/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['tarcoin.org'],
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons', 'recharts'],
  },
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
};

module.exports = nextConfig;