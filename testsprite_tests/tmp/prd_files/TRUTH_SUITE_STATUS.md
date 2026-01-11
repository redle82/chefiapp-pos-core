/**
 * Truth Suite Selectors
 *
 * IMPORTANT: Prefer stable `data-testid` selectors over copy-based locators.
 * Copy changes are allowed; truth contracts are not.
 */

export const selectors = {
  // Global
  coreStatusBanner: '[data-testid="core-status-banner"]',
  coreStatusText: '[data-testid="core-status-text"]',
  demoBanner: '[data-testid="demo-banner"]',

  // TPV Ready gate
  tpvReadyHeading: '[data-testid="tpv-ready-heading"]',
  tpvBlockedHeading: '[data-testid="tpv-blocked-heading"]',
  tpvEnterButton: '[data-testid="tpv-enter-button"]',

  // TPV (POS)
  tpvNewOrderButton: '[data-testid="tpv-new-order"]',
  tpvOfflineBanner: '[data-testid="tpv-offline-banner"]',
} as const
