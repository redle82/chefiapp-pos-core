/**
 * Centro de Ativação — Checklist de ativação (camada de Ativação).
 *
 * Primeira tela após o onboarding assistente. Não é POS nem KDS.
 * Mostra checklist: menu, mesas, impressora, usuários, teste pedido, ativar plano.
 * Cada item liga a /app/setup/* ou fluxo de teste.
 *
 * Ref: docs/contracts/FUNIL_VIDA_CLIENTE.md#arquitetura-de-jornada-em-3-camadas
 */
// @ts-nocheck


import { Link } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { openTpvInNewWindow } from "../../core/operational/openOperationalWindow";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #1c1917 100%)",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
    maxWidth: 560,
    margin: "0 auto",
  },
  header: {
    marginBottom: 32,
    textAlign: "center" as const,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 8,
    color: "#fafafa",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 14,
    color: "#a3a3a3",
    lineHeight: 1.5,
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderRadius: 10,
    border: "1px solid #262626",
    backgroundColor: "rgba(23, 23, 23, 0.8)",
    textDecoration: "none",
    color: "#fafafa",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  itemComplete: {
    borderColor: "#166534",
    backgroundColor: "rgba(22, 101, 52, 0.12)",
  },
  itemLabel: { flex: 1 },
  itemStatus: {
    fontSize: 12,
    color: "#a3a3a3",
    marginLeft: 12,
  },
  itemStatusComplete: { color: "#22c55e" },
  linkArrow: { color: "#a3a3a3", marginLeft: 8 },
  skipLink: {
    display: "block",
    marginTop: 24,
    textAlign: "center" as const,
    fontSize: 13,
    color: "#a3a3a3",
    textDecoration: "none",
  },
};

interface ChecklistItem {
  id: string;
  label: string;
  to: string;
  complete: boolean;
}

export function ActivationCenterPage() {
  const { runtime } = useRestaurantRuntime();
  const setupStatus = runtime?.setup_status ?? {};

  const items: ChecklistItem[] = [
    {
      id: "menu",
      label: "Criar menu",
      to: "/app/setup/menu",
      complete: !!setupStatus.menu,
    },
    {
      id: "mesas",
      label: "Configurar mesas",
      to: "/app/setup/mesas",
      complete: !!setupStatus.location,
    },
    {
      id: "impressora",
      label: "Configurar impressora",
      to: "/admin/printers",
      complete: !!setupStatus.payments,
    },
    {
      id: "usuarios",
      label: "Criar usuários",
      to: "/app/setup/equipe",
      complete: !!setupStatus.people,
    },
    {
      id: "teste",
      label: "Testar pedido",
      to: "/op/tpv?mode=trial",
      complete: false,
    },
    {
      id: "plano",
      label: "Ativar plano",
      to: "/app/billing",
      complete: false,
    },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Centro de Ativação</h1>
        <p style={styles.subtitle}>
          Complete os passos abaixo para ativar o seu restaurante. Cada item
          leva à configuração correspondente.
        </p>
      </header>
      <ul style={styles.list}>
        {items.map((item) => {
          // "Testar pedido" abre TPV em janela popup dedicada — nunca dentro do browser.
          if (item.id === "teste") {
            return (
              <li key={item.id} style={{ listStyle: "none" }}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{ ...styles.item }}
                  onClick={() => openTpvInNewWindow("mode=trial")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      openTpvInNewWindow("mode=trial");
                  }}
                >
                  <span style={styles.itemLabel}>{item.label}</span>
                  <span style={styles.itemStatus}>Fazer</span>
                  <span style={styles.linkArrow}>↗</span>
                </div>
              </li>
            );
          }
          return (
            <li key={item.id} style={{ listStyle: "none" }}>
              <Link
                to={item.to}
                style={{
                  ...styles.item,
                  ...(item.complete ? styles.itemComplete : {}),
                }}
              >
                <span style={styles.itemLabel}>{item.label}</span>
                <span
                  style={{
                    ...styles.itemStatus,
                    ...(item.complete ? styles.itemStatusComplete : {}),
                  }}
                >
                  {item.complete ? "Concluído" : "Fazer"}
                </span>
                <span style={styles.linkArrow}>→</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to="/app/dashboard" style={styles.skipLink}>
        Ir para o painel (já ativei tudo)
      </Link>
    </div>
  );
}
