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
      <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
        Resumo do que cada papel pode fazer. As rotas e ações da aplicação respeitam estes níveis.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {ROLES.map((r) => (
          <div
            key={r.role}
            style={{
              padding: 20,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              backgroundColor: "#fafafa",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#333" }}>
              {r.label}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666" }}>
              {r.description}
            </p>
            {r.can.length > 0 && (
              <div style={{ marginBottom: r.cannot.length > 0 ? 12 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>Pode: </span>
                <span style={{ fontSize: 13, color: "#333" }}>
                  {r.can.join("; ")}
                </span>
              </div>
            )}
            {r.cannot.length > 0 && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#b91c1c" }}>Não pode: </span>
                <span style={{ fontSize: 13, color: "#666" }}>
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
