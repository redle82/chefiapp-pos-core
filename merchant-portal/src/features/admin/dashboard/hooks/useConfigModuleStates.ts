/**
 * useConfigModuleStates — Derives module status for each config sidebar item.
 *
 * Maps config paths to MODULES_DEFINITIONS and derives status from
 * RestaurantRuntimeContext (installed_modules, active_modules).
 *
 * Phase 4: Module States — Admin Panel Restructuring.
 */

import { useMemo } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { deriveModuleStatus } from "../../modules/data/modulesDefinitions";
import type { ModuleStatus } from "../../modules/types";

/**
 * Maps config item `path` → module ID from MODULES_DEFINITIONS.
 * Only config items that correspond to a specific module are listed.
 */
const CONFIG_PATH_TO_MODULE: Record<string, string> = {
  website: "tienda-online",
  reservations: "reservas",
  "pos-software": "tpv",
  delivery: "delivery-integrator",
};

export type ConfigModuleState = {
  status: ModuleStatus;
  /** i18n-ready key for the status label */
  statusKey: string;
};

const STATUS_KEY_MAP: Record<ModuleStatus, string> = {
  active: "moduleStatus.active",
  inactive: "moduleStatus.inactive",
  needs_setup: "moduleStatus.needsSetup",
  locked: "moduleStatus.locked",
};

/**
 * Returns a map of config path → ConfigModuleState for items linked to modules.
 * Items not linked to a module are not in the map (return undefined).
 */
export function useConfigModuleStates(): Record<string, ConfigModuleState> {
  const { runtime } = useRestaurantRuntime();
  const { installed_modules, active_modules } = runtime;

  return useMemo(() => {
    const states: Record<string, ConfigModuleState> = {};

    for (const [configPath, moduleId] of Object.entries(
      CONFIG_PATH_TO_MODULE,
    )) {
      const status = deriveModuleStatus(
        moduleId,
        installed_modules,
        active_modules,
      );
      states[configPath] = {
        status,
        statusKey: STATUS_KEY_MAP[status],
      };
    }

    return states;
  }, [installed_modules, active_modules]);
}
