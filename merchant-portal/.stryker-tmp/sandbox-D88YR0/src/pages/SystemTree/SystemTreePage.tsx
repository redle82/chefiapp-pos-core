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
import styles from "./SystemTreePage.module.css";

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
    <div className={styles.pageContainer}>
      <SystemTreeSidebar />

      <div className={styles.contentArea}>
        <div className={styles.header}>
          <div className={styles.breadcrumb}>
            {getBreadcrumb().map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className={styles.separator}>/</span>}
                <span
                  className={
                    index === getBreadcrumb().length - 1
                      ? styles.crumbActive
                      : styles.crumbInactive
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          <span className={styles.viewBadge}>{viewLabel}</span>
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
