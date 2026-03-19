/**
 * usePrinterConfig — Hook for managing TPV printer configuration.
 *
 * Persists printer devices and print settings to localStorage under
 * the key `chefiapp_printer_config`. Provides CRUD operations for
 * printers and partial updates for global print settings.
 */

import { useCallback, useMemo, useState } from "react";

/* ── Data model ── */

export interface PrinterDevice {
  id: string;
  name: string;
  type: "receipt" | "kitchen" | "bar";
  connection: "usb" | "network" | "bluetooth";
  address?: string;
  vendorId?: number;
  productId?: number;
  paperWidth: 58 | 80;
  enabled: boolean;
}

export interface PrintSettings {
  autoPrintKitchenTickets: boolean;
  autoPrintReceipts: boolean;
  kitchenTicketCopies: number;
  receiptFooter: string;
  printLogo: boolean;
}

export interface PrinterConfig {
  printers: PrinterDevice[];
  settings: PrintSettings;
}

/* ── Constants ── */

const STORAGE_KEY = "chefiapp_printer_config";

const DEFAULT_SETTINGS: PrintSettings = {
  autoPrintKitchenTickets: true,
  autoPrintReceipts: true,
  kitchenTicketCopies: 1,
  receiptFooter: "Obrigado pela preferencia!",
  printLogo: false,
};

const DEFAULT_CONFIG: PrinterConfig = {
  printers: [],
  settings: DEFAULT_SETTINGS,
};

/* ── Helpers ── */

function readConfig(): PrinterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PrinterConfig;
      return {
        printers: Array.isArray(parsed.printers) ? parsed.printers : [],
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
  } catch {
    // corrupted data — reset
  }
  return DEFAULT_CONFIG;
}

function writeConfig(config: PrinterConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/* ── Hook ── */

export function usePrinterConfig() {
  const [config, setConfig] = useState<PrinterConfig>(readConfig);

  const persist = useCallback((next: PrinterConfig) => {
    setConfig(next);
    writeConfig(next);
  }, []);

  const addPrinter = useCallback(
    (printer: PrinterDevice) => {
      persist({
        ...config,
        printers: [...config.printers, printer],
      });
    },
    [config, persist],
  );

  const removePrinter = useCallback(
    (id: string) => {
      persist({
        ...config,
        printers: config.printers.filter((p) => p.id !== id),
      });
    },
    [config, persist],
  );

  const updatePrinter = useCallback(
    (id: string, updates: Partial<PrinterDevice>) => {
      persist({
        ...config,
        printers: config.printers.map((p) =>
          p.id === id ? { ...p, ...updates } : p,
        ),
      });
    },
    [config, persist],
  );

  const updateSettings = useCallback(
    (updates: Partial<PrintSettings>) => {
      persist({
        ...config,
        settings: { ...config.settings, ...updates },
      });
    },
    [config, persist],
  );

  const printers = useMemo(() => config.printers, [config.printers]);
  const settings = useMemo(() => config.settings, [config.settings]);

  return {
    config,
    printers,
    settings,
    addPrinter,
    removePrinter,
    updatePrinter,
    updateSettings,
  } as const;
}
