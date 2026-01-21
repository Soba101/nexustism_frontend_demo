import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

// Bundle analyzer setup (run with ANALYZE=true npm run build)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://100.118.142.106:3001',
    'https://100.118.142.106:3001',
  ],
};

export default withBundleAnalyzer(nextConfig);
