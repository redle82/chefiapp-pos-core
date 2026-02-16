/**
 * RolesSummarySection — Resumo de papéis e permissões (FASE 3 Passo 4)
 *
 * Staff só executa; Gerente acompanha equipa e tarefas; Dono vê tudo.
 * Exibido em Config → Pessoas → Papéis.
 */

import React from "react";
import type { UserRole } from "../../core/roles/rolePermissions";

interface RoleSummary {
  role: UserRole;
  label: string;
  description: string;
  can: string[];
  cannot: string[];
}

const ROLES: RoleSummary[] = [
  {
    role: "staff",
    label: "Funcionário (Staff)",
    description: "Apenas execução operacional.",
    can: [
      "TPV e KDS (vender, cozinha)",
      "Tarefas e checklists do turno",
      "Alertas e pessoas (visão operacional)",
      "App Staff / Garçom",
    ],
    cannot: [
      "Configuração (módulos, pagamentos, integrações)",
      "Dashboard e relatórios",
      "Billing e faturação",
      "Gestão de equipa (criar/editar pessoas)",
    ],
  },
  {
    role: "manager",
    label: "Gerente",
    description: "Acompanha equipa e tarefas; não altera billing nem configuração sensível.",
    can: [
      "Tudo o que o Staff pode",
      "Dashboard e visão geral",
      "Configuração (percepção; pessoas e papéis)",
      "Equipa e tarefas (ver progresso, checklist)",
      "Menu, operação, inventário, financeiro",
      "Mentor e health",
    ],
    cannot: [
      "Billing e faturação",
      "Integrações, módulos, status, pagamentos (apenas Dono)",
      "System tree e grupos",
    ],
  },
  {
    role: "owner",
    label: "Dono",
    description: "Acesso total ao restaurante.",
    can: [
      "Tudo o que o Gerente pode",
      "Configuração completa (módulos, pagamentos, integrações)",
      "Billing e faturação",
      "System tree, grupos, backoffice",
    ],
    cannot: [],
  },
];

export function RolesSummarySection() {
  return (
    <div style={{ maxWidth: 800 }}>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
        Resumo do que cada papel pode fazer. As rotas e ações da aplicação respeitam estes níveis.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {ROLES.map((r) => (
          <div
            key={r.role}
            style={{
              padding: 20,
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              backgroundColor: "var(--card-bg-on-dark)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
              {r.label}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-secondary)" }}>
              {r.description}
            </p>
            {r.can.length > 0 && (
              <div style={{ marginBottom: r.cannot.length > 0 ? 12 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-success)" }}>Pode: </span>
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {r.can.join("; ")}
                </span>
              </div>
            )}
            {r.cannot.length > 0 && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-error)" }}>Não pode: </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {r.cannot.join("; ")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
