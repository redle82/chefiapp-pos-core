/**
 * IntegrationsDeliveryPage - Delivery (GloriaFood, Glovo, Uber Eats).
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md §3.2
 */

import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

export function IntegrationsDeliveryPage() {
  return (
    <>
      <AdminPageHeader
        title="Delivery"
        subtitle="GloriaFood, Glovo, Uber Eats; ativar/desativar por adapter."
      />
      <div
        style={{
          padding: 24,
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          backgroundColor: "var(--card-bg-on-dark)",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
          Em breve: lista de adapters com estado (disabled | configured | active) e ativar/desativar por restaurante.
        </p>
      </div>
    </>
  );
}
