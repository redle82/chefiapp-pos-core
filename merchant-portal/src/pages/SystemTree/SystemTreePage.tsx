/**
 * System Tree - Mapa cognitivo do ChefIApp OS
 *
 * 3 níveis de consciência:
 * - Executivo (default): resumido, traduzido, orientado a ação
 * - Operacional: Core resumido, domínios, módulos, permissões
 * - Arquitetural: engines, dependências, health, gaps
 */

import React from "react";
import { ExecutiveSummary } from "../../components/SystemTree/ExecutiveSummary";
import { SystemNodeDetails } from "../../components/SystemTree/SystemNodeDetails";
import { SystemTreeSidebar } from "../../components/SystemTree/SystemTreeSidebar";
import { ManagementAdvisor } from "../../components/onboarding/ManagementAdvisor";
import {
  SystemTreeProvider,
  useSystemTree,
} from "../../context/SystemTreeContext";
import { GlobalLoadingView } from "../../ui/design-system/components";

function SystemTreeContent() {
  const { loading, viewLevel, selectedNode } = useSystemTree();

  const getBreadcrumb = () => {
    if (selectedNode) return ["Restaurant OS", selectedNode.label];
    return ["Restaurant OS"];
  };

  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando System Tree..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  const showExecutiveSummary = viewLevel === "executive" && !selectedNode;

  const viewLabel =
    viewLevel === "executive"
      ? "Visão Executiva"
      : viewLevel === "operational"
      ? "Visão Operacional"
      : "Visão Arquitetural";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <SystemTreeSidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#f8f9fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getBreadcrumb().map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span style={{ color: "#999" }}>/</span>}
                <span
                  style={{
                    color:
                      index === getBreadcrumb().length - 1 ? "#1a1a1a" : "#666",
                  }}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          <span
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              color: "#4b5563",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {viewLabel}
          </span>
        </div>

        {showExecutiveSummary ? <ExecutiveSummary /> : <SystemNodeDetails />}
      </div>
    </div>
  );
}

export function SystemTreePage() {
  return (
    <ManagementAdvisor>
      <SystemTreeProvider>
        <SystemTreeContent />
      </SystemTreeProvider>
    </ManagementAdvisor>
  );
}
