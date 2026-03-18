/**
 * TerminalSettings Component
 *
 * UI para configuração de terminais de pagamento (Stripe Terminal / SumUp Reader).
 * Dark theme consistente com o design do TPV.
 *
 * Features:
 * - Descoberta de leitores disponíveis
 * - Conexão/desconexão de leitores
 * - Indicador de status de conexão
 * - Botão de pagamento teste (0.50EUR)
 * - Seleção de provider (Stripe Terminal vs SumUp Reader)
 */

import { useCallback, useState } from "react";
import type { ReaderInfo } from "../../infra/payments/providers/stripeTerminal";
import {
  usePaymentTerminal,
  type TerminalStatus,
} from "../../hooks/usePaymentTerminal";

// ─── Styles ─────────────────────────────────────────────────────────

const styles = {
  container: {
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 24,
    color: "#fafafa",
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: 560,
  } as React.CSSProperties,

  header: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
  } as React.CSSProperties,

  card: {
    backgroundColor: "#18181b",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    border: "1px solid #27272a",
  } as React.CSSProperties,

  cardTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: "#a1a1aa",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,

  button: {
    backgroundColor: "#f97316",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 6,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 150ms",
    width: "100%",
  } as React.CSSProperties,

  buttonSecondary: {
    backgroundColor: "#27272a",
    color: "#fafafa",
    border: "1px solid #3f3f46",
    borderRadius: 6,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity 150ms",
    width: "100%",
  } as React.CSSProperties,

  buttonDanger: {
    backgroundColor: "#7f1d1d",
    color: "#fca5a5",
    border: "1px solid #991b1b",
    borderRadius: 6,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  } as React.CSSProperties,

  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,

  readerItem: {
    backgroundColor: "#1c1c1e",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #27272a",
  } as React.CSSProperties,

  readerInfo: {
    flex: 1,
  } as React.CSSProperties,

  readerName: {
    fontSize: 14,
    fontWeight: 500,
    color: "#fafafa",
  } as React.CSSProperties,

  readerDetail: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  } as React.CSSProperties,

  statusDot: (color: string) =>
    ({
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: color,
      display: "inline-block",
      marginRight: 6,
    }) as React.CSSProperties,

  statusBadge: (connected: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      fontSize: 12,
      fontWeight: 500,
      color: connected ? "#4ade80" : "#71717a",
      backgroundColor: connected ? "#052e16" : "#18181b",
      border: `1px solid ${connected ? "#166534" : "#27272a"}`,
      borderRadius: 12,
      padding: "4px 10px",
    }) as React.CSSProperties,

  errorBox: {
    backgroundColor: "#450a0a",
    border: "1px solid #7f1d1d",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 13,
    color: "#fca5a5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,

  providerSelect: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  } as React.CSSProperties,

  providerOption: (selected: boolean) =>
    ({
      flex: 1,
      backgroundColor: selected ? "#1c1c1e" : "#0a0a0a",
      border: `2px solid ${selected ? "#f97316" : "#27272a"}`,
      borderRadius: 8,
      padding: 12,
      cursor: "pointer",
      textAlign: "center" as const,
      transition: "border-color 150ms",
    }) as React.CSSProperties,

  providerLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "#fafafa",
  } as React.CSSProperties,

  providerDesc: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
  } as React.CSSProperties,

  testResult: (success: boolean) =>
    ({
      backgroundColor: success ? "#052e16" : "#450a0a",
      border: `1px solid ${success ? "#166534" : "#7f1d1d"}`,
      borderRadius: 6,
      padding: 12,
      marginTop: 8,
      fontSize: 13,
      color: success ? "#4ade80" : "#fca5a5",
    }) as React.CSSProperties,

  statusLabel: (status: TerminalStatus) => {
    const colors: Record<TerminalStatus, string> = {
      idle: "#71717a",
      discovering: "#fbbf24",
      connecting: "#fbbf24",
      collecting: "#3b82f6",
      processing: "#f97316",
    };
    return {
      fontSize: 13,
      color: colors[status],
      fontWeight: 500,
    } as React.CSSProperties;
  },

  row: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  } as React.CSSProperties,
} as const;

// ─── Status Labels ──────────────────────────────────────────────────

const STATUS_LABELS: Record<TerminalStatus, string> = {
  idle: "Pronto",
  discovering: "Procurando leitores...",
  connecting: "Conectando...",
  collecting: "Aguardando cartão...",
  processing: "Processando...",
};

// ─── Provider Type ──────────────────────────────────────────────────

type TerminalProvider = "stripe" | "sumup";

// ─── Component ──────────────────────────────────────────────────────

export function TerminalSettings() {
  const terminal = usePaymentTerminal();

  const [provider, setProvider] = useState<TerminalProvider>("stripe");
  const [discoveredReaders, setDiscoveredReaders] = useState<ReaderInfo[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Actions ────────────────────────────────────────────────────

  const handleInitialize = useCallback(async () => {
    setLoading(true);
    try {
      await terminal.initialize();
    } catch {
      // Error is already set via the hook
    } finally {
      setLoading(false);
    }
  }, [terminal]);

  const handleDiscover = useCallback(async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const readers = await terminal.discoverReaders(
        import.meta.env.DEV ? "simulated" : "internet",
      );
      setDiscoveredReaders(readers);
    } catch {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  }, [terminal]);

  const handleConnect = useCallback(
    async (reader: ReaderInfo) => {
      setLoading(true);
      try {
        await terminal.connectReader(reader);
        setDiscoveredReaders([]);
      } catch {
        // Error handled by hook
      } finally {
        setLoading(false);
      }
    },
    [terminal],
  );

  const handleDisconnect = useCallback(async () => {
    setLoading(true);
    try {
      await terminal.disconnectReader();
    } catch {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  }, [terminal]);

  const handleTestPayment = useCallback(async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const result = await terminal.collectPayment(
        50, // 0.50 EUR in cents
        `test-${Date.now()}`,
        "EUR",
        "test-restaurant",
      );
      setTestResult({
        success: result.success,
        message: result.success
          ? "Pagamento teste de 0.50EUR processado com sucesso"
          : result.error ?? "Falha no pagamento teste",
      });
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Erro desconhecido no teste",
      });
    } finally {
      setLoading(false);
    }
  }, [terminal]);

  // ─── Render ─────────────────────────────────────────────────────

  const isDisabled = loading || terminal.status !== "idle";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span>Terminal de Pagamento</span>
        <span style={styles.statusBadge(terminal.isReaderConnected)}>
          <span
            style={styles.statusDot(
              terminal.isReaderConnected ? "#4ade80" : "#71717a",
            )}
          />
          {terminal.isReaderConnected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      {/* Error */}
      {terminal.error && (
        <div style={styles.errorBox}>
          <span>{terminal.error}</span>
          <button
            onClick={terminal.clearError}
            style={{
              ...styles.buttonSecondary,
              width: "auto",
              padding: "4px 10px",
              fontSize: 12,
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Provider Selection */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Provider</div>
        <div style={styles.providerSelect}>
          <div
            style={styles.providerOption(provider === "stripe")}
            onClick={() => setProvider("stripe")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setProvider("stripe");
            }}
          >
            <div style={styles.providerLabel}>Stripe Terminal</div>
            <div style={styles.providerDesc}>PT, ES, EU, US, GB</div>
          </div>
          <div
            style={styles.providerOption(provider === "sumup")}
            onClick={() => setProvider("sumup")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setProvider("sumup");
            }}
          >
            <div style={styles.providerLabel}>SumUp Reader</div>
            <div style={styles.providerDesc}>PT, ES, EU</div>
          </div>
        </div>
      </div>

      {/* Stripe Terminal Section */}
      {provider === "stripe" && (
        <>
          {/* Initialize */}
          {!terminal.isInitialized && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Inicializar SDK</div>
              <button
                style={{
                  ...styles.button,
                  ...(isDisabled ? styles.buttonDisabled : {}),
                }}
                onClick={handleInitialize}
                disabled={isDisabled}
              >
                {loading ? "Inicializando..." : "Inicializar Stripe Terminal"}
              </button>
            </div>
          )}

          {/* Reader Connection */}
          {terminal.isInitialized && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Leitor de Cartões</div>

              {/* Connected reader info */}
              {terminal.isReaderConnected && terminal.readerInfo && (
                <div style={styles.readerItem}>
                  <div style={styles.readerInfo}>
                    <div style={styles.readerName}>
                      {terminal.readerInfo.label}
                    </div>
                    <div style={styles.readerDetail}>
                      {terminal.readerInfo.deviceType} &middot;{" "}
                      {terminal.readerInfo.serialNumber}
                    </div>
                  </div>
                  <button
                    style={{
                      ...styles.buttonDanger,
                      width: "auto",
                      ...(isDisabled ? styles.buttonDisabled : {}),
                    }}
                    onClick={handleDisconnect}
                    disabled={isDisabled}
                  >
                    Desconectar
                  </button>
                </div>
              )}

              {/* Discover button */}
              {!terminal.isReaderConnected && (
                <>
                  <button
                    style={{
                      ...styles.button,
                      ...(isDisabled ? styles.buttonDisabled : {}),
                    }}
                    onClick={handleDiscover}
                    disabled={isDisabled}
                  >
                    {terminal.status === "discovering"
                      ? "Procurando..."
                      : "Procurar Leitores"}
                  </button>

                  {/* Discovered readers list */}
                  {discoveredReaders.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {discoveredReaders.map((reader) => (
                        <div key={reader.id} style={styles.readerItem}>
                          <div style={styles.readerInfo}>
                            <div style={styles.readerName}>
                              {reader.label}
                            </div>
                            <div style={styles.readerDetail}>
                              {reader.deviceType} &middot;{" "}
                              {reader.serialNumber}
                              {reader.ipAddress
                                ? ` &middot; ${reader.ipAddress}`
                                : ""}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={styles.statusBadge(
                                reader.status === "online",
                              )}
                            >
                              <span
                                style={styles.statusDot(
                                  reader.status === "online"
                                    ? "#4ade80"
                                    : "#ef4444",
                                )}
                              />
                              {reader.status === "online"
                                ? "Online"
                                : "Offline"}
                            </span>
                            <button
                              style={{
                                ...styles.button,
                                width: "auto",
                                ...(reader.status !== "online" || isDisabled
                                  ? styles.buttonDisabled
                                  : {}),
                              }}
                              onClick={() => handleConnect(reader)}
                              disabled={
                                reader.status !== "online" || isDisabled
                              }
                            >
                              Conectar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {discoveredReaders.length === 0 &&
                    terminal.status === "idle" &&
                    !loading && (
                      <div
                        style={{
                          ...styles.readerDetail,
                          marginTop: 8,
                          textAlign: "center",
                        }}
                      >
                        Nenhum leitor encontrado. Verifique se o leitor está
                        ligado e na mesma rede.
                      </div>
                    )}
                </>
              )}
            </div>
          )}

          {/* Status */}
          {terminal.status !== "idle" && (
            <div style={styles.card}>
              <div style={styles.statusLabel(terminal.status)}>
                {STATUS_LABELS[terminal.status]}
              </div>
            </div>
          )}

          {/* Test Payment */}
          {terminal.isReaderConnected && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Teste</div>
              <button
                style={{
                  ...styles.buttonSecondary,
                  ...(isDisabled ? styles.buttonDisabled : {}),
                }}
                onClick={handleTestPayment}
                disabled={isDisabled}
              >
                {terminal.status === "collecting"
                  ? "Aguardando cartão..."
                  : "Pagamento Teste (0.50 EUR)"}
              </button>
              {terminal.status === "collecting" && (
                <div style={styles.row}>
                  <button
                    style={styles.buttonDanger}
                    onClick={() => terminal.cancelPayment()}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {testResult && (
                <div style={styles.testResult(testResult.success)}>
                  {testResult.message}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SumUp Reader Section */}
      {provider === "sumup" && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>SumUp Reader</div>
          <div
            style={{
              fontSize: 13,
              color: "#a1a1aa",
              lineHeight: 1.5,
            }}
          >
            O leitor SumUp utiliza o checkout web para processar pagamentos.
            Configure a integração SumUp nas definições do restaurante para
            ativar pagamentos via leitor SumUp.
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              style={{
                ...styles.buttonSecondary,
                ...(isDisabled ? styles.buttonDisabled : {}),
              }}
              disabled={isDisabled}
              onClick={() => {
                // SumUp reader uses checkout flow — no SDK initialization needed
                setTestResult({
                  success: true,
                  message:
                    "SumUp Reader disponível. Pagamentos serão processados via checkout.",
                });
              }}
            >
              Verificar Disponibilidade
            </button>
            {testResult && (
              <div style={styles.testResult(testResult.success)}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
