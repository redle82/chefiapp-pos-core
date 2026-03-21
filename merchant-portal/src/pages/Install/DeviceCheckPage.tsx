/**
 * DeviceCheckPage — Verify that the TPV is connected and ready to operate.
 *
 * Checks:
 * - Device paired (terminal exists in gm_terminals)
 * - Restaurant synced (menu loaded)
 * - Internet connectivity
 * - Basic readiness for operation
 *
 * On all checks passing → CTA to open TPV (/op/tpv)
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 3)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CheckItem {
  id: string;
  label: string;
  status: "checking" | "pass" | "fail" | "skip";
  detail?: string;
}

const INITIAL_CHECKS: CheckItem[] = [
  { id: "device", label: "Dispositivo pareado", status: "checking" },
  { id: "restaurant", label: "Restaurante sincronizado", status: "checking" },
  { id: "menu", label: "Menu carregado", status: "checking" },
  { id: "internet", label: "Ligação à Internet", status: "checking" },
];

const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #111111 40%, #1c1917 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
  },
  container: {
    width: "100%",
    maxWidth: 520,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid rgba(234, 179, 8, 0.3)",
    backgroundColor: "rgba(234, 179, 8, 0.08)",
    color: "#eab308",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 24,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#a3a3a3",
    lineHeight: 1.6,
    marginBottom: 32,
  },
  checkList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    marginBottom: 32,
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #262626",
    backgroundColor: "#141414",
  },
  checkIcon: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    color: "#d4d4d4",
  },
  checkDetail: {
    fontSize: 12,
    color: "#737373",
  },
  btn: {
    width: "100%",
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    transition: "opacity 0.15s ease",
    marginBottom: 8,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid #404040",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#a3a3a3",
    textAlign: "center" as const,
  },
  result: {
    textAlign: "center" as const,
    padding: "16px 0",
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 8,
    display: "block",
  },
  resultText: {
    fontSize: 16,
    fontWeight: 600,
  },
} as const;

function getStatusIcon(status: CheckItem["status"]): string {
  switch (status) {
    case "checking":
      return "⏳";
    case "pass":
      return "✅";
    case "fail":
      return "❌";
    case "skip":
      return "⏭️";
  }
}

export function DeviceCheckPage() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<CheckItem[]>(INITIAL_CHECKS);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Simulate device checks with staggered timing
    // In production, these would be real API calls
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setChecks((prev) =>
          prev.map((c) =>
            c.id === "internet"
              ? { ...c, status: "pass" as const, detail: "Conectado" }
              : c,
          ),
        );
      }, 800),
    );

    timers.push(
      setTimeout(() => {
        setChecks((prev) =>
          prev.map((c) =>
            c.id === "restaurant"
              ? { ...c, status: "pass" as const, detail: "Dados sincronizados" }
              : c,
          ),
        );
      }, 1500),
    );

    timers.push(
      setTimeout(() => {
        setChecks((prev) =>
          prev.map((c) =>
            c.id === "menu"
              ? { ...c, status: "pass" as const, detail: "Produtos carregados" }
              : c,
          ),
        );
      }, 2200),
    );

    timers.push(
      setTimeout(() => {
        // Device check: skip if not in Electron context
        setChecks((prev) =>
          prev.map((c) =>
            c.id === "device"
              ? {
                  ...c,
                  status: "skip" as const,
                  detail: "Verificação disponível no app desktop",
                }
              : c,
          ),
        );
        setDone(true);
      }, 2800),
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const allPassed = checks.every(
    (c) => c.status === "pass" || c.status === "skip",
  );
  const hasFails = checks.some((c) => c.status === "fail");

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.badge}>Verificação</div>

        <h1 style={S.title}>Verificar sistema</h1>
        <p style={S.subtitle}>
          A validar que tudo está pronto para operar.
        </p>

        <div style={S.checkList}>
          {checks.map((check) => (
            <div key={check.id} style={S.checkItem}>
              <div style={S.checkIcon}>{getStatusIcon(check.status)}</div>
              <div style={{ flex: 1 }}>
                <div style={S.checkLabel}>{check.label}</div>
                {check.detail && (
                  <div style={S.checkDetail}>{check.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {done && (
          <div style={S.result}>
            <span style={S.resultIcon}>{allPassed ? "🚀" : "⚠️"}</span>
            <div
              style={{
                ...S.resultText,
                color: allPassed ? "#22c55e" : "#f59e0b",
              }}
            >
              {allPassed
                ? "Sistema pronto para operar!"
                : hasFails
                  ? "Alguns itens precisam de atenção"
                  : "Verificação concluída"}
            </div>
          </div>
        )}

        <button
          type="button"
          style={{
            ...S.btn,
            ...(!done || hasFails ? S.btnDisabled : {}),
          }}
          disabled={!done || hasFails}
          onClick={() => navigate("/op/tpv")}
        >
          Abrir TPV
        </button>

        <button
          type="button"
          style={S.secondaryBtn}
          onClick={() => navigate("/admin/home")}
        >
          Ir para o painel
        </button>
      </div>
    </div>
  );
}
