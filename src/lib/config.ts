/**
 * Static config. Stubs are flagged inline.
 * To override from an embedding page, see `window.eraCalc.config(...)` in
 * `src/components/EraCalculator.tsx`.
 */

export const APP_VERSION = '2.0.0';

export const HUBSPOT = {
  portalId: '48942580', // optiBPO's live portal (already on optibpo.com)
  formId: 'REPLACE_WITH_REAL_FORM_GUID', // <-- STUB: swap when HubSpot form created
  region: 'eu1' as 'eu1' | 'na1'
};

// STUB: replace with Kal's actual Calendly URL before going live.
export const CALENDLY_URL = 'https://calendly.com/optibpo-kal/discovery-30min';

export const PRIVACY_URL = 'https://optibpo.com/privacy-policy/';
