/**
 * Next.js config for static export to GitHub Pages.
 *
 * basePath/assetPrefix are wired only in production so `npm run dev`
 * still works at http://localhost:3000/ without prefixes.
 *
 * GitHub Pages serves the repo at /Optibpo-ERA-Calculator/ — case-sensitive.
 */
const isProd = process.env.NODE_ENV === 'production';
const REPO = 'Optibpo-ERA-Calculator';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isProd ? `/${REPO}` : '',
  assetPrefix: isProd ? `/${REPO}/` : '',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true
};

export default nextConfig;
