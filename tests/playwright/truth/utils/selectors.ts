/**
 * Truth Suite Selectors
 *
 * Centralized selectors for Truth Lock contract testing.
 * All selectors must match real DOM elements - no assumptions.
 */
export const selectors = {
  // TPV Ready Page
  tpvOfflineBanner: ".tpv__offline",
  tpvDemoBanner: "text=/Modo demo|dados locais|Modo Demonstracao/i",
  tpvEnterButton: "text=/Abrir TPV|Aguardar core/i",
  tpvReadyHeading: "text=/O teu TPV está pronto|Online e pronto/i",
  tpvBlockedHeading: "text=/Ainda não é seguro operar|A aguardar core/i",
  tpvNewButton: 'text="+ Novo"',

  // Core Health Banner
  coreStatusBanner: '[data-testid="core-status-banner"]',
  coreStatusDown: "text=/Sistema indisponivel|Backend indisponivel/i",
  coreStatusDegraded: "text=/Sistema lento/i",
  coreStatusUnknown: "text=/A verificar/i",

  // Creating Page
  creatingSpinner: "text=/A criar o teu espaco/i",
  creatingCommunicating: "text=/A comunicar com o servidor/i",
  creatingSuccess: "text=/Espaco criado/i",
  creatingDemoPrompt: "text=/Sistema indisponivel/i",
  creatingDemoButton: "text=/Explorar em modo demo/i",
  creatingRetryButton: "text=/Tentar novamente/i",

  // Publish Page
  publishButton: "text=/Publicar agora/i",
  publishingState: "text=/A publicar.../i",
  publishedSuccess: "text=/Publicado/i",
  publishBlocked: "text=/Publicacao bloqueada/i",
  publishChecklist: "text=/Checklist/i",

  // Payments Page
  paymentsStripeOption: "text=/Stripe/i",
  paymentsDemoOption: "text=/Modo demo/i",
  paymentsStripeInput: 'input[placeholder*="pk_"]',
  paymentsConnectButton: "text=/Ligar Stripe/i",
  paymentsConnected: "text=/Stripe ligado/i",
  paymentsValidating: "text=/A validar.../i",

  // Generic
  retryButton: "text=/Tentar novamente/i",
  continueButton: "text=/Continuar/i",
  demoModeWarning: "text=/Modo Demonstracao|sera simulada|dados locais/i",
  errorAlert: '[data-testid="inline-alert-error"]',
  successAlert: '[data-testid="inline-alert-success"]',
};
