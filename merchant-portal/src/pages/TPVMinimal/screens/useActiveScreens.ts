/**
 * useActiveScreens — manages opened screen window instances.
 *
 * Tracks Window references, detects when external windows are closed,
 * and provides open/close/copyLink actions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isDesktopApp } from "../../../core/operational/platformDetection";
import type { ScreenTypeId } from "./screenTypes";
import { SCREEN_REGISTRY } from "./screenTypes";

export interface ActiveScreen {
  instanceId: string;
  typeId: ScreenTypeId;
  label: string;
  url: string;
  openedAt: Date;
  state: "open" | "closed";
}

interface WindowEntry {
  instanceId: string;
  windowRef: Window | null;
}

let nextId = 1;

export function useActiveScreens() {
  const [screens, setScreens] = useState<ActiveScreen[]>([]);
  const windowRefs = useRef<WindowEntry[]>([]);
  const navigate = useNavigate();
  const desktop = useMemo(() => isDesktopApp(), []);

  // Periodically check if external windows have been closed
  useEffect(() => {
    const interval = setInterval(() => {
      let changed = false;
      for (const entry of windowRefs.current) {
        if (entry.windowRef && entry.windowRef.closed) {
          changed = true;
        }
      }
      if (changed) {
        setScreens((prev) =>
          prev.map((s) => {
            const entry = windowRefs.current.find(
              (e) => e.instanceId === s.instanceId,
            );
            if (entry?.windowRef?.closed && s.state === "open") {
              return { ...s, state: "closed" as const };
            }
            return s;
          }),
        );
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /** Generate a default label with auto-increment if duplicates exist */
  const generateDefaultLabel = useCallback(
    (typeId: ScreenTypeId, baseLabel: string): string => {
      const existing = screens.filter((s) => s.typeId === typeId);
      if (existing.length === 0) return `${baseLabel} — Principal`;
      return `${baseLabel} — ${existing.length + 1}`;
    },
    [screens],
  );

  const openScreen = useCallback(
    (typeId: ScreenTypeId, customLabel?: string) => {
      const def = SCREEN_REGISTRY.find((d) => d.id === typeId);
      if (!def?.url || !def.available) return;

      // Navigate mode — go to the route within the app
      if (def.openMode === "navigate") {
        navigate(def.url);
        return;
      }

      const label = customLabel || generateDefaultLabel(typeId, def.label);

      // New window mode
      const fullUrl = `${window.location.origin}${def.url}`;
      const id = `screen-${nextId++}`;

      const win = window.open(fullUrl, `_blank_${id}`);
      windowRefs.current.push({ instanceId: id, windowRef: win });

      setScreens((prev) => [
        ...prev,
        {
          instanceId: id,
          typeId,
          label,
          url: def.url,
          openedAt: new Date(),
          state: "open",
        },
      ]);
    },
    [desktop, navigate, generateDefaultLabel],
  );

  const focusScreen = useCallback((instanceId: string) => {
    const entry = windowRefs.current.find((e) => e.instanceId === instanceId);
    if (entry?.windowRef && !entry.windowRef.closed) {
      entry.windowRef.focus();
    }
  }, []);

  const closeScreen = useCallback((instanceId: string) => {
    const entry = windowRefs.current.find((e) => e.instanceId === instanceId);
    if (entry?.windowRef && !entry.windowRef.closed) {
      entry.windowRef.close();
    }
    setScreens((prev) =>
      prev.map((s) =>
        s.instanceId === instanceId ? { ...s, state: "closed" as const } : s,
      ),
    );
  }, []);

  const removeScreen = useCallback((instanceId: string) => {
    const entry = windowRefs.current.find((e) => e.instanceId === instanceId);
    if (entry?.windowRef && !entry.windowRef.closed) {
      entry.windowRef.close();
    }
    windowRefs.current = windowRefs.current.filter(
      (e) => e.instanceId !== instanceId,
    );
    setScreens((prev) => prev.filter((s) => s.instanceId !== instanceId));
  }, []);

  const copyLink = useCallback(
    async (instanceId: string) => {
      const screen = screens.find((s) => s.instanceId === instanceId);
      if (!screen) return;
      const fullUrl = `${window.location.origin}${screen.url}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
      } catch {
        // Fallback — noop in non-secure contexts
      }
    },
    [screens],
  );

  return { screens, openScreen, focusScreen, closeScreen, removeScreen, copyLink };
}
