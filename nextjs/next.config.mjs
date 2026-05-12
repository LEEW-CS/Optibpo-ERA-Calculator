/**
 * Next.js config — this Next.js project is the parallel rewrite that lives
 * in this subfolder for development. It is NOT the deployed artifact; the
 * deployed widget is the static `index.html` at the repo root (served by
 * GitHub Pages from main/root, same pattern as AIPolicyBuilder).
 *
 * `output: 'export'` is kept so `npm run build` produces a static site in
 * ./out/ if/when we choose to swap deployment to the Next.js build.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true
};

export default nextConfig;
