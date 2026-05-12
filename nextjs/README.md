# ERA Calculator — Next.js rewrite

Parallel Next.js (App Router, TypeScript) implementation of the calculator. **Not currently deployed** — the deployed widget is the static `../index.html` at the repo root. This folder exists so we can iterate on a typed, componentised version without disturbing what's live.

## Local development

```bash
cd nextjs
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → ./out/
```

Requires Node 20+.

## Layout

```
nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout, fonts, HubSpot loader
│   │   ├── page.tsx            # standalone preview page
│   │   ├── globals.css         # page chrome only
│   │   └── embed/
│   │       ├── page.tsx        # iframe-friendly route
│   │       └── EmbedBodyMark.tsx
│   ├── components/
│   │   └── EraCalculator.tsx   # the widget (≈600 lines)
│   ├── lib/
│   │   ├── calculations.ts     # pure calc functions + constants
│   │   └── config.ts           # HubSpot + Calendly stubs
│   └── styles/
│       └── era-calc.module.css # CSS Module — fully scoped
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## What's different vs the static widget

- TypeScript + React 19 / Next 15 with strict mode
- Calc logic separated from rendering (`src/lib/calculations.ts`)
- Two routes: `/` (standalone preview), `/embed/` (iframe-friendly, no chrome, self-reports height via `postMessage`)
- CSS Modules — visually identical, scoped under a generated class

## To deploy this version instead of the static HTML

1. Add a workflow at `../.github/workflows/deploy.yml` that runs `cd nextjs && npm ci && npm run build` and publishes `nextjs/out` to Pages
2. Set `next.config.mjs` `basePath` + `assetPrefix` to `/Optibpo-ERA-Calculator` for production
3. Repo Settings → Pages → Source: **GitHub Actions**

A reference workflow exists in this repo's git history (see commit `623ef5e` on `main`) — revert that commit's `.github/workflows/deploy.yml` if you want to switch over.

## Versioning

`APP_VERSION` is in `src/lib/config.ts`. Current: **2.0.0**.
