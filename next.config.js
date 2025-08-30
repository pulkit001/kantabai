/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  // App directory is now stable in Next.js 14
  
  // Increase body size limits for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // API route config
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = withPWA(nextConfig)
