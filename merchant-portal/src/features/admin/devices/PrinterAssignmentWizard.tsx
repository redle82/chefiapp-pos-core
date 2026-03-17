import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

const PRINT_FUNCTION_KEYS: PrintFunction[] = ["labels", "kitchen", "receipt"];

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
  const { t } = useTranslation("config");
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

      for (const fn of PRINT_FUNCTION_KEYS) {
        const best = (assignmentsResult.data ?? []).find(
          (item) => item.print_function === fn,
        );
        if (best) {
          nextConfigs[fn].target = best.target;
          nextConfigs[fn].scope = best.station_id ? "station" : "global";
        } else {
          const defaultPrinter = availablePrinters.find(
            (p) => p.isDefault,
          )?.name;
          if (defaultPrinter) nextConfigs[fn].target = defaultPrinter;
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
      setFeedback(printFunction, t("printer.selectBeforeSave"));
      return;
    }

    if (cfg.scope === "station" && !stationId) {
      setFeedback(
        printFunction,
        t("printer.noStationForOverride"),
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
          ? `${t("printer.errorSaving")}: ${result.error.message}`
          : t("printer.savedSuccess"),
      },
    }));
  };

  const testPrint = async (printFunction: PrintFunction) => {
    if (!restaurantId) return;
    const cfg = configs[printFunction];
    if (!cfg.target) {
      setFeedback(printFunction, t("printer.selectBeforeTest"));
      return;
    }

    setConfigs((prev) => ({
      ...prev,
      [printFunction]: {
        ...prev[printFunction],
        testing: true,
        feedback: t("printer.sendingTest"),
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
          feedback: `${t("printer.errorCreatingTest")}: ${
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
            ? t("printer.testSentConfirmed")
            : status === "failed"
            ? t("printer.testFailed")
            : t("printer.testSentPending"),
      },
    }));
  };

  if (!isDesktopRuntime) {
    return (
      <GlobalBlockedView
        title={t("printer.requiresDesktop")}
        description={t("printer.requiresDesktopDesc")}
        action={{ label: t("printer.goToDevices"), to: "/admin/devices" }}
        style={{ minHeight: 420, borderRadius: 12 }}
      />
    );
  }

  if (!restaurantId) {
    return (
      <GlobalBlockedView
        title={t("printer.notReady")}
        description={t("printer.notReadyDesc")}
        action={{ label: t("printer.goToDashboard"), to: "/dashboard" }}
        style={{ minHeight: 420, borderRadius: 12 }}
      />
    );
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>{t("printer.title")}</h2>
      <p className={styles.sectionDesc}>
        {t("printer.description")}
      </p>

      {loading ? (
        <div className={styles.loadingState}>{t("printer.loading")}</div>
      ) : (
        <>
          {coreError && (
            <div className={styles.tokenError}>{t("printer.warning")}: {coreError}</div>
          )}
          {printers.length === 0 ? (
            <div className={styles.emptyState}>
              {t("printer.noPrintersFound")}
            </div>
          ) : (
            <div className={styles.wizardGrid}>
              {PRINT_FUNCTION_KEYS.map((fnKey) => {
                const cfg = configs[fnKey];
                return (
                  <div key={fnKey} className={styles.wizardCard}>
                    <h3 className={styles.wizardTitle}>{t(`printer.fn.${fnKey}`)}</h3>

                    <label className={styles.fieldLabel}>
                      {t("printer.printerLabel")}
                      <select
                        className={styles.selectInput}
                        value={cfg.target}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConfigs((prev) => ({
                            ...prev,
                            [fnKey]: {
                              ...prev[fnKey],
                              target: value,
                              feedback: null,
                            },
                          }));
                        }}
                      >
                        <option value="">{t("printer.selectPlaceholder")}</option>
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
                            [fnKey]: {
                              ...prev[fnKey],
                              scope: checked ? "global" : "station",
                              feedback: null,
                            },
                          }));
                        }}
                      />
                      {t("printer.useAsGlobal")}
                    </label>

                    <div className={styles.wizardActions}>
                      <button
                        type="button"
                        className={styles.btnGenerate}
                        disabled={cfg.testing || cfg.saving || !cfg.target}
                        onClick={() => {
                          void testPrint(fnKey);
                        }}
                      >
                        {cfg.testing ? t("printer.testing") : t("printer.printTest")}
                      </button>
                      <button
                        type="button"
                        className={styles.btnGenerate}
                        disabled={cfg.testing || cfg.saving || !cfg.target}
                        onClick={() => {
                          void saveAssignment(fnKey);
                        }}
                      >
                        {cfg.saving ? t("printer.saving") : t("printer.save")}
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
