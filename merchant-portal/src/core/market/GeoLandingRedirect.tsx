import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resolveGeoContext } from "./GeoResolver";
import { FunnelTracker } from "../analytics/FunnelTracker";

const GEO_REDIRECT_KEY = "chefiapp_geo_redirected";

/**
 * On first visit to "/", detect country and redirect to local landing if available.
 * Only fires once per session. Does NOT redirect if user arrived via direct URL.
 */
export function GeoLandingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only redirect from root "/"
    if (location.pathname !== "/") {
      setChecked(true);
      return;
    }

    // Only redirect once per session
    try {
      if (sessionStorage.getItem(GEO_REDIRECT_KEY)) {
        setChecked(true);
        return;
      }
    } catch {
      /* sessionStorage unavailable */
    }

    const geo = resolveGeoContext();

    // Track geo detection
    FunnelTracker.track({
      name: "geo_detected",
      properties: {
        countryCode: geo.countryCode,
        resolvedBy: geo.resolvedBy,
        marketStatus: geo.market.status,
      },
    });

    // Mark as redirected
    try {
      sessionStorage.setItem(GEO_REDIRECT_KEY, "1");
    } catch {
      /* sessionStorage unavailable */
    }

    // Redirect to local landing if available and not already on it
    const localLanding = geo.market.landingRoute;
    if (localLanding && localLanding !== "/" && geo.resolvedBy !== "fallback") {
      navigate(localLanding, { replace: true });
      return;
    }

    setChecked(true);
  }, [location.pathname, navigate]);

  return null; // Invisible component
}
