# Optibpo ERA Calculator

Free Employment Rights Act 2025 cost calculator for UK SMEs — embeddable widget for **optibpo.com**.

UK SME owners enter their business details and get back:

- Annual ERA 2025 compliance cost (£)
- IR35 risk score (Low / Medium / High)
- optiBPO equivalent cost (£)
- Annual saving (£) and payback period (months)

Lead capture (HubSpot) gates the full results; CTA links to Kal's Calendly.

**Live:** https://leew-cs.github.io/Optibpo-ERA-Calculator/

## Layout

```
.
├── index.html        ← the deployed widget (single self-contained file)
├── nextjs/           ← parallel Next.js rewrite (development only, not deployed)
└── README.md
```

**The deployed artefact is `index.html` at the repo root.** GitHub Pages serves it directly from `main` / root — no build step, no workflow. Same pattern as `AIPolicyBuilder` and `mystaff-rrp`.

The `nextjs/` subfolder is a parallel TypeScript / App Router rewrite kept for future use; it isn't built or deployed automatically. To swap deployments later, build it (`npm run build` produces `out/`) and point Pages at that output via a workflow.

## Embedding on optibpo.com

Paste the `<div class="era-calc">…</div>` block from `index.html`, plus the matching `<style>` and `<script>` blocks, into a WordPress Custom HTML block. All CSS is scoped to `.era-calc`.

Override config from the host page without editing the widget:

```html
<script>
  window.eraCalc.config({
    hubspot:    { formId: 'YOUR-REAL-FORM-GUID', region: 'eu1' },
    calendlyUrl:'https://calendly.com/kal-real-link/discovery'
  });
</script>
```

## Stubs to replace before going live

| Stub | Where (in `index.html`) | Replace with |
|---|---|---|
| `REPLACE_WITH_REAL_FORM_GUID` | `CONFIG.hubspot.formId` | The form GUID from HubSpot once Kal/marketing creates the lead form |
| `https://calendly.com/optibpo-kal/discovery-30min` | `CONFIG.calendlyUrl` | Kal's actual Calendly URL |

HubSpot Portal ID `48942580` is correct (sourced from optibpo.com's existing tracker). Until the form GUID is set, the widget falls back to an inline form that posts client-side via the HubSpot Forms API — handy for prototype demos.

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

## Versioning

Version lives on the root `<div data-version="…">` in `index.html`. Bump on every meaningful edit.

Current: **1.0.2**

### Changelog

- **1.0.2** — Restructured repo to match the AIPolicyBuilder pattern: static `index.html` at root (deployed), Next.js rewrite moved to `nextjs/` subfolder (not deployed).
- **1.0.1** — Initial standalone repo. Live on GitHub Pages.
- **1.0.0** — First working prototype.

The Next.js rewrite (v2.0.0 of the underlying code) lives in [`nextjs/`](nextjs/) and has its own [README](nextjs/README.md).
