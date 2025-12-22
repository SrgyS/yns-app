import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaxqithvqwzlervyjulo.storage.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'oaxqithvqwzlervyjulo.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'kinescopecdn.net',
        pathname: '/**',
      },
    ],
  },
  rewrites: async () => [
    {
      source: '/storage/:path*',
      destination: `${process.env.S3_ENDPOINT}/:path*`,
    },
  ],
}

export default nextConfig
