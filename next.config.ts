import type { NextConfig } from 'next';
import { resolveDeployment } from './src/lib/deployment';

const { basePath, siteUrl } = resolveDeployment(process.env.NEXT_PUBLIC_SITE_URL);

const nextConfig: NextConfig = {
  // Fully static output for GitHub Pages: no server, no API routes, no ISR.
  output: 'export',
  // GitHub Pages serves /about/index.html for /about/ — trailing slashes avoid redirects.
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  images: {
    // No image-optimisation server exists on static hosting. Images are pre-optimised
    // (AVIF/WebP/SVG) at authoring or build time instead.
    unoptimized: true,
  },
  env: {
    // Derived values, exposed so client code never re-implements URL logic.
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  experimental: {
    optimizePackageImports: ['@react-three/drei', 'motion'],
  },
};

export default nextConfig;
