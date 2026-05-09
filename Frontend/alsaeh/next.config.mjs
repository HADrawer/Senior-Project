/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default nextConfig;