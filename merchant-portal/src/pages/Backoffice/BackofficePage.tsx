import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useBootstrapState } from "../../hooks/useBootstrapState";

type ItemStatus = "incomplete" | "partial" | "complete" | "optional";

interface BackofficeItem {
  id: string;
  label: string;
  icon: string;
  target: string;
  status: ItemStatus;
}

function statusToSymbol(status: ItemStatus): string {
  switch (status) {
    case "complete":
      return "✅";
    case "partial":
      return "⚠️";
    case "incomplete":
      return "❌";
    case "optional":
    default:
      return "—";
  }
}

export function BackofficePage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const bootstrap = useBootstrapState();

  const setup = runtime.setup_status || {};
  const has = (k: string) => !!setup[k];
  const activeModules = runtime.active_modules || [];
  const hasModule = (id: string) => activeModules.includes(id);

  const inOperacaoReal = bootstrap.operationMode === "operacao-real";

  const items: BackofficeItem[] = [
    {
      id: "menu",
      label: "Cardápio",
      icon: "📋",
      target: "/app/setup/menu",
      status: has("menu") ? "complete" : "incomplete",
    },
    {
      id: "tables",
      label: "Mesas",
      icon: "🪑",
      target: "/app/setup/mesas",
      status: has("location") ? "complete" : "incomplete",
    },
    {
      id: "people",
      label: "Equipe",
      icon: "👥",
      target: "/app/setup/equipe",
      status: has("people") ? "complete" : "incomplete",
    },
    {
      id: "schedule",
      label: "Horários",
      icon: "🕒",
      target: "/app/setup/horarios",
      status: has("schedule") ? "complete" : "incomplete",
    },
    {
      id: "payments",
      label: "Pagamentos",
      icon: "💳",
      target: "/app/setup/pagamentos",
      status: has("payments") ? "complete" : "incomplete",
    },
    {
      id: "tpv",
      label: "TPV",
      icon: "🧾",
      target: "/app/setup/tpv",
      status: hasModule("tpv") ? "partial" : "optional",
    },
    {
      id: "kds",
      label: "KDS",
      icon: "🔥",
      target: "/app/setup/kds",
      status: hasModule("kds") ? "partial" : "optional",
    },
    {
      id: "stock",
      label: "Estoque",
      icon: "📦",
      target: "/app/setup/estoque",
      status: "optional",
    },
    {
      id: "preferences",
      label: "Preferências",
      icon: "⚙️",
      target: "/app/setup/preferencias",
      status: "complete",
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#050816",
          color: "#f9fafb",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: "260px",
            padding: "24px 16px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.95) 40%, rgba(5,8,22,1) 100%)",
          }}
        >
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Backoffice
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "16px",
            }}
          >
            Setup linear do restaurante. Um passo de cada vez.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.target)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  color: "#e5e7eb",
                  fontSize: "14px",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    opacity: item.status === "optional" ? 0.6 : 1,
                  }}
                >
                  {statusToSymbol(item.status)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Conteúdo */}
        <main
          style={{
            flex: 1,
            padding: "32px 32px",
            backgroundColor: "#020617",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#e5e7eb",
            }}
          >
            Setup do restaurante
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#9ca3af",
              maxWidth: "520px",
              marginBottom: "24px",
            }}
          >
            Use o menu à esquerda para configurar Cardápio, Mesas, Equipe,
            Horários e Pagamentos. Cada item leva direto para a tela existente.
          </p>

          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#e5e7eb",
            }}
          >
            Plano e modo
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#94a3b8",
              marginBottom: 12,
              maxWidth: "520px",
            }}
          >
            Transições de modo são raras e definidas pelo contrato. Aqui você
            pode solicitar trial ou ao vivo; a confirmação e persistência vêm do
            backend.
          </p>

          {!inOperacaoReal && (
            <div
              style={{
                marginBottom: "24px",
                padding: "14px 18px",
                borderRadius: "10px",
                border: "1px solid rgba(34,197,94,0.3)",
                backgroundColor: "rgba(34,197,94,0.08)",
                maxWidth: "560px",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#86efac",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                TPV e KDS estão disponíveis em operação real. Operação real
                requer publicação e Core online.
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: "32px",
              padding: "24px",
              borderRadius: "12px",
              border: "1px dashed rgba(148,163,184,0.4)",
              background:
                "radial-gradient(circle at top, rgba(30,64,175,0.25), transparent 55%)",
              maxWidth: "560px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "#e5e7eb",
              }}
            >
              Como usar este painel
            </h3>
            <ul
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                paddingLeft: "18px",
                listStyleType: "disc",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <li>
                Clique em um item da lista para ir direto à tela de edição.
              </li>
              <li>
                Use os símbolos ❌ ⚠️ ✅ / — apenas como leitura; o estado vem
                do runtime do restaurante.
              </li>
              <li>
                Nenhuma regra nova é criada aqui — este painel só organiza o
                acesso ao que já existe.
              </li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}
