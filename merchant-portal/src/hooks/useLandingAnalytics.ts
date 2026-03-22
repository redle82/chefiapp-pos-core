import { useEffect } from "react";
import { FunnelTracker } from "../core/analytics/FunnelTracker";
import { resolveGeoContext } from "../core/market/GeoResolver";

/**
 * Track landing page view with geo context.
 * Call once per landing page component.
 */
export function useLandingAnalytics(landingId: string) {
  useEffect(() => {
    const geo = resolveGeoContext();

    FunnelTracker.track({
      name: "landing_viewed",
      properties: {
        source: landingId,
        lang: geo.language,
      },
    });

    FunnelTracker.track({
      name: "market_status_resolved",
      properties: {
        countryCode: geo.countryCode,
        status: geo.market.status,
      },
    });
  }, [landingId]);
}
