/**
 * SetupShell — Entry point for /setup/* routes.
 *
 * Mounts the OnboardingLayout (sidebar + dynamic sections) as the
 * unified setup experience. This replaces the fragmented onboarding
 * with a single, guided implantation flow.
 *
 * For /setup (no sub-path), renders the OnboardingLayout which auto-
 * resolves to the first incomplete section.
 *
 * For /setup/start, renders the SetupStartPage (welcome + journey overview).
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 1)
 */

import { OnboardingLayout } from "../Onboarding/OnboardingLayout";

/**
 * Main setup shell — delegates to OnboardingLayout which already has:
 * - SetupSidebar with 9 sections + progress bar
 * - Dynamic section content area
 * - URL-driven navigation via ?section=
 * - OnboardingProvider for state management
 */
export function SetupShell() {
  return <OnboardingLayout />;
}
