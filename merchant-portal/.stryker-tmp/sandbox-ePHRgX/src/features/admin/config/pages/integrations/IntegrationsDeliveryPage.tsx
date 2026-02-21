/**
 * IntegrationsDeliveryPage - Delivery platforms (GloriaFood, Glovo, Uber Eats, Deliveroo).
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md §3.2
 *
 * Config, ativar/desativar por adapter, status de cada plataforma.
 */
// @ts-nocheck


import { useState } from "react";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

interface DeliveryPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "disabled" | "configured" | "active" | "coming_soon";
  features: string[];
}

const PLATFORMS: DeliveryPlatform[] = [
  {
    id: "gloriafood",
    name: "GloriaFood",
    description:
      "Receba pedidos do GloriaFood diretamente no TPV. Sincronize menu automaticamente.",
    icon: "🍕",
    status: "configured",
    features: [
      "Receção de pedidos",
      "Sincronização de menu",
      "Aceitação automática",
    ],
  },
  {
    id: "glovo",
    name: "Glovo",
    description:
      "Integração com Glovo para receção de pedidos e tracking de entregas.",
    icon: "🟡",
    status: "coming_soon",
    features: [
      "Receção de pedidos",
      "Tracking de entregas",
      "Gestão de disponibilidade",
    ],
  },
  {
    id: "ubereats",
    name: "Uber Eats",
    description:
      "Receba pedidos do Uber Eats e gerencie o status diretamente do ChefIApp.",
    icon: "🟢",
    status: "coming_soon",
    features: [
      "Receção de pedidos",
      "Atualização de status",
      "Relatórios de vendas",
    ],
  },
  {
    id: "deliveroo",
    name: "Deliveroo",
    description:
      "Integração com Deliveroo para gestão centralizada de pedidos de delivery.",
    icon: "🔵",
    status: "coming_soon",
    features: [
      "Receção de pedidos",
      "Gestão de menu",
      "Métricas de performance",
    ],
  },
];

const statusLabels: Record<string, string> = {
  disabled: "Desativado",
  configured: "Configurado",
  active: "Ativo",
  coming_soon: "Em breve",
};

const statusColors: Record<string, { color: string; bg: string }> = {
  disabled: { color: "var(--text-secondary)", bg: "var(--card-bg-on-dark)" },
  configured: { color: "var(--color-warning)", bg: "var(--status-warning-bg)" },
  active: { color: "var(--color-success)", bg: "var(--status-success-bg)" },
  coming_soon: { color: "var(--text-secondary)", bg: "var(--card-bg-on-dark)" },
};

export function IntegrationsDeliveryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [platformStates, setPlatformStates] = useState<Record<string, boolean>>(
    {
      gloriafood: false,
      glovo: false,
      ubereats: false,
      deliveroo: false,
    },
  );
  const [gloriaConfig, setGloriaConfig] = useState({
    restaurantKey: "",
    autoAccept: false,
    syncMenu: true,
  });
  const [gloriaSaveStatus, setGloriaSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  const togglePlatform = (id: string) => {
    setPlatformStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGloriaSave = () => {
    setGloriaSaveStatus("saving");
    setTimeout(() => {
      setGloriaSaveStatus("saved");
      setTimeout(() => setGloriaSaveStatus("idle"), 2000);
    }, 500);
  };

  return (
    <>
      <AdminPageHeader
        title="Delivery"
        subtitle="GloriaFood, Glovo, Uber Eats, Deliveroo — ativar/desativar por adapter."
      />

      {/* ── Overview Stats ── */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: "Plataformas ativas",
              value: Object.values(platformStates).filter(Boolean).length,
              color: "var(--color-success)",
            },
            { label: "Pedidos hoje", value: 0, color: "var(--text-primary)" },
            {
              label: "Taxa aceitação",
              value: "—",
              color: "var(--text-primary)",
            },
            { label: "Tempo médio", value: "—", color: "var(--text-primary)" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: 16,
                border: "1px solid var(--surface-border)",
                borderRadius: 10,
                backgroundColor: "var(--card-bg-on-dark)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  color: stat.color,
                }}
              >
                {stat.value}
              </p>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Cards ── */}
      <section>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLATFORMS.map((platform) => {
            const sColors = statusColors[platform.status];
            const isExpanded = expandedId === platform.id;
            const isEnabled = platformStates[platform.id];

            return (
              <div
                key={platform.id}
                style={{
                  border: "1px solid var(--surface-border)",
                  borderRadius: 12,
                  backgroundColor: "var(--card-bg-on-dark)",
                  overflow: "hidden",
                  opacity: platform.status === "coming_soon" ? 0.85 : 1,
                }}
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : platform.id)}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ fontSize: 24 }}>{platform.icon}</span>
                    <div>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          margin: 0,
                          color: "var(--text-primary)",
                        }}
                      >
                        {platform.name}
                      </h3>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        background: sColors.bg,
                        color: sColors.color,
                      }}
                    >
                      {statusLabels[platform.status]}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        transition: "transform 0.2s",
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 20px 20px",
                      borderTop: "1px solid var(--surface-border)",
                    }}
                  >
                    {platform.status === "coming_soon" ? (
                      <div style={{ padding: "16px 0" }}>
                        <p
                          style={{
                            fontSize: 14,
                            color: "var(--text-secondary)",
                            margin: 0,
                          }}
                        >
                          Esta integração está em desenvolvimento. Será
                          disponibilizada numa próxima atualização.
                        </p>
                        <div style={{ marginTop: 12 }}>
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--text-primary)",
                              margin: "0 0 8px",
                            }}
                          >
                            Funcionalidades previstas:
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {platform.features.map((f) => (
                              <li
                                key={f}
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  marginBottom: 4,
                                }}
                              >
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "16px 0" }}>
                        {/* Toggle */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 16,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => togglePlatform(platform.id)}
                          />
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            Ativar {platform.name}
                          </span>
                        </label>

                        {/* Features */}
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            margin: "0 0 8px",
                          }}
                        >
                          Funcionalidades:
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginBottom: 16,
                          }}
                        >
                          {platform.features.map((f) => (
                            <span
                              key={f}
                              style={{
                                padding: "3px 10px",
                                borderRadius: 6,
                                fontSize: 12,
                                background: "var(--status-primary-bg)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>

                        {/* Config fields (GloriaFood example) */}
                        {platform.id === "gloriafood" && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              maxWidth: 400,
                            }}
                          >
                            <label style={{ fontSize: 13 }}>
                              Restaurant Key (GloriaFood)
                              <input
                                type="text"
                                value={gloriaConfig.restaurantKey}
                                onChange={(e) =>
                                  setGloriaConfig((prev) => ({
                                    ...prev,
                                    restaurantKey: e.target.value,
                                  }))
                                }
                                placeholder="Cole a sua restaurant key..."
                                style={{
                                  display: "block",
                                  marginTop: 4,
                                  padding: "8px 12px",
                                  border: "1px solid var(--surface-border)",
                                  borderRadius: 8,
                                  width: "100%",
                                  backgroundColor: "var(--input-bg, #1a1a1a)",
                                  color: "var(--text-primary)",
                                  fontSize: 13,
                                }}
                              />
                            </label>
                            <label style={{ fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={gloriaConfig.autoAccept}
                                onChange={(e) =>
                                  setGloriaConfig((prev) => ({
                                    ...prev,
                                    autoAccept: e.target.checked,
                                  }))
                                }
                                style={{ marginRight: 6 }}
                              />
                              Aceitação automática de pedidos
                            </label>
                            <label style={{ fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={gloriaConfig.syncMenu}
                                onChange={(e) =>
                                  setGloriaConfig((prev) => ({
                                    ...prev,
                                    syncMenu: e.target.checked,
                                  }))
                                }
                                style={{ marginRight: 6 }}
                              />
                              Sincronizar menu
                            </label>
                            <button
                              onClick={handleGloriaSave}
                              disabled={gloriaSaveStatus === "saving"}
                              style={{
                                marginTop: 6,
                                padding: "8px 14px",
                                borderRadius: 8,
                                border: "none",
                                background: "var(--color-primary)",
                                color: "white",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor:
                                  gloriaSaveStatus === "saving"
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  gloriaSaveStatus === "saving" ? 0.7 : 1,
                              }}
                            >
                              {gloriaSaveStatus === "saving"
                                ? "A guardar…"
                                : gloriaSaveStatus === "saved"
                                ? "✓ Guardado"
                                : "Guardar configuração"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
