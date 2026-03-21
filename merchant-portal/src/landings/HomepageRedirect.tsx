/**
 * HomepageRedirect — Redireciona / para país detectado (navigator + localStorage).
 */
import { Navigate } from "react-router-dom";
import { getDetectedCountry } from "./countryDetection";
import { isValidCountryCode } from "./countries";

export function HomepageRedirect() {
  const detected = getDetectedCountry();
  const target = isValidCountryCode(detected) ? detected : "gb";
  return <Navigate to={`/${target}`} replace />;
}
