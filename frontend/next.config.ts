import type { NextConfig } from 'next'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Fix workspace root detection when multiple package.json exist
  outputFileTracingRoot: __dirname,

  // Proxy API requests to backend in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3001/auth/:path*'
      },
      {
        source: '/publico/:path*',
        destination: 'http://localhost:3001/publico/:path*'
      }
    ]
  }
}

export default nextConfig
