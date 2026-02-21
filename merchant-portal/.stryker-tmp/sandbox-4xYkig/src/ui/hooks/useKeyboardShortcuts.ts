/**
 * useKeyboardShortcuts — Regista atalhos de teclado (mod+n, esc, etc.).
 */

import React, { useEffect } from "react";

function parseKey(key: string): { key: string; mod: boolean } {
  const lower = key.toLowerCase();
  if (lower.startsWith("mod+")) {
    return { key: lower.slice(4), mod: true };
  }
  if (lower === "esc") return { key: "Escape", mod: false };
  return { key: lower.length === 1 ? lower.toUpperCase() : lower, mod: false };
}

export function useKeyboardShortcuts(
  bindings: Record<string, (e: KeyboardEvent) => void>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const [pattern, callback] of Object.entries(bindings)) {
        const { key, mod } = parseKey(pattern);
        const keyMatch =
          e.key === key ||
          e.code === key ||
          (key.length === 1 && e.key.toLowerCase() === key.toLowerCase());
        const modMatch = mod
          ? e.metaKey || e.ctrlKey
          : !e.metaKey && !e.ctrlKey;
        if (keyMatch && modMatch) {
          callback(e);
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, deps);
}
