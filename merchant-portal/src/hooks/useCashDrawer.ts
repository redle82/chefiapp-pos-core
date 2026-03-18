/**
 * useCashDrawer — React hook for cash drawer control via ESC/POS.
 *
 * Manages WebUSB device pairing and provides a one-click open() function.
 * Falls back gracefully when WebUSB is unavailable (e.g., Firefox, HTTP).
 *
 * Usage:
 *   const { isAvailable, open, lastOpened, error } = useCashDrawer();
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CashDrawerDriver } from "../core/printing/CashDrawerDriver";

/** Epson TM-series USB vendor ID (most common receipt printers) */
const RECEIPT_PRINTER_FILTERS: USBDeviceFilter[] = [
  { vendorId: 0x04b8 }, // Epson
  { vendorId: 0x0519 }, // Star Micronics
  { vendorId: 0x0dd4 }, // Custom (Italian brand)
  { vendorId: 0x2730 }, // Citizen
];

export interface UseCashDrawerReturn {
  /** Whether a USB printer is paired and WebUSB is supported */
  isAvailable: boolean;
  /** Open the cash drawer. Resolves on success, sets error on failure. */
  open: () => Promise<void>;
  /** Timestamp of the last successful drawer open */
  lastOpened: Date | null;
  /** Last error message, cleared on next successful open */
  error: string | null;
}

export function useCashDrawer(): UseCashDrawerReturn {
  const [device, setDevice] = useState<USBDevice | null>(null);
  const [lastOpened, setLastOpened] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const webUSBSupported =
    typeof navigator !== "undefined" && "usb" in navigator;

  // On mount, check for already-paired devices
  useEffect(() => {
    mountedRef.current = true;

    if (!webUSBSupported) return;

    navigator.usb
      .getDevices()
      .then((devices) => {
        if (!mountedRef.current) return;
        // Use the first paired receipt printer
        const printer = devices[0] ?? null;
        setDevice(printer);
      })
      .catch(() => {
        // WebUSB not available in this context (e.g., iframe, insecure origin)
      });

    // Listen for connect/disconnect events
    const onConnect = (e: USBConnectionEvent) => {
      if (mountedRef.current) setDevice(e.device);
    };
    const onDisconnect = (e: USBConnectionEvent) => {
      if (mountedRef.current && e.device === device) {
        setDevice(null);
      }
    };

    navigator.usb.addEventListener("connect", onConnect);
    navigator.usb.addEventListener("disconnect", onDisconnect);

    return () => {
      mountedRef.current = false;
      navigator.usb.removeEventListener("connect", onConnect);
      navigator.usb.removeEventListener("disconnect", onDisconnect);
    };
  }, [webUSBSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback(async () => {
    setError(null);

    try {
      let target = device;

      // If no device paired yet, prompt user to select one
      if (!target && webUSBSupported) {
        target = await navigator.usb.requestDevice({
          filters: RECEIPT_PRINTER_FILTERS,
        });
        if (mountedRef.current) setDevice(target);
      }

      if (!target) {
        throw new Error(
          "Nenhuma impressora USB encontrada. Conecte a impressora e tente novamente.",
        );
      }

      await CashDrawerDriver.openViaUSB(target);

      if (mountedRef.current) {
        setLastOpened(new Date());
        setError(null);
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotFoundError"
          ? "Seleção de impressora cancelada."
          : err instanceof Error
            ? err.message
            : "Erro desconhecido ao abrir gaveta.";

      if (mountedRef.current) {
        setError(message);
      }

      throw err;
    }
  }, [device, webUSBSupported]);

  const isAvailable = webUSBSupported && device !== null;

  return { isAvailable, open, lastOpened, error };
}
