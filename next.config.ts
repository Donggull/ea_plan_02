import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 최적화
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // 이미지 최적화
  images: {
    domains: [],
    unoptimized: false,
  },
  // 정적 생성 최적화
  trailingSlash: false,
  // 실험적 기능 비활성화 (안정성 확보)
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
