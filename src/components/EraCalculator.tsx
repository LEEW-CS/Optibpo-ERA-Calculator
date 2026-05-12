'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/era-calc.module.css';
import {
  CalculatorInputs,
  CalculatorResults,
  Industry,
  Roles,
  RoleType,
  calculate,
  gbp
} from '@/lib/calculations';
import { APP_VERSION, CALENDLY_URL, HUBSPOT, PRIVACY_URL } from '@/lib/config';

type Step = 1 | 2 | 3;

interface ContactPayload {
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  phone: string;
}

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (options: {
          portalId: string;
          formId: string;
          region?: string;
          target: string;
          onFormSubmitted?: (
            $form: unknown,
            ctx?: { submissionValues?: Partial<ContactPayload> }
          ) => void;
        }) => void;
      };
    };
    eraCalc?: {
      version: string;
      config: (overrides: {
        hubspot?: Partial<typeof HUBSPOT>;
        calendlyUrl?: string;
      }) => void;
    };
  }
}

interface EraCalculatorProps {
  /** When true, the outer card chrome is stripped (use for iframe embed). */
  embed?: boolean;
}

const ROLE_DEFS: { value: RoleType; label: string; desc: string }[] = [
  { value: 'permanent_ft', label: 'Permanent full-time', desc: 'Salaried PAYE employees' },
  { value: 'part_time', label: 'Part-time', desc: 'Reduced-hours PAYE' },
  { value: 'zero_hours', label: 'Zero-hours / flexible', desc: 'Variable-hours workers' },
  { value: 'fixed_term', label: 'Fixed-term', desc: 'Project / time-limited' },
  {
    value: 'contractor_single',
    label: 'Self-employed (single client)',
    desc: "Long-term, you're their main client"
  },
  {
    value: 'contractor_multi',
    label: 'Self-employed (multi-client)',
    desc: 'Genuine consultants'
  },
  { value: 'agency', label: 'Agency / temp', desc: 'Supplied via third party' }
];

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'professional_services', label: 'Professional services / consulting' },
  { value: 'tech', label: 'Technology / SaaS' },
  { value: 'hospitality', label: 'Hospitality / food & beverage' },
  { value: 'adult_social_care', label: 'Adult social care' },
  { value: 'retail', label: 'Retail / e-commerce' },
  { value: 'construction', label: 'Construction / trades' },
  { value: 'manufacturing_logistics', label: 'Manufacturing / logistics' },
  { value: 'other', label: 'Other' }
];

const SALARY_BANDS: { value: number; label: string }[] = [
  { value: 20000, label: 'Under £25,000' },
  { value: 30000, label: '£25,000 – £35,000' },
  { value: 42000, label: '£35,000 – £50,000 (UK median: £39k)' },
  { value: 60000, label: '£50,000 – £75,000' },
  { value: 90000, label: '£75,000+' }
];

export default function EraCalculator({ embed = false }: EraCalculatorProps) {
  const [step, setStep] = useState<Step>(1);
  const [inputs, setInputs] = useState<CalculatorInputs>({
    employees: 15,
    salary: 42000,
    industry: 'professional_services',
    roles: { permanent_ft: true }
  });
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [rolesError, setRolesError] = useState(false);
  const [formError, setFormError] = useState(false);
  // Mutable refs for HubSpot + Calendly so embedders can override via window.eraCalc.
  const cfgRef = useRef({ hubspot: { ...HUBSPOT }, calendlyUrl: CALENDLY_URL });
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Expose window.eraCalc API for cross-frame config overrides.
  useEffect(() => {
    window.eraCalc = {
      version: APP_VERSION,
      config: (overrides) => {
        if (overrides.hubspot) cfgRef.current.hubspot = { ...cfgRef.current.hubspot, ...overrides.hubspot };
        if (overrides.calendlyUrl) cfgRef.current.calendlyUrl = overrides.calendlyUrl;
      }
    };
    return () => {
      delete window.eraCalc;
    };
  }, []);

  // Embed mode: report content height to the parent frame after every paint.
  useEffect(() => {
    if (!embed) return;
    const reportHeight = () => {
      if (!rootRef.current) return;
      const h = rootRef.current.offsetHeight;
      try {
        window.parent.postMessage({ type: 'era-calc:height', height: h, version: APP_VERSION }, '*');
      } catch {
        /* ignore — cross-origin issues are non-fatal */
      }
    };
    reportHeight();
    const ro = new ResizeObserver(reportHeight);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [embed, step, results]);

  function toggleRole(role: RoleType, checked: boolean) {
    setInputs((s) => ({ ...s, roles: { ...s.roles, [role]: checked } as Roles }));
  }

  function handleCalculate() {
    const anyRole = ROLE_DEFS.some((r) => inputs.roles[r.value]);
    if (!anyRole) {
      setRolesError(true);
      return;
    }
    setRolesError(false);
    setResults(calculate(inputs));
    setStep(2);
    // After step transition try to mount HubSpot embed if a real form is configured.
    setTimeout(mountHubSpotForm, 0);
  }

  function mountHubSpotForm() {
    const hs = cfgRef.current.hubspot;
    if (!hs.formId || hs.formId === 'REPLACE_WITH_REAL_FORM_GUID') return;
    const target = document.getElementById('era-hubspot-slot');
    if (!target || target.getAttribute('data-mounted') === '1') return;
    if (!window.hbspt?.forms) {
      // forms/embed/v2.js still loading — retry briefly.
      setTimeout(mountHubSpotForm, 300);
      return;
    }
    target.setAttribute('data-mounted', '1');
    window.hbspt.forms.create({
      portalId: hs.portalId,
      formId: hs.formId,
      region: hs.region,
      target: '#era-hubspot-slot',
      onFormSubmitted: (_$form, ctx) => {
        // We don't actually need to capture submissionValues for unlocking — HubSpot
        // already has them. We just reveal the results.
        void ctx;
        revealResults();
      }
    });
  }

  function handleFallbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const contact: ContactPayload = {
      firstname: String(fd.get('firstname') ?? '').trim(),
      lastname: String(fd.get('lastname') ?? '').trim(),
      company: String(fd.get('company') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim()
    };
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
    if (!contact.firstname || !contact.lastname || !contact.company || !emailOk || !contact.phone) {
      setFormError(true);
      return;
    }
    setFormError(false);
    submitToHubSpotApi(contact);
    revealResults();
  }

  function submitToHubSpotApi(contact: ContactPayload) {
    const hs = cfgRef.current.hubspot;
    if (!hs.formId || hs.formId === 'REPLACE_WITH_REAL_FORM_GUID' || !results) return;
    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(
      hs.portalId
    )}/${encodeURIComponent(hs.formId)}`;
    const payload = {
      fields: [
        { name: 'firstname', value: contact.firstname },
        { name: 'lastname', value: contact.lastname },
        { name: 'company', value: contact.company },
        { name: 'email', value: contact.email },
        { name: 'phone', value: contact.phone },
        { name: 'era_calc_employees', value: String(inputs.employees) },
        { name: 'era_calc_industry', value: inputs.industry },
        { name: 'era_calc_annual_cost', value: String(Math.round(results.eraAnnual)) },
        { name: 'era_calc_ir35_risk', value: results.ir35.label },
        { name: 'era_calc_saving', value: String(Math.round(results.saving)) }
      ],
      context: { pageUri: location.href, pageName: document.title }
    };
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      /* swallow — results already shown */
    });
  }

  function revealResults() {
    setStep(3);
    // Scroll the widget into view if the user has scrolled past it.
    requestAnimationFrame(() => {
      if (rootRef.current && rootRef.current.getBoundingClientRect().top < 0) {
        rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function handleRestart() {
    setStep(1);
    setResults(null);
  }

  // ============================================================
  // RENDER
  // ============================================================
  const rootClass = `${styles.root}${embed ? ' ' + styles.embedRoot : ''}`;

  return (
    <div ref={rootRef} className={rootClass} data-version={APP_VERSION} id="era-calc-root">
      {!embed && (
        <header className={styles.header}>
          <p className={styles.eyebrow}>ERA 2025 Exposure Calculator</p>
          <h2 className={styles.title}>
            What will the Employment Rights Act 2025 cost your business?
          </h2>
          <p className={styles.sub}>
            Free. 60 seconds. UK SME owners only. Get your annual compliance cost, IR35 risk
            score, and offshore-equivalent comparison.
          </p>
        </header>
      )}

      <div className={styles.steps} role="tablist">
        {(
          [
            [1, 'Your business'],
            [2, 'Your details'],
            [3, 'Your results']
          ] as const
        ).map(([n, label]) => {
          const cls =
            n === step
              ? `${styles.step} ${styles.stepActive}`
              : n < step
                ? `${styles.step} ${styles.stepDone}`
                : styles.step;
          return (
            <div key={n} className={cls}>
              <span className={styles.dot}>{n}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.body}>
        {step === 1 && (
          <section className={styles.panel}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="era-employees">
                Number of UK employees
              </label>
              <p className={styles.hint}>
                Includes full-time, part-time, and zero-hours workers on payroll.
              </p>
              <div className={styles.sliderRow}>
                <input
                  id="era-employees"
                  type="range"
                  min={1}
                  max={250}
                  step={1}
                  value={inputs.employees}
                  onChange={(e) =>
                    setInputs((s) => ({ ...s, employees: parseInt(e.target.value, 10) }))
                  }
                />
                <span className={styles.sliderValue}>{inputs.employees}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="era-salary">
                Average UK salary band
              </label>
              <p className={styles.hint}>
                Pick the band closest to your average gross full-time salary.
              </p>
              <select
                id="era-salary"
                value={inputs.salary}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, salary: parseInt(e.target.value, 10) }))
                }
              >
                {SALARY_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="era-industry">
                Industry
              </label>
              <select
                id="era-industry"
                value={inputs.industry}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, industry: e.target.value as Industry }))
                }
              >
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Role types in your workforce{' '}
                <span style={{ color: 'var(--era-muted)', fontWeight: 400, fontSize: 12 }}>
                  (tick all that apply)
                </span>
              </label>
              <p className={styles.hint}>Used to calculate your IR35 exposure score.</p>
              <div className={styles.roles}>
                {ROLE_DEFS.map((r) => {
                  const checked = !!inputs.roles[r.value];
                  return (
                    <label
                      key={r.value}
                      className={`${styles.role} ${checked ? styles.roleChecked : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleRole(r.value, e.target.checked)}
                      />
                      <span>
                        <span className={styles.roleLabel}>{r.label}</span>
                        <span className={styles.roleDesc}>{r.desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {rolesError && (
                <p className={styles.error}>Please select at least one role type.</p>
              )}
            </div>

            <div className={styles.actions}>
              <span />
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCalculate}>
                Calculate my exposure →
              </button>
            </div>
          </section>
        )}

        {step === 2 && results && (
          <section className={styles.panel}>
            <div className={styles.gateCard}>
              <h3 className={styles.gateTitle}>Your numbers are ready.</h3>
              <p className={styles.gateSub}>
                Enter your details to unlock your full breakdown — including your offshore-equivalent saving.
              </p>

              <div className={styles.teaser}>
                <div className={styles.teaserItem}>
                  <p className={styles.teaserLabel}>Annual ERA cost</p>
                  <p className={styles.teaserValue}>{gbp(results.eraAnnual)}</p>
                </div>
                <div className={styles.teaserItem}>
                  <p className={styles.teaserLabel}>IR35 risk</p>
                  <p className={styles.teaserValue}>{results.ir35.label}</p>
                </div>
                <div className={styles.teaserItem}>
                  <p className={styles.teaserLabel}>Potential saving</p>
                  <p className={styles.teaserValue}>{gbp(results.saving)}</p>
                </div>
              </div>

              <div className={styles.hubspotSlot} id="era-hubspot-slot" />

              <form className={styles.form} onSubmit={handleFallbackSubmit} noValidate>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="era-firstname">
                      First name
                    </label>
                    <input
                      type="text"
                      id="era-firstname"
                      name="firstname"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="era-lastname">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="era-lastname"
                      name="lastname"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="era-company">
                    Company
                  </label>
                  <input
                    type="text"
                    id="era-company"
                    name="company"
                    required
                    autoComplete="organization"
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="era-email">
                      Work email
                    </label>
                    <input
                      type="email"
                      id="era-email"
                      name="email"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="era-phone">
                      Phone
                    </label>
                    <input type="tel" id="era-phone" name="phone" required autoComplete="tel" />
                  </div>
                </div>
                {formError && (
                  <p className={styles.error}>Please complete all fields with valid details.</p>
                )}
                <div className={styles.actions} style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Show my full results →
                  </button>
                </div>
              </form>
              <p className={styles.privacy}>
                We respect your inbox. By submitting you agree to our{' '}
                <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
                . Unsubscribe any time.
              </p>
            </div>
          </section>
        )}

        {step === 3 && results && (
          <section className={styles.panel}>
            <div className={styles.resultsGrid}>
              <div className={`${styles.metric} ${styles.metricHero}`}>
                <p className={styles.metricLabel}>Estimated annual saving with optiBPO</p>
                <p className={styles.metricValue}>{gbp(results.saving)}</p>
                <p className={styles.metricFoot}>
                  vs running the same headcount in-house under ERA 2025
                </p>
              </div>
              <div className={styles.metric}>
                <p className={styles.metricLabel}>Annual ERA compliance cost</p>
                <p className={styles.metricValue}>{gbp(results.eraAnnual)}</p>
                <p className={styles.metricFoot}>Admin, statutory rights, tribunal-risk reserve</p>
              </div>
              <div className={styles.metric}>
                <p className={styles.metricLabel}>IR35 risk</p>
                <p className={styles.metricValue}>
                  <span
                    className={`${styles.riskBadge} ${
                      results.ir35.level === 'high'
                        ? styles.riskHigh
                        : results.ir35.level === 'med'
                          ? styles.riskMed
                          : styles.riskLow
                    }`}
                  >
                    {results.ir35.label}
                  </span>
                </p>
                <p className={styles.metricFoot}>
                  {results.ir35.level === 'high'
                    ? 'Significant exposure — review your contractor engagements urgently.'
                    : results.ir35.level === 'med'
                      ? 'Moderate exposure — worth a structured review.'
                      : 'Limited exposure under current HMRC CEST factors.'}
                </p>
              </div>
              <div className={styles.metric}>
                <p className={styles.metricLabel}>optiBPO equivalent cost</p>
                <p className={styles.metricValue}>{gbp(results.bpoAnnual)}</p>
                <p className={styles.metricFoot}>Same headcount, fully managed</p>
              </div>
              <div className={styles.metric}>
                <p className={styles.metricLabel}>Payback period</p>
                <p className={styles.metricValue}>
                  {isFinite(results.paybackMonths)
                    ? `${Math.max(1, Math.round(results.paybackMonths))} mo`
                    : 'n/a'}
                </p>
                <p className={styles.metricFoot}>One-off transition vs monthly saving</p>
              </div>
            </div>

            <div className={styles.breakdown}>
              <h4>How we got there</h4>
              <div className={styles.breakdownRow}>
                <span>Headcount × salary × on-costs (22%)</span>
                <span>{gbp(results.ukLoaded)}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>+ ERA 2025 compliance overhead</span>
                <span>{gbp(results.eraAnnual)}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>= Current annual UK cost</span>
                <span>{gbp(results.currentTotal)}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>− optiBPO equivalent</span>
                <span>−{gbp(results.bpoAnnual)}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Annual saving</span>
                <span>{gbp(results.saving)}</span>
              </div>
            </div>

            <div className={styles.ctaCard}>
              <h3 className={styles.ctaTitle}>Talk to Kal — 30 minutes, no commitment.</h3>
              <p className={styles.ctaSub}>
                Get a tailored offshore plan and an honest read on whether ERA 2025 changes the
                maths for your business.
              </p>
              <a
                href={cfgRef.current.calendlyUrl}
                className={`${styles.btn} ${styles.btnPrimary}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a discovery call →
              </a>
            </div>

            <p className={styles.footnote}>
              <strong>Sources &amp; assumptions:</strong> ERA 2025 compliance cost based on the{' '}
              <a
                href="https://assets.publishing.service.gov.uk/media/695d3ebfbd1c076f787e7399/employment-rights-act-2025-economic-analysis.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                DBT Economic Analysis (Jan 2026)
              </a>
              ,{' '}
              <a
                href="https://www.cipd.org/en/about/press-releases/cipd-urges-government-clarity-over-employment-rights-bill-needed-costs-rise/"
                target="_blank"
                rel="noopener noreferrer"
              >
                CIPD employer survey
              </a>
              , and{' '}
              <a
                href="https://www.peoplemanagement.co.uk/article/1949065/increased-labour-costs-pushing-small-businesses-brink-fsb-warns"
                target="_blank"
                rel="noopener noreferrer"
              >
                FSB modelling
              </a>
              . Salary bands from{' '}
              <a
                href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2025"
                target="_blank"
                rel="noopener noreferrer"
              >
                ONS ASHE 2025
              </a>
              . IR35 weighting follows HMRC CEST factors. optiBPO equivalent assumes 60% saving on
              fully-loaded UK FTE cost — your actual quote may differ. This calculator is an
              estimate, not legal or tax advice.
            </p>

            <div className={styles.actions} style={{ marginTop: 18 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={handleRestart}
              >
                ↺ Start over
              </button>
              <span />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
