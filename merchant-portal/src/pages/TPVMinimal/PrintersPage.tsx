/**
 * PrintersPage — TPV-embedded printer management (rota /op/tpv/printers).
 *
 * Sections:
 * 1. Connected printers list with status, edit, delete
 * 2. Add printer wizard (type -> connection -> pair -> test -> save)
 * 3. Global print settings (paper, auto-print, copies, footer, logo)
 * 4. Test actions (test print, open cash drawer)
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui/design-system/Card";
import {
  usePrinterConfig,
  type PrinterDevice,
} from "./hooks/usePrinterConfig";

/* ── Styles ── */

const sectionTitleStyle: React.CSSProperties = {
  color: "var(--text-primary)",
  margin: "0 0 12px 0",
  fontSize: 16,
  fontWeight: 600,
};

const selectStyle: React.CSSProperties = {
  background: "var(--surface-elevated, #1a1a1a)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle, #333)",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  minWidth: 220,
  cursor: "pointer",
  outline: "none",
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-elevated, #1a1a1a)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle, #333)",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  background: "#f97316",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "transparent",
  color: "#f97316",
  border: "1px solid #f97316",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  background: "transparent",
  color: "#ef4444",
  border: "1px solid #ef4444",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const statusDotStyle = (color: string): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: color,
  display: "inline-block",
  flexShrink: 0,
});

const descriptionStyle: React.CSSProperties = {
  color: "var(--text-tertiary, #666)",
  fontSize: 12,
  marginTop: 6,
};

/* ── Toggle ── */

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? "#22c55e" : "var(--border-subtle, #333)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

/* ── Wizard types ── */

type WizardStep = "type" | "connection" | "pair" | "test" | "save";

interface WizardState {
  step: WizardStep;
  printerType: PrinterDevice["type"] | null;
  connectionMethod: PrinterDevice["connection"] | null;
  address: string;
  vendorId?: number;
  productId?: number;
  name: string;
  paperWidth: 58 | 80;
  usbPaired: boolean;
}

const INITIAL_WIZARD: WizardState = {
  step: "type",
  printerType: null,
  connectionMethod: null,
  address: "",
  name: "",
  paperWidth: 80,
  usbPaired: false,
};

const PRINTER_TYPE_LABELS: Record<PrinterDevice["type"], string> = {
  receipt: "printers.typeReceipt",
  kitchen: "printers.typeKitchen",
  bar: "printers.typeBar",
};

const CONNECTION_LABELS: Record<PrinterDevice["connection"], string> = {
  usb: "printers.connUsb",
  network: "printers.connNetwork",
  bluetooth: "printers.connBluetooth",
};

/* ── Component ── */

export function PrintersPage() {
  const { t } = useTranslation("tpv");
  const {
    printers,
    settings,
    addPrinter,
    removePrinter,
    updateSettings,
  } = usePrinterConfig();

  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  /* ── Wizard handlers ── */

  const openWizard = useCallback(() => {
    setWizard({ ...INITIAL_WIZARD });
  }, []);

  const closeWizard = useCallback(() => {
    setWizard(null);
  }, []);

  const setWizardField = useCallback(
    <K extends keyof WizardState>(field: K, value: WizardState[K]) => {
      setWizard((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [],
  );

  const handleUsbPair = useCallback(async () => {
    try {
      if (!("usb" in navigator)) {
        alert(t("printers.webUsbNotSupported"));
        return;
      }
      const device = await (navigator as any).usb.requestDevice({
        filters: [],
      });
      if (device) {
        setWizard((prev) =>
          prev
            ? {
                ...prev,
                usbPaired: true,
                vendorId: device.vendorId,
                productId: device.productId,
                name: prev.name || device.productName || "USB Printer",
                step: "test",
              }
            : prev,
        );
      }
    } catch {
      // user cancelled or error
    }
  }, [t]);

  const handleWizardNext = useCallback(() => {
    if (!wizard) return;
    const steps: WizardStep[] = ["type", "connection", "pair", "test", "save"];
    const idx = steps.indexOf(wizard.step);
    if (idx < steps.length - 1) {
      // Skip pair step for non-USB connections
      let nextStep = steps[idx + 1];
      if (nextStep === "pair" && wizard.connectionMethod !== "usb") {
        nextStep = "test";
      }
      setWizardField("step", nextStep);
    }
  }, [wizard, setWizardField]);

  const handleWizardBack = useCallback(() => {
    if (!wizard) return;
    const steps: WizardStep[] = ["type", "connection", "pair", "test", "save"];
    const idx = steps.indexOf(wizard.step);
    if (idx > 0) {
      let prevStep = steps[idx - 1];
      if (prevStep === "pair" && wizard.connectionMethod !== "usb") {
        prevStep = "connection";
      }
      setWizardField("step", prevStep);
    }
  }, [wizard, setWizardField]);

  const handleSavePrinter = useCallback(() => {
    if (!wizard || !wizard.printerType || !wizard.connectionMethod) return;
    const newPrinter: PrinterDevice = {
      id: crypto.randomUUID(),
      name: wizard.name || `${t(PRINTER_TYPE_LABELS[wizard.printerType])} ${printers.length + 1}`,
      type: wizard.printerType,
      connection: wizard.connectionMethod,
      address: wizard.connectionMethod === "network" ? wizard.address : undefined,
      vendorId: wizard.vendorId,
      productId: wizard.productId,
      paperWidth: wizard.paperWidth,
      enabled: true,
    };
    addPrinter(newPrinter);
    closeWizard();
  }, [wizard, printers.length, addPrinter, closeWizard, t]);

  const handleTestPrint = useCallback(
    (printerId: string) => {
      setTestResults((prev) => ({ ...prev, [printerId]: "printing" }));
      // Simulate test print
      setTimeout(() => {
        setTestResults((prev) => ({ ...prev, [printerId]: "success" }));
        setTimeout(() => {
          setTestResults((prev) => {
            const next = { ...prev };
            delete next[printerId];
            return next;
          });
        }, 3000);
      }, 1500);
    },
    [],
  );

  const handleOpenDrawer = useCallback(() => {
    // Simulate drawer open command
    alert(t("printers.drawerOpened"));
  }, [t]);

  /* ── Render helpers ── */

  const renderPrinterCard = (printer: PrinterDevice) => {
    const testStatus = testResults[printer.id];
    return (
      <div
        key={printer.id}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
          borderBottom: "1px solid var(--border-subtle, #27272a)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={statusDotStyle(printer.enabled ? "#22c55e" : "#ef4444")}
          />
          <div>
            <div
              style={{
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {printer.name}
            </div>
            <div
              style={{
                color: "var(--text-tertiary, #666)",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {t(PRINTER_TYPE_LABELS[printer.type])} ·{" "}
              {t(CONNECTION_LABELS[printer.connection])} ·{" "}
              {printer.paperWidth}mm
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {testStatus === "printing" && (
            <span style={{ color: "#f97316", fontSize: 12 }}>
              {t("printers.printing")}...
            </span>
          )}
          {testStatus === "success" && (
            <span style={{ color: "#22c55e", fontSize: 12 }}>
              {t("printers.testSuccess")}
            </span>
          )}
          <button
            style={btnSecondary}
            onClick={() => handleTestPrint(printer.id)}
          >
            {t("printers.testPrint")}
          </button>
          <button
            style={btnDanger}
            onClick={() => removePrinter(printer.id)}
          >
            {t("printers.delete")}
          </button>
        </div>
      </div>
    );
  };

  const renderWizard = () => {
    if (!wizard) return null;

    return (
      <Card surface="layer1" padding="md">
        <h3 style={sectionTitleStyle}>{t("printers.addPrinter")}</h3>

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {(["type", "connection", "pair", "test", "save"] as WizardStep[])
            .filter(
              (s) => s !== "pair" || wizard.connectionMethod === "usb",
            )
            .map((step) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background:
                    step === wizard.step
                      ? "#f97316"
                      : (["type", "connection", "pair", "test", "save"] as WizardStep[]).indexOf(
                            step,
                          ) <
                          (["type", "connection", "pair", "test", "save"] as WizardStep[]).indexOf(
                            wizard.step,
                          )
                        ? "#22c55e"
                        : "var(--border-subtle, #27272a)",
                }}
              />
            ))}
        </div>

        {/* Step 1: Type */}
        {wizard.step === "type" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              {t("printers.selectType")}
            </p>
            {(["receipt", "kitchen", "bar"] as PrinterDevice["type"][]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setWizardField("printerType", type);
                    setWizardField("step", "connection");
                  }}
                  style={{
                    ...btnSecondary,
                    textAlign: "left",
                    padding: "14px 16px",
                    borderColor:
                      wizard.printerType === type
                        ? "#f97316"
                        : "var(--border-subtle, #27272a)",
                    color:
                      wizard.printerType === type
                        ? "#f97316"
                        : "var(--text-primary)",
                  }}
                >
                  {t(PRINTER_TYPE_LABELS[type])}
                </button>
              ),
            )}
          </div>
        )}

        {/* Step 2: Connection */}
        {wizard.step === "connection" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              {t("printers.selectConnection")}
            </p>
            {(["usb", "network", "bluetooth"] as PrinterDevice["connection"][]).map(
              (conn) => (
                <button
                  key={conn}
                  onClick={() => {
                    setWizardField("connectionMethod", conn);
                    if (conn === "usb") {
                      setWizardField("step", "pair");
                    } else {
                      setWizardField("step", "test");
                    }
                  }}
                  style={{
                    ...btnSecondary,
                    textAlign: "left",
                    padding: "14px 16px",
                    borderColor: "var(--border-subtle, #27272a)",
                    color: "var(--text-primary)",
                  }}
                >
                  {t(CONNECTION_LABELS[conn])}
                </button>
              ),
            )}
            <button
              style={{ ...btnSecondary, marginTop: 8 }}
              onClick={handleWizardBack}
            >
              {t("printers.back")}
            </button>
          </div>
        )}

        {/* Step 3: Pair (USB only) */}
        {wizard.step === "pair" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center",
              padding: "20px 0",
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              {t("printers.usbPairInstructions")}
            </p>
            {wizard.usbPaired ? (
              <div style={{ color: "#22c55e", fontSize: 14, fontWeight: 500 }}>
                {t("printers.usbPaired")}
                {wizard.vendorId != null && (
                  <span style={{ color: "var(--text-tertiary, #666)", fontSize: 12, marginLeft: 8 }}>
                    (VID: {wizard.vendorId}, PID: {wizard.productId})
                  </span>
                )}
              </div>
            ) : (
              <button style={btnPrimary} onClick={handleUsbPair}>
                {t("printers.connectPrinter")}
              </button>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnSecondary} onClick={handleWizardBack}>
                {t("printers.back")}
              </button>
              {wizard.usbPaired && (
                <button style={btnPrimary} onClick={handleWizardNext}>
                  {t("printers.next")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Test */}
        {wizard.step === "test" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              {t("printers.testInstructions")}
            </p>

            {wizard.connectionMethod === "network" && (
              <div>
                <label
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {t("printers.ipAddress")}
                </label>
                <input
                  type="text"
                  value={wizard.address}
                  onChange={(e) => setWizardField("address", e.target.value)}
                  placeholder="192.168.1.100"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {t("printers.paperWidth")}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {([58, 80] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWizardField("paperWidth", w)}
                    style={{
                      ...btnSecondary,
                      borderColor:
                        wizard.paperWidth === w
                          ? "#f97316"
                          : "var(--border-subtle, #27272a)",
                      color: wizard.paperWidth === w ? "#f97316" : "var(--text-primary)",
                    }}
                  >
                    {w}mm
                  </button>
                ))}
              </div>
            </div>

            <button
              style={btnPrimary}
              onClick={() => {
                alert(t("printers.testSent"));
              }}
            >
              {t("printers.sendTest")}
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnSecondary} onClick={handleWizardBack}>
                {t("printers.back")}
              </button>
              <button style={btnPrimary} onClick={handleWizardNext}>
                {t("printers.next")}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Name and save */}
        {wizard.step === "save" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {t("printers.printerName")}
              </label>
              <input
                type="text"
                value={wizard.name}
                onChange={(e) => setWizardField("name", e.target.value)}
                placeholder={t("printers.printerNamePlaceholder")}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnSecondary} onClick={handleWizardBack}>
                {t("printers.back")}
              </button>
              <button style={btnPrimary} onClick={handleSavePrinter}>
                {t("printers.save")}
              </button>
            </div>
          </div>
        )}

        {/* Cancel */}
        <div style={{ marginTop: 12 }}>
          <button
            style={{
              background: "transparent",
              color: "var(--text-tertiary, #666)",
              border: "none",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
            onClick={closeWizard}
          >
            {t("printers.cancel")}
          </button>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 700 }}>
      <h1
        style={{
          color: "var(--text-primary)",
          marginBottom: 24,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {t("printers.title")}
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Section 1: Connected Printers */}
        <Card surface="layer1" padding="md">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
              {t("printers.connectedPrinters")}
            </h3>
            {!wizard && (
              <button style={btnPrimary} onClick={openWizard}>
                + {t("printers.addPrinter")}
              </button>
            )}
          </div>

          {printers.length === 0 ? (
            <p
              style={{
                color: "var(--text-tertiary, #666)",
                fontSize: 14,
                margin: 0,
              }}
            >
              {t("printers.noPrinters")}
            </p>
          ) : (
            <div>{printers.map(renderPrinterCard)}</div>
          )}
        </Card>

        {/* Section 2: Add Printer Wizard */}
        {wizard && renderWizard()}

        {/* Section 3: Print Settings */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("printers.printSettings")}</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Paper width default */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {t("printers.defaultPaperWidth")}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {([58, 80] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      // Update default for new printers in settings
                      // This is informational — each printer has its own paperWidth
                    }}
                    style={{
                      ...btnSecondary,
                      padding: "4px 12px",
                      fontSize: 13,
                    }}
                  >
                    {w}mm
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-print kitchen tickets */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {t("printers.autoPrintKitchen")}
              </span>
              <ToggleSwitch
                checked={settings.autoPrintKitchenTickets}
                onChange={(v) =>
                  updateSettings({ autoPrintKitchenTickets: v })
                }
              />
            </div>

            {/* Auto-print receipts */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {t("printers.autoPrintReceipts")}
              </span>
              <ToggleSwitch
                checked={settings.autoPrintReceipts}
                onChange={(v) => updateSettings({ autoPrintReceipts: v })}
              />
            </div>

            {/* Kitchen ticket copies */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {t("printers.kitchenCopies")}
              </span>
              <select
                value={settings.kitchenTicketCopies}
                onChange={(e) =>
                  updateSettings({
                    kitchenTicketCopies: Number(e.target.value),
                  })
                }
                style={{ ...selectStyle, minWidth: 80 }}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Receipt footer */}
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {t("printers.receiptFooter")}
              </label>
              <input
                type="text"
                value={settings.receiptFooter}
                onChange={(e) =>
                  updateSettings({ receiptFooter: e.target.value })
                }
                style={inputStyle}
              />
              <p style={descriptionStyle}>
                {t("printers.receiptFooterHint")}
              </p>
            </div>

            {/* Print logo */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {t("printers.printLogo")}
              </span>
              <ToggleSwitch
                checked={settings.printLogo}
                onChange={(v) => updateSettings({ printLogo: v })}
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Test Actions */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("printers.testSection")}</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {printers.map((printer) => (
              <button
                key={printer.id}
                style={btnSecondary}
                onClick={() => handleTestPrint(printer.id)}
              >
                {t("printers.testPrint")} — {printer.name}
              </button>
            ))}
            <button style={btnSecondary} onClick={handleOpenDrawer}>
              {t("printers.openDrawer")}
            </button>
          </div>
          {printers.length === 0 && (
            <p style={{ ...descriptionStyle, marginTop: 12 }}>
              {t("printers.addPrinterFirst")}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
