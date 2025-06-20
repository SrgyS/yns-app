import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  rewrites: async () => [
    {
      source: '/storage/:path*',
      destination: `${process.env.S3_ENDPOINT}/:path*`,
    },
  ],
}

export default nextConfig
