/**
 * ERA 2025 calculator — pure functions.
 *
 * All constants sourced from:
 *   - DBT Economic Analysis (Jan 2026) https://assets.publishing.service.gov.uk/media/695d3ebfbd1c076f787e7399/employment-rights-act-2025-economic-analysis.pdf
 *   - gov.uk SSP factsheet
 *   - CIPD employer survey (Jan 2025)
 *   - FSB micro-firm modelling
 *   - ONS ASHE 2025 (median full-time £39,039)
 *   - HMRC CEST factors (for IR35 weights)
 *   - optibpo.com pricing + Teambuild / Ubuntu BPO 2026 benchmarks
 *
 * See README.md for the full attribution table.
 */

export type Industry =
  | 'professional_services'
  | 'tech'
  | 'hospitality'
  | 'adult_social_care'
  | 'retail'
  | 'construction'
  | 'manufacturing_logistics'
  | 'other';

export type RoleType =
  | 'permanent_ft'
  | 'part_time'
  | 'zero_hours'
  | 'fixed_term'
  | 'contractor_single'
  | 'contractor_multi'
  | 'agency';

export type Roles = Partial<Record<RoleType, boolean>>;

export interface CalculatorInputs {
  employees: number;
  salary: number; // band midpoint £
  industry: Industry;
  roles: Roles;
}

export interface IR35Result {
  score: number; // 0–1
  level: 'low' | 'med' | 'high';
  label: 'Low' | 'Medium' | 'High';
}

export interface CalculatorResults {
  eraAnnual: number;
  setupOneOff: number;
  ukLoaded: number;
  bpoAnnual: number;
  currentTotal: number;
  saving: number;
  paybackMonths: number;
  ir35: IR35Result;
  industryMult: number;
}

export const CONSTANTS = {
  BASE_COMPLIANCE_PER_EMPLOYEE: 200, // £/yr — DBT IA central + FSB extrapolation
  SSP_DAY_ONE_PER_EMPLOYEE: 15, // £/yr — gov.uk SSP factsheet
  SETUP: { small: 1000, medium: 4000, large: 14000 } as const, // 1-10 / 11-50 / 51-250
  INDUSTRY_MULT: {
    hospitality: 1.4,
    adult_social_care: 1.35,
    retail: 1.3,
    construction: 1.2,
    manufacturing_logistics: 1.15,
    professional_services: 1.0,
    tech: 1.0,
    other: 1.1
  } as const satisfies Record<Industry, number>,
  EMPLOYER_ON_COST_RATE: 0.22, // employer NI + pension auto-enrol
  OFFSHORE_RATE: 0.4, // optiBPO ≈ 40% of UK fully-loaded
  IR35_WEIGHTS: {
    contractor_single: 0.35,
    zero_hours: 0.2,
    fixed_term: 0.2,
    agency: 0.15,
    contractor_multi: 0.05,
    part_time: 0.05,
    permanent_ft: 0
  } as const satisfies Record<RoleType, number>
} as const;

export function setupBand(employees: number): keyof typeof CONSTANTS.SETUP {
  if (employees <= 10) return 'small';
  if (employees <= 50) return 'medium';
  return 'large';
}

export function calculateIR35(roles: Roles): IR35Result {
  let score = 0;
  for (const key of Object.keys(CONSTANTS.IR35_WEIGHTS) as RoleType[]) {
    if (roles[key]) {
      score += CONSTANTS.IR35_WEIGHTS[key];
    }
  }
  score = Math.min(1, score);
  if (score >= 0.6) return { score, level: 'high', label: 'High' };
  if (score >= 0.3) return { score, level: 'med', label: 'Medium' };
  return { score, level: 'low', label: 'Low' };
}

export function calculate(inputs: CalculatorInputs): CalculatorResults {
  const { employees, salary, industry, roles } = inputs;
  const industryMult = CONSTANTS.INDUSTRY_MULT[industry] ?? 1.0;

  // ERA compliance: per-employee admin + statutory + risk reserve × industry.
  const perEmployeeAnnual =
    (CONSTANTS.BASE_COMPLIANCE_PER_EMPLOYEE + CONSTANTS.SSP_DAY_ONE_PER_EMPLOYEE) *
    industryMult;
  const eraAnnual = perEmployeeAnnual * employees;
  const setupOneOff = CONSTANTS.SETUP[setupBand(employees)];

  // UK fully-loaded staff cost.
  const ukLoaded = salary * (1 + CONSTANTS.EMPLOYER_ON_COST_RATE) * employees;

  // Offshore equivalent.
  const bpoAnnual = ukLoaded * CONSTANTS.OFFSHORE_RATE;

  // Saving = (UK staff + ERA) − offshore.
  const currentTotal = ukLoaded + eraAnnual;
  const saving = currentTotal - bpoAnnual;
  const monthlySaving = saving / 12;
  const paybackMonths = monthlySaving > 0 ? setupOneOff / monthlySaving : Infinity;

  return {
    eraAnnual,
    setupOneOff,
    ukLoaded,
    bpoAnnual,
    currentTotal,
    saving,
    paybackMonths,
    ir35: calculateIR35(roles),
    industryMult
  };
}

export function gbp(n: number): string {
  if (!isFinite(n)) return '£0';
  return '£' + Math.round(n).toLocaleString('en-GB');
}
