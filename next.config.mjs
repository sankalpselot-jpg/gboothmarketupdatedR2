/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Silence build warnings about missing Supabase env vars
  // They're required at runtime, not build time (all pages are force-dynamic)
  env: {
    NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL      || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL           || 'https://boothmarket.com',
    NEXT_PUBLIC_APP_NAME:          process.env.NEXT_PUBLIC_APP_NAME          || 'BoothMarket',
  },
}

export default nextConfig
