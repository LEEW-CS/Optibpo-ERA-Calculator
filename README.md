# Optibpo ERA Calculator

Next.js (App Router, TypeScript) rewrite of the Employment Rights Act 2025 cost calculator. Free, embeddable widget for **optibpo.com**.

UK SME owners enter their business details and get back:

- Annual ERA 2025 compliance cost (£)
- IR35 risk score (Low / Medium / High)
- optiBPO equivalent cost (£)
- Annual saving (£) and payback period (months)

Lead capture (HubSpot) gates the full results; CTA links to Kal's Calendly.

**Live:** https://leew-cs.github.io/Optibpo-ERA-Calculator/
**Embed:** https://leew-cs.github.io/Optibpo-ERA-Calculator/embed/

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out/
```

Requires Node 20+.

## Project layout

```
src/
├── app/
│   ├── layout.tsx          # root layout, fonts, HubSpot loader
│   ├── page.tsx            # standalone preview page
│   ├── globals.css         # page chrome only (widget is module-scoped)
│   └── embed/
│       ├── page.tsx        # iframe-friendly route (no header chrome)
│       └── EmbedBodyMark.tsx
├── components/
│   └── EraCalculator.tsx   # the widget
├── lib/
│   ├── calculations.ts     # constants + pure calc functions
│   └── config.ts           # HubSpot + Calendly stubs (swap before going live)
└── styles/
    └── era-calc.module.css # CSS module — fully scoped
```

## Embedding on optibpo.com

Paste this into a WordPress Custom HTML block:

```html
<iframe
  id="era-calc-frame"
  src="https://leew-cs.github.io/Optibpo-ERA-Calculator/embed/"
  style="width:100%;border:0;display:block"
  scrolling="no"
></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.type === 'era-calc:height') {
      var f = document.getElementById('era-calc-frame');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
</script>
```

The iframe self-reports its content height after every state change, so the host page resizes the frame automatically — no scrollbars inside the widget.

## Stubs to replace before going live

| Stub | Where | Replace with |
|---|---|---|
| `REPLACE_WITH_REAL_FORM_GUID` | `src/lib/config.ts` → `HUBSPOT.formId` | The form GUID from HubSpot once Kal/marketing creates the lead form |
| `https://calendly.com/optibpo-kal/discovery-30min` | `src/lib/config.ts` → `CALENDLY_URL` | Kal's actual Calendly URL |

HubSpot Portal ID `48942580` is correct (sourced from optibpo.com's existing tracker). Until the form GUID is set, the widget falls back to an inline form which posts client-side via the HubSpot Forms API once the GUID is configured. The inline form is also handy for prototype demos.

### Override config from the host page

```html
<script>
  // After the iframe loads — useful if you want to swap config without rebuilding.
  // Note: this only works for the standalone page or a same-origin embed.
  window.eraCalc.config({
    hubspot:    { formId: 'YOUR-REAL-FORM-GUID', region: 'eu1' },
    calendlyUrl:'https://calendly.com/kal-real-link/discovery'
  });
</script>
```

## Calculation sources

| Constant | Value | Source |
|---|---|---|
| Per-employee annual compliance | £200 + £15 SSP | [DBT Economic Analysis Jan 2026](https://assets.publishing.service.gov.uk/media/695d3ebfbd1c076f787e7399/employment-rights-act-2025-economic-analysis.pdf), [SSP factsheet](https://assets.publishing.service.gov.uk/media/695fb36d47867b8e14f764fb/statutory-sick-pay-factsheet.pdf) |
| Industry multipliers | 1.00 – 1.40 | UKHospitality, ONS zero-hours stats, gov.uk sectoral note |
| One-off setup banded | £1k / £4k / £14k | DBT familiarisation cost + Lewis Silkin / Pinsent advisories |
| UK on-cost rate | 22% | NI + auto-enrolment pension |
| Offshore saving | 60% | optibpo.com pricing, Teambuild & Ubuntu BPO 2026 benchmarks |
| Salary bands | ONS ASHE 2025 (median £39,039) | [ONS ASHE 2025](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2025) |
| IR35 weights | HMRC CEST factors | HMRC, Qdos, ContractorCalculator |

## Deployment

`main` → GitHub Actions (`.github/workflows/deploy.yml`) → static export → GitHub Pages.

**One-time setup:** in repo Settings → Pages → Source must be set to **"GitHub Actions"** (not "Deploy from a branch"). After that every push to `main` auto-deploys in ~90s.

## Versioning

`APP_VERSION` is in `src/lib/config.ts`. Bump on every meaningful edit.

Current: **2.0.0** — Next.js rewrite.

### Changelog

- **2.0.0** — Next.js 15 / App Router / TypeScript rewrite. Iframe-friendly `/embed/` route. Self-reporting height via `postMessage`. CSS modules.
- **1.0.1** — Initial vanilla-JS prototype.

Historical vanilla-JS build preserved in [`legacy/index.html`](legacy/index.html) for reference.
