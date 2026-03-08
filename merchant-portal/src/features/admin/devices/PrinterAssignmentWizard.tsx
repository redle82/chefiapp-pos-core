import { useEffect, useMemo, useState } from "react";
import { isElectron } from "../../../core/operational/platformDetection";
import {
  getPrintJobStatus,
  requestPrint,
  type PrintJobType,
} from "../../../core/print/CorePrintApi";
import { getDesktopPrinters } from "../../../core/print/DesktopPrintAgentApi";
import {
  listPrinterAssignments,
  upsertPrinterAssignment,
  type PrintFunction,
} from "../../../core/print/PrinterAssignmentsApi";
import { GlobalBlockedView } from "../../../ui/design-system/components/GlobalBlockedView";
import styles from "./AdminDevicesPage.module.css";

const PRINT_FUNCTIONS: Array<{ key: PrintFunction; label: string }> = [
  { key: "labels", label: "Etiquetas" },
  { key: "kitchen", label: "Cozinha" },
  { key: "receipt", label: "Recibo" },
];

type FunctionConfig = {
  target: string;
  scope: "global" | "station";
  saving: boolean;
  testing: boolean;
  feedback: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function testTypeForPrintFunction(printFunction: PrintFunction): PrintJobType {
  if (printFunction === "kitchen") return "kitchen_ticket";
  if (printFunction === "receipt") return "receipt";
  return "label";
}

function testPayloadForPrintFunction(
  printFunction: PrintFunction,
  target: string,
) {
  const now = new Date().toISOString();
  return {
    print_function: printFunction,
    text: `[TEST] ${printFunction.toUpperCase()} @ ${now}\nTarget: ${target}`,
    html: `<html><body><h3>TEST ${printFunction.toUpperCase()}</h3><p>${now}</p><p>${target}</p></body></html>`,
  };
}

export function PrinterAssignmentWizard({
  restaurantId,
}: {
  restaurantId: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [coreError, setCoreError] = useState<string | null>(null);
  const [printers, setPrinters] = useState<
    Array<{ name: string; isDefault: boolean }>
  >([]);
  const [stationId, setStationId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<PrintFunction, FunctionConfig>>(
    {
      labels: {
        target: "",
        scope: "global",
        saving: false,
        testing: false,
        feedback: null,
      },
      kitchen: {
        target: "",
        scope: "global",
        saving: false,
        testing: false,
        feedback: null,
      },
      receipt: {
        target: "",
        scope: "global",
        saving: false,
        testing: false,
        feedback: null,
      },
    },
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setCoreError(null);

      const [printersResult, assignmentsResult] = await Promise.all([
        getDesktopPrinters(),
        listPrinterAssignments({ restaurantId }),
      ]);

      if (cancelled) return;

      if (window.electronBridge?.getTerminalConfig) {
        try {
          const terminal = await window.electronBridge.getTerminalConfig();
          if (!cancelled) setStationId(terminal?.terminalId ?? null);
        } catch {
          if (!cancelled) setStationId(null);
        }
      }

      if (printersResult.error) {
        setCoreError(printersResult.error.message);
      }

      const availablePrinters = (printersResult.data ?? []).map((item) => ({
        name: item.name,
        isDefault: item.isDefault,
      }));
      setPrinters(availablePrinters);

      if (assignmentsResult.error) {
        setCoreError(assignmentsResult.error.message);
      }

      const nextConfigs: Record<PrintFunction, FunctionConfig> = {
        labels: {
          target: "",
          scope: "global",
          saving: false,
          testing: false,
          feedback: null,
        },
        kitchen: {
          target: "",
          scope: "global",
          saving: false,
          testing: false,
          feedback: null,
        },
        receipt: {
          target: "",
          scope: "global",
          saving: false,
          testing: false,
          feedback: null,
        },
      };

      for (const fn of PRINT_FUNCTIONS) {
        const best = (assignmentsResult.data ?? []).find(
          (item) => item.print_function === fn.key,
        );
        if (best) {
          nextConfigs[fn.key].target = best.target;
          nextConfigs[fn.key].scope = best.station_id ? "station" : "global";
        } else {
          const defaultPrinter = availablePrinters.find(
            (p) => p.isDefault,
          )?.name;
          if (defaultPrinter) nextConfigs[fn.key].target = defaultPrinter;
        }
      }

      setConfigs(nextConfigs);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const isDesktopRuntime = useMemo(() => isElectron(), []);

  const setFeedback = (
    printFunction: PrintFunction,
    feedback: string | null,
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [printFunction]: {
        ...prev[printFunction],
        feedback,
      },
    }));
  };

  const saveAssignment = async (printFunction: PrintFunction) => {
    if (!restaurantId) return;
    const cfg = configs[printFunction];
    if (!cfg.target) {
      setFeedback(printFunction, "Selecione uma impressora antes de guardar.");
      return;
    }

    if (cfg.scope === "station" && !stationId) {
      setFeedback(
        printFunction,
        "Sem estação pareada para salvar override local.",
      );
      return;
    }

    setConfigs((prev) => ({
      ...prev,
      [printFunction]: { ...prev[printFunction], saving: true, feedback: null },
    }));

    const result = await upsertPrinterAssignment({
      restaurantId,
      stationId: cfg.scope === "station" ? stationId : null,
      printFunction,
      transport: "spooler",
      target: cfg.target,
      displayName: `${printFunction.toUpperCase()} · ${cfg.target}`,
      isEnabled: true,
      metadata: { source: "wizard", updated_at: new Date().toISOString() },
    });

    setConfigs((prev) => ({
      ...prev,
      [printFunction]: {
        ...prev[printFunction],
        saving: false,
        feedback: result.error
          ? `Erro ao guardar: ${result.error.message}`
          : "Guardado com sucesso.",
      },
    }));
  };

  const testPrint = async (printFunction: PrintFunction) => {
    if (!restaurantId) return;
    const cfg = configs[printFunction];
    if (!cfg.target) {
      setFeedback(printFunction, "Selecione uma impressora antes de testar.");
      return;
    }

    setConfigs((prev) => ({
      ...prev,
      [printFunction]: {
        ...prev[printFunction],
        testing: true,
        feedback: "A enviar teste...",
      },
    }));

    const requested = await requestPrint({
      restaurantId,
      type: testTypeForPrintFunction(printFunction),
      payload: testPayloadForPrintFunction(printFunction, cfg.target),
    });

    if (requested.error || !requested.data?.job_id) {
      setConfigs((prev) => ({
        ...prev,
        [printFunction]: {
          ...prev[printFunction],
          testing: false,
          feedback: `Erro ao criar teste: ${
            requested.error?.message ?? "request_print failed"
          }`,
        },
      }));
      return;
    }

    const jobId = requested.data.job_id;

    let status: string | null = null;
    for (let i = 0; i < 7; i += 1) {
      await sleep(1000);
      const state = await getPrintJobStatus(jobId);
      status = state.data?.status ?? null;
      if (status === "sent" || status === "failed") {
        break;
      }
    }

    setConfigs((prev) => ({
      ...prev,
      [printFunction]: {
        ...prev[printFunction],
        testing: false,
        feedback:
          status === "sent"
            ? "Teste enviado e confirmado (sent)."
            : status === "failed"
            ? "Teste falhou (failed). Verifique target/driver."
            : "Teste enviado. A confirmação pode demorar alguns segundos.",
      },
    }));
  };

  if (!isDesktopRuntime) {
    return (
      <GlobalBlockedView
        title="Configuração de impressoras requer o app desktop"
        description="Abra esta área no ChefIApp Desktop para listar impressoras do spooler e mapear funções de impressão."
        action={{ label: "Ir para Dispositivos", to: "/admin/devices" }}
        style={{ minHeight: 420, borderRadius: 12 }}
      />
    );
  }

  if (!restaurantId) {
    return (
      <GlobalBlockedView
        title="Impressão não está pronta"
        description="Não foi possível identificar o restaurante atual para salvar assignments de impressão."
        action={{ label: "Ir para Dashboard", to: "/dashboard" }}
        style={{ minHeight: 420, borderRadius: 12 }}
      />
    );
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Impressoras por função</h2>
      <p className={styles.sectionDesc}>
        Defina qual impressora atende cada função operacional. O utilizador
        final não escolhe IP/porta, só a função.
      </p>

      {loading ? (
        <div className={styles.loadingState}>A carregar impressoras...</div>
      ) : (
        <>
          {coreError && (
            <div className={styles.tokenError}>Aviso: {coreError}</div>
          )}
          {printers.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhuma impressora do spooler encontrada. Instale/ative a
              impressora no sistema e recarregue esta página.
            </div>
          ) : (
            <div className={styles.wizardGrid}>
              {PRINT_FUNCTIONS.map((fn) => {
                const cfg = configs[fn.key];
                return (
                  <div key={fn.key} className={styles.wizardCard}>
                    <h3 className={styles.wizardTitle}>{fn.label}</h3>

                    <label className={styles.fieldLabel}>
                      Impressora
                      <select
                        className={styles.selectInput}
                        value={cfg.target}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConfigs((prev) => ({
                            ...prev,
                            [fn.key]: {
                              ...prev[fn.key],
                              target: value,
                              feedback: null,
                            },
                          }));
                        }}
                      >
                        <option value="">Selecione...</option>
                        {printers.map((printer) => (
                          <option key={printer.name} value={printer.name}>
                            {printer.name}
                            {printer.isDefault ? " (default)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.wizardCheckbox}>
                      <input
                        type="checkbox"
                        checked={cfg.scope === "global"}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setConfigs((prev) => ({
                            ...prev,
                            [fn.key]: {
                              ...prev[fn.key],
                              scope: checked ? "global" : "station",
                              feedback: null,
                            },
                          }));
                        }}
                      />
                      Usar como padrão global
                    </label>

                    <div className={styles.wizardActions}>
                      <button
                        type="button"
                        className={styles.btnGenerate}
                        disabled={cfg.testing || cfg.saving || !cfg.target}
                        onClick={() => {
                          void testPrint(fn.key);
                        }}
                      >
                        {cfg.testing ? "A testar..." : "Imprimir teste"}
                      </button>
                      <button
                        type="button"
                        className={styles.btnGenerate}
                        disabled={cfg.testing || cfg.saving || !cfg.target}
                        onClick={() => {
                          void saveAssignment(fn.key);
                        }}
                      >
                        {cfg.saving ? "A guardar..." : "Guardar"}
                      </button>
                    </div>

                    {cfg.feedback && (
                      <p className={styles.wizardFeedback}>{cfg.feedback}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
