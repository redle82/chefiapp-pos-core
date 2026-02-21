/**
 * SystemNodeDetails - Painel de Detalhes do Nó Selecionado
 *
 * Nível Executivo: narrativa humana + ação recomendada.
 * Nível Operacional/Arquitetural: detalhes técnicos.
 */
// @ts-nocheck


import React, { useContext } from "react";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import { useSystemTree } from "../../context/SystemTreeContext";
import {
  getLockedNarrative,
  getRecommendedAction,
  statusToHumanLabel,
  typeToHumanLabel,
} from "./systemTreeHumanLabels";
function LockedNarrativeBlock({
  narrative,
}: {
  narrative: ReturnType<typeof getLockedNarrative>;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "12px",
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#991b1b",
          fontWeight: 600,
          marginBottom: "12px",
        }}
      >
        🔒 Domínio / recurso não ativo
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          fontSize: "14px",
        }}
      >
        <div>
          <div style={{ color: "#6b7280", marginBottom: "2px" }}>O que é</div>
          <div style={{ color: "#1f2937" }}>{narrative.oQueE}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", marginBottom: "2px" }}>
            Por que está bloqueado
          </div>
          <div style={{ color: "#1f2937" }}>{narrative.porQueBloqueado}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", marginBottom: "2px" }}>
            O que destrava
          </div>
          <div style={{ color: "#1f2937", fontWeight: 500 }}>
            👉 {narrative.oQueDestrava}
          </div>
        </div>
        <div>
          <div style={{ color: "#6b7280", marginBottom: "2px" }}>
            Agora ou depois
          </div>
          <div style={{ color: "#1f2937" }}>{narrative.agoraOuDepois}</div>
        </div>
      </div>
    </div>
  );
}

export function SystemNodeDetails() {
  const { selectedNode, viewLevel } = useSystemTree();
  const runtime = useContext(RestaurantRuntimeContext)?.runtime;
  const setupStatus = runtime?.setup_status ?? {};

  if (!selectedNode) {
    return (
      <div
        style={{
          flex: 1,
          padding: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#858585",
          fontSize: "14px",
        }}
      >
        Selecione um nó para ver os detalhes
      </div>
    );
  }

  const { emoji, label: statusLabel } = statusToHumanLabel(selectedNode.status);
  const typeLabel = typeToHumanLabel(selectedNode.type);
  const action = getRecommendedAction(setupStatus);

  const isLocked = selectedNode.locked || selectedNode.status === "locked";
  const lockedNarrative = isLocked
    ? getLockedNarrative({
        id: selectedNode.id,
        label: selectedNode.label,
        type: selectedNode.type,
        description: selectedNode.description,
        lockedReason: selectedNode.lockedReason,
        installable: selectedNode.installable,
      })
    : null;

  if (viewLevel === "executive") {
    return (
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "24px" }}>{selectedNode.icon}</span>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
              {selectedNode.label}
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor:
                  statusLabel === "Ativo"
                    ? "#dcfce7"
                    : statusLabel === "Bloqueado"
                    ? "#fee2e2"
                    : "#fef9c3",
                color:
                  statusLabel === "Ativo"
                    ? "#166534"
                    : statusLabel === "Bloqueado"
                    ? "#991b1b"
                    : "#854d0e",
              }}
            >
              {emoji} {statusLabel}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
            {typeLabel}
          </p>
        </div>

        {isLocked && lockedNarrative && (
          <LockedNarrativeBlock narrative={lockedNarrative} />
        )}

        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            backgroundColor: "#eff6ff",
            border: "1px solid #93c5fd",
            marginTop: isLocked ? "20px" : 0,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#1e40af",
              fontWeight: 600,
              marginBottom: "4px",
            }}
          >
            O que faço agora?
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a" }}>
            👉{" "}
            {isLocked
              ? lockedNarrative!.oQueDestrava
              : action.charAt(0).toUpperCase() + action.slice(1)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: "24px",
        overflowY: "auto",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>{selectedNode.icon}</span>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
            {selectedNode.label}
          </h1>
          <StatusBadge status={selectedNode.status} />
        </div>
        {selectedNode.description && (
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#666" }}>
            {selectedNode.description}
          </p>
        )}
      </div>

      {isLocked && lockedNarrative && (
        <LockedNarrativeBlock narrative={lockedNarrative} />
      )}

      {/* Status */}
      <Section title="Status">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <InfoRow label="Status" value={selectedNode.status} />
          <InfoRow label="Tipo" value={selectedNode.type} />
          {selectedNode.locked && (
            <InfoRow
              label="Bloqueado"
              value={selectedNode.lockedReason || "Sim"}
            />
          )}
        </div>
      </Section>

      {/* Dependencies */}
      {viewLevel === "architectural" &&
        selectedNode.dependencies &&
        selectedNode.dependencies.length > 0 && (
          <Section title="Dependências">
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {selectedNode.dependencies.map((dep) => (
                <li key={dep} style={{ marginBottom: "4px" }}>
                  {dep}
                </li>
              ))}
            </ul>
          </Section>
        )}

      {/* Events */}
      {viewLevel === "architectural" &&
        selectedNode.events &&
        selectedNode.events.length > 0 && (
          <Section title="Eventos Produzidos">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {selectedNode.events.map((event) => (
                <Tag key={event}>{event}</Tag>
              ))}
            </div>
          </Section>
        )}

      {/* Data Consumed */}
      {viewLevel === "architectural" &&
        selectedNode.dataConsumed &&
        selectedNode.dataConsumed.length > 0 && (
          <Section title="Dados Consumidos">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {selectedNode.dataConsumed.map((data) => (
                <Tag key={data}>{data}</Tag>
              ))}
            </div>
          </Section>
        )}

      {/* Data Produced */}
      {viewLevel === "architectural" &&
        selectedNode.dataProduced &&
        selectedNode.dataProduced.length > 0 && (
          <Section title="Dados Produzidos">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {selectedNode.dataProduced.map((data) => (
                <Tag key={data}>{data}</Tag>
              ))}
            </div>
          </Section>
        )}

      {/* Actions */}
      {(selectedNode.installable || selectedNode.actionable) && (
        <Section title="Ações">
          <div style={{ display: "flex", gap: "8px" }}>
            {selectedNode.installable &&
              selectedNode.status === "not_installed" && (
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Instalar
                </button>
              )}
            {selectedNode.actionable && (
              <button
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Configurar
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Metadata */}
      {viewLevel === "architectural" &&
        selectedNode.metadata &&
        Object.keys(selectedNode.metadata).length > 0 && (
          <Section title="Informações Adicionais">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {Object.entries(selectedNode.metadata).map(([key, value]) => (
                <InfoRow
                  key={key}
                  label={key}
                  value={
                    typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)
                  }
                />
              ))}
            </div>
          </Section>
        )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <span style={{ fontWeight: 600, minWidth: "120px", color: "#666" }}>
        {label}:
      </span>
      <span style={{ color: "#1a1a1a" }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getColor = (status: string) => {
    switch (status) {
      case "active":
      case "installed":
      case "complete":
        return "#28a745";
      case "inactive":
      case "not_installed":
      case "incomplete":
        return "#ffc107";
      case "locked":
        return "#dc3545";
      case "dormant":
        return "#6c757d";
      case "observing":
        return "#007bff";
      default:
        return "#6c757d";
    }
  };

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: getColor(status),
        color: "white",
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        backgroundColor: "#f0f0f0",
        color: "#666",
      }}
    >
      {children}
    </span>
  );
}
