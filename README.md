# ERA 2025 Cost Calculator

Free, embeddable widget for **optibpo.com**. UK SME owners enter business details and get back:

- Annual ERA 2025 compliance cost (£)
- IR35 risk score (Low / Medium / High)
- optiBPO equivalent cost (£)
- Annual saving (£) and payback period (months)

Lead capture (HubSpot) gates the full results; CTA links to Kal's Calendly.

## File

- [`index.html`](index.html) — single self-contained file. Open it in any browser.

## Embed on optibpo.com

Copy the `<div class="era-calc">…</div>` block, the matching `<style>` block, and the `<script>` block into a WordPress Custom HTML block (or any page). All CSS is scoped to `.era-calc` so it won't clash with the rest of the site.

You can override config from the host page without editing the widget:

```html
<script>
  window.eraCalc.config({
    hubspot:    { formId: 'YOUR-REAL-FORM-GUID', region: 'eu1' },
    calendlyUrl:'https://calendly.com/kal-real-link/discovery'
  });
</script>
```

## Stubs to replace before going live

| Stub | Where | Replace with |
|---|---|---|
| `REPLACE_WITH_REAL_FORM_GUID` | `CONFIG.hubspot.formId` | The form GUID from HubSpot once Kal/marketing creates the lead form |
| `https://calendly.com/optibpo-kal/discovery-30min` | `CONFIG.calendlyUrl` | Kal's actual Calendly URL |

HubSpot Portal ID `48942580` is already correct (sourced from optibpo.com's existing tracker). Until the form GUID is set, the widget falls back to an inline form that posts client-side — handy for prototype demos.

## Calculation sources

| Constant | Value | Source |
|---|---|---|
| Per-employee annual compliance | £200 + £15 SSP | [DBT Economic Analysis Jan 2026](https://assets.publishing.service.gov.uk/media/695d3ebfbd1c076f787e7399/employment-rights-act-2025-economic-analysis.pdf), [SSP factsheet](https://assets.publishing.service.gov.uk/media/695fb36d47867b8e14f764fb/statutory-sick-pay-factsheet.pdf) |
| Industry multipliers | 1.00 – 1.40 | UKHospitality, ONS zero-hours stats, gov.uk sectoral note |
| One-off setup banded | £1k / £4k / £14k | DBT familiarisation cost + Lewis Silkin / Pinsent advisories |
| UK on-cost rate | 22% | NI + auto-enrolment pension |
| Offshore saving | 60% | optibpo.com pricing, Teambuild & Ubuntu BPO 2026 benchmarks |
| Salary bands | ONS ASHE 2025 | [ONS ASHE 2025](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2025) |
| IR35 weights | HMRC CEST factors | HMRC, Qdos, ContractorCalculator |

## Versioning

Version is set on the root `<div data-version="…">`. Bump on every meaningful edit.

Current: **1.0.1**
