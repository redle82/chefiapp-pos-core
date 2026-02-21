/**
 * IntegrationsHubLayout - Layout do Hub de Integrações.
 * Renderiza link "Voltar" quando está numa sub-rota e <Outlet />.
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md §3
 */
// @ts-nocheck


import { Link, useLocation, Outlet } from "react-router-dom";

const INTEGRATIONS_BASE = "/admin/config/integrations";

export function IntegrationsHubLayout() {
  const location = useLocation();
  const isSubRoute =
    location.pathname !== INTEGRATIONS_BASE &&
    location.pathname.startsWith(INTEGRATIONS_BASE);

  return (
    <div style={{ maxWidth: 820 }}>
      {isSubRoute && (
        <p style={{ marginBottom: 16 }}>
          <Link
            to={INTEGRATIONS_BASE}
            style={{
              fontSize: 14,
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            ← Voltar às integrações
          </Link>
        </p>
      )}
      <Outlet />
    </div>
  );
}
