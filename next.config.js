/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: "export" to enable API routes
  // output: "export", // Commented out to enable API routes
  trailingSlash: true,
  images: { unoptimized: true },
  // Enable API routes for development and production
  experimental: {
    // Enable server-side features
  }
}

module.exports = nextConfig
