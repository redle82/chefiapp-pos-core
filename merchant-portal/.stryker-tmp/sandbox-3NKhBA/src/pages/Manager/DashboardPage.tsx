/**
 * Manager Dashboard - Dashboard Principal
 *
 * Pergunta: "Está tudo bem agora?"
 *
 * Componentes:
 * - Status geral (verde / amarelo / vermelho)
 * - Alertas prioritários (acionáveis)
 * - Gargalos ativos (KDS, estoque, staff)
 * - Próxima decisão recomendada (IA)
 * - Acesso rápido às áreas críticas
 */
// @ts-nocheck


import { useNavigate } from "react-router-dom";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";

export function ManagerDashboardPage() {
  const navigate = useNavigate();

  // TODO: Integrar com Core para buscar status real
  // TODO: Buscar alertas prioritários
  // TODO: Buscar gargalos ativos
  // TODO: Buscar decisão recomendada da IA

  const status = "healthy"; // 'healthy' | 'warning' | 'critical'
  const alerts = [
    {
      id: "1",
      severity: "critical" as const,
      title: "Estoque crítico: Tomate (0kg)",
      action: "Comprar agora",
    },
    {
      id: "2",
      severity: "warning" as const,
      title: "KDS atrasado: 3 itens",
      action: "Ver KDS",
    },
  ];
  const bottlenecks = {
    kds: { station: "BAR", items: 2, status: "delayed" },
    stock: { items: 1, status: "critical" },
    staff: { coverage: "adequate", status: "ok" },
  };
  const nextDecision = {
    title: "Adicionar 1 pessoa no turno das 20h",
    context: "Previsão: 12 reservas confirmadas",
    action: "Aplicar",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "#28a745";
      case "warning":
        return "#ffc107";
      case "critical":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "healthy":
        return "SAUDÁVEL";
      case "warning":
        return "ATENÇÃO";
      case "critical":
        return "CRÍTICO";
      default:
        return "DESCONHECIDO";
    }
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      <Header title="Dashboard Principal" subtitle="Status do sistema" />

      <div style={{ padding: "16px" }}>
        {/* Status Geral */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
            border: `2px solid ${getStatusColor(status)}`,
          }}
        >
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
            Status Geral:
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: getStatusColor(status),
            }}
          >
            {getStatusLabel(status)}
          </div>
        </div>

        {/* Alertas Prioritários */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              ⚠️ ALERTAS PRIORITÁRIOS ({alerts.length})
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "16px",
                    border: `1px solid ${
                      alert.severity === "critical" ? "#dc3545" : "#ffc107"
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color:
                        alert.severity === "critical" ? "#dc3545" : "#ffc107",
                      marginBottom: "8px",
                    }}
                  >
                    {alert.severity === "critical" ? "🔴" : "🟡"} {alert.title}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "12px",
                    }}
                  >
                    Ação: {alert.action}
                  </div>
                  <button
                    onClick={() => {
                      if (alert.title.includes("Estoque")) {
                        navigate("/owner/purchases");
                      } else if (alert.title.includes("KDS")) {
                        navigate("/employee/operation");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor:
                        alert.severity === "critical" ? "#dc3545" : "#ffc107",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {alert.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gargalos Ativos */}
        <div style={{ marginBottom: "16px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}
          >
            📊 GARGALOS ATIVOS
          </h3>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #e0e0e0",
            }}
          >
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>
              KDS: {bottlenecks.kds.station} ({bottlenecks.kds.items} itens{" "}
              {bottlenecks.kds.status === "delayed" ? "atrasados" : ""})
            </div>
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>
              Estoque: {bottlenecks.stock.items} item
              {bottlenecks.stock.items > 1 ? "s" : ""}{" "}
              {bottlenecks.stock.status === "critical" ? "crítico" : ""}
            </div>
            <div style={{ fontSize: "14px" }}>
              Staff: Cobertura{" "}
              {bottlenecks.staff.coverage === "adequate"
                ? "adequada"
                : "insuficiente"}
            </div>
          </div>
        </div>

        {/* Próxima Decisão (IA) */}
        {nextDecision && (
          <div style={{ marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              💡 PRÓXIMA DECISÃO (IA)
            </h3>
            <div
              style={{
                backgroundColor: "#e7f3ff",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #667eea",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                "{nextDecision.title}"
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "12px",
                }}
              >
                {nextDecision.context}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    // TODO: Aplicar decisão
                    navigate("/manager/schedule");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#667eea",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Aplicar
                </button>
                <button
                  onClick={() => {
                    // TODO: Ver detalhes
                    navigate("/manager/central");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Ver detalhes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Acesso Rápido */}
        <div>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}
          >
            🚀 ACESSO RÁPIDO
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button
              onClick={() => navigate("/employee/operation")}
              style={{
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Operação
            </button>
            <button
              onClick={() => navigate("/owner/purchases")}
              style={{
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Estoque
            </button>
            <button
              onClick={() => navigate("/owner/purchases")}
              style={{
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Compras
            </button>
            <button
              onClick={() => navigate("/manager/central")}
              style={{
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Central
            </button>
            <button
              onClick={() => navigate("/manager/reservations")}
              style={{
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Reservas
            </button>
          </div>
        </div>
      </div>

      <BottomTabs role="manager" />
    </div>
  );
}
