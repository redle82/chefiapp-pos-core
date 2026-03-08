/**
 * ToastContext — Global toast provider.
 *
 * Wraps the design-system `useToast` hook so any component in the tree can
 * fire notifications without prop-drilling.
 *
 * Usage:
 *   const { success, error, warning, info } = useToastContext();
 *   success("Saved!");
 *   error("Something went wrong.");
 *
 * Phase 3: P0 UX — validation & feedback hardening.
 */

import React, { createContext, useContext } from "react";
import { ToastContainer, useToast } from "../ui/design-system/Toast";

interface ToastContextValue {
  success: (message: string) => string;
  error: (message: string) => string;
  warning: (message: string) => string;
  info: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider
      value={{
        success: toast.success,
        error: toast.error,
        warning: toast.warning,
        info: toast.info,
        dismiss: toast.dismiss,
      }}
    >
      {children}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </ToastContext.Provider>
  );
}

/** Hook to access the global toast context. Throws if used outside ToastProvider. */
export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastContext must be used inside <ToastProvider>");
  }
  return ctx;
}
