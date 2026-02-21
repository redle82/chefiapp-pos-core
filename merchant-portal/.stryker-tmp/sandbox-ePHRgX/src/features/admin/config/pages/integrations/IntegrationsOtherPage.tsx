/**
 * IntegrationsOtherPage - Outros sistemas (ERP, fiscal, BI, analytics).
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md §3.2
 */
// @ts-nocheck


import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

export function IntegrationsOtherPage() {
  return (
    <>
      <AdminPageHeader
        title="Outros sistemas"
        subtitle="ERP, fiscal, BI, analytics."
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
          Em breve: stubs ou links para configuração de integrações com ERP, sistemas fiscais e analytics.
        </p>
      </div>
    </>
  );
}
