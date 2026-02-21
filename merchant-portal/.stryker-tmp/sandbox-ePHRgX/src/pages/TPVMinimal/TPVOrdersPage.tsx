// @ts-nocheck
import { Navigate } from "react-router-dom";

/**
 * TPVOrdersPage — consolidated into the Kitchen/KDS view.
 * Keep the route alive for compatibility, but redirect to /op/tpv/kitchen.
 */
export function TPVOrdersPage() {
  return <Navigate to="/op/tpv/kitchen" replace />;
}
