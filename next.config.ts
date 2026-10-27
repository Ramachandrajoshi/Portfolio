import type { NextConfig } from 'next';
import { resolveDeployment } from './src/lib/deployment';

const { basePath, siteUrl } = resolveDeployment(process.env.NEXT_PUBLIC_SITE_URL);

// `next dev`: keep content in sync by running Velite in watch mode inside the dev process.
// Production builds run `velite build` explicitly first (see package.json "build").
if (process.argv.includes('dev') && !process.env.VELITE_STARTED) {
  process.env.VELITE_STARTED = '1';
  void import('velite').then((velite) => velite.build({ watch: true, clean: false }));
}

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
