import React, { useState } from "react";

export function BackendMissingInstructions() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          padding: "8px 16px",
          borderRadius: 6,
          border: "1px solid var(--border-default, #e5e7eb)",
          backgroundColor: "var(--surface-subtle, #f9fafb)",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {expanded ? "Esconder instruções" : "How to enable"}
      </button>
      {expanded && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            backgroundColor: "var(--surface-subtle, #f9fafb)",
            borderRadius: 8,
            border: "1px solid var(--border-default, #e5e7eb)",
            fontSize: "0.8rem",
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
            Core migration required
          </p>
          <p style={{ margin: 0 }}>
            O dashboard Enterprise requer a migração do Core que cria a função{" "}
            <code>get_org_daily_consolidation</code>. Execute as migrações do
            Core ou aplique manualmente a migração de org consolidation. Em
            ambiente Docker: <code>./scripts/core/apply-missing-migrations.sh</code>.
          </p>
        </div>
      )}
    </div>
  );
}
