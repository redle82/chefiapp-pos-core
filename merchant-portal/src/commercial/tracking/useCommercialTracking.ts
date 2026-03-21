/**
 * useCommercialTracking — React hook for commercial funnel tracking.
 *
 * Wraps CommercialTrackingService with React-friendly API.
 * Automatically captures country, segment, device, path, and landing_version.
 *
 * Usage:
 *   const { trackPageView, trackWhatsAppClick, trackDemoClick, trackPricingView } =
 *     useCommercialTracking();
 *
 * All methods are stable (useCallback), safe to pass as props.
 *
 * Ref: docs/commercial/TRACKING_EVENTS_SPEC.md
 */

import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { CountryCode } from "../../landings/countries";
import type { Segment } from "../../landings/countryCopy";
import { useCountryLanding } from "../../landings/CountryLandingContext";
import { commercialTracking } from "./CommercialTrackingService";
import { detectDevice } from "./detectDevice";
import { isCommercialTrackingEnabled } from "./flag";

// ---------------------------------------------------------------------------
// Landing version resolver
// ---------------------------------------------------------------------------

function resolveLandingVersion(pathname: string): string {
  if (/^\/(br|es|gb|us)\/?$/.test(pathname)) return "country-v1";
  if (
    pathname.startsWith("/landing") ||
    pathname === "/v2" ||
    pathname === "/landing-v2"
  )
    return "landing-v2";
  if (pathname === "/pricing") return "pricing-v1";
  if (pathname === "/compare" || pathname === "/comparativo")
    return "compare-v1";
  if (pathname === "/features") return "features-v1";
  if (pathname === "/app/trial-tpv") return "product-first-v1";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Overload: accept explicit country/segment or pull from context
// ---------------------------------------------------------------------------

interface UseCommercialTrackingOptions {
  /** Override country (useful outside CountryLandingProvider) */
  country?: CountryCode;
  /** Override segment */
  segment?: Segment;
}

export function useCommercialTracking(opts?: UseCommercialTrackingOptions) {
  //ader
  let ctxCountry: CountryCode = "gb";
  let ctxSegment: Segment = "small";
  try {
    const ctx = useCountryLanding();
    ctxCountry = ctx.countryCode;
    ctxSegment = ctx.segment;
  } catch {
    // Not inside CountryLandingProvider — use defaults / overrides
  }

  const country = opts?.country ?? ctxCountry;
  const segment = opts?.segment ?? ctxSegment;
  const { pathname } = useLocation();
  const device = useMemo(() => detectDevice(), []);
  const landing_version = useMemo(
    () => resolveLandingVersion(pathname),
    [pathname],
  );

  const enabled = isCommercialTrackingEnabled();

  // -----------------------------------------------------------------------
  // Base builder
  // -----------------------------------------------------------------------

  const base = useCallback(
    () => ({
      timestamp: new Date().toISOString(),
      country,
      segment,
      landing_version,
      device,
      path: pathname,
    }),
    [country, segment, landing_version, device, pathname],
  );

  // -----------------------------------------------------------------------
  // Track: page_view
  // -----------------------------------------------------------------------

  const trackPageView = useCallback(() => {
    if (!enabled) return;
    commercialTracking.track({ ...base(), event: "page_view" });
  }, [enabled, base]);

  // -----------------------------------------------------------------------
  // Track: cta_whatsapp_click
  // -----------------------------------------------------------------------

  const trackWhatsAppClick = useCallback(
    (placement: string) => {
      if (!enabled) return;
      commercialTracking.track({
        ...base(),
        event: "cta_whatsapp_click",
        placement,
      });
    },
    [enabled, base],
  );

  // -----------------------------------------------------------------------
  // Track: cta_demo_click
  // -----------------------------------------------------------------------

  const trackDemoClick = useCallback(() => {
    if (!enabled) return;
    commercialTracking.track({ ...base(), event: "cta_demo_click" });
  }, [enabled, base]);

  // -----------------------------------------------------------------------
  // Track: pricing_view
  // -----------------------------------------------------------------------

  const trackPricingView = useCallback(
    (plan: string) => {
      if (!enabled) return;
      commercialTracking.track({ ...base(), event: "pricing_view", plan });
    },
    [enabled, base],
  );

  return {
    trackPageView,
    trackWhatsAppClick,
    trackDemoClick,
    trackPricingView,
    /** Raw access for advanced usage */
    service: commercialTracking,
    /** Current resolved values */
    context: { country, segment, device, landing_version, pathname, enabled },
  } as const;
}
