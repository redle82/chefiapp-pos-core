/**
 * useOperationalReadiness(surface) — Motor do ORE
 *
 * Uma única fonte de verdade para "este restaurante pode operar nesta superfície?"
 * Consolida Runtime, Shift, MenuState, módulos; devolve OperationalReadiness.
 * TPV/KDS bloqueiam quando MenuState !== LIVE (MENU_OPERATIONAL_STATE).
 *
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 * @see docs/architecture/MENU_OPERATIONAL_STATE.md
 */

import { useContext, useMemo } from "react";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import { deriveRestaurantReadiness } from "../restaurant/deriveRestaurantReadiness";
import { runtimeToRestaurant } from "../restaurant/runtimeToRestaurant";
import { isBeforeOpenRitualComplete } from "../ritual/ritualBeforeOpenStorage";
import { ShiftContext } from "../shift/ShiftContext";
import {
  getKdsRestaurantId,
  getTpvRestaurantId,
} from "../storage/installedDeviceStorage";
import { getModulesEnabled } from "../storage/modulesConfigStorage";
import type {
  BlockingReason,
  OperationalReadiness,
  Surface,
  UiDirective,
} from "./types";

const DASHBOARD = "/app/dashboard";
const CONFIG_MODULES = "/admin/modules";

export interface UseOperationalReadinessResult extends OperationalReadiness {
  /** true enquanto runtime ou dependências ainda estão a carregar (mostrar loading). */
  loading?: boolean;
}

export function uiDirectiveFor(
  surface: Surface,
  reason: BlockingReason,
): UiDirective {
  if (surface === "DASHBOARD") {
    if (reason === "NO_OPEN_CASH_REGISTER" || reason === "SHIFT_NOT_STARTED")
      return "SHOW_INFO_ONLY";
    if (reason === "NOT_PUBLISHED" || reason === "CORE_OFFLINE")
      return "RENDER_APP";
  }
  if (surface === "TPV" || surface === "KDS") {
    if (
      reason === "BOOTSTRAP_INCOMPLETE" ||
      reason === "PERMISSION_DENIED" ||
      reason === "MODE_NOT_ALLOWED" ||
      reason === "RESTAURANT_NOT_FOUND"
    )
      return "REDIRECT";
    return "SHOW_BLOCKING_SCREEN";
  }
  if (surface === "WEB") {
    if (reason === "RESTAURANT_NOT_FOUND") return "REDIRECT";
    return "SHOW_BLOCKING_SCREEN";
  }
  return "SHOW_BLOCKING_SCREEN";
}

const APPSTAFF_GERENTE = "/garcom";

export function redirectFor(
  surface: Surface,
  reason: BlockingReason,
): string | undefined {
  if (reason === "BOOTSTRAP_INCOMPLETE") return DASHBOARD;
  if (reason === "MANDATORY_RITUAL_INCOMPLETE") return APPSTAFF_GERENTE;
  if (reason === "MODULE_NOT_ENABLED") return CONFIG_MODULES;
  if (
    reason === "RESTAURANT_NOT_FOUND" &&
    (surface === "TPV" || surface === "KDS")
  )
    return "/admin/modules";
  if (reason === "RESTAURANT_NOT_FOUND") return "/";
  return undefined;
}

export function useOperationalReadiness(
  surface: Surface,
): UseOperationalReadinessResult {
  const { runtime } = useRestaurantRuntime();
  const shift = useContext(ShiftContext);
  const bootstrap = useBootstrapState();

  return useMemo((): UseOperationalReadinessResult => {
    // Vertical slice brutal: ignora Turno, ORE, MenuState. TPV/KDS/Dashboard leem/escrevem direto no Core.
    if (CONFIG.DEBUG_DIRECT_FLOW) {
      return {
        ready: true,
        surface,
        uiDirective: "RENDER_APP",
        loading: false,
      };
    }

    // Dispositivo instalado (TPV/KDS): identidade fixa; não depender de runtime/exploração/publicação.
    const installedTpvRestaurantId =
      surface === "TPV" ? getTpvRestaurantId() : null;
    const installedKdsRestaurantId =
      surface === "KDS" ? getKdsRestaurantId() : null;
    const hasInstalledDevice =
      !!installedTpvRestaurantId || !!installedKdsRestaurantId;
    const effectiveRestaurantId =
      installedTpvRestaurantId ??
      installedKdsRestaurantId ??
      runtime.restaurant_id;

    const loading = hasInstalledDevice ? false : runtime.loading;

    if (loading) {
      return {
        ready: false,
        surface,
        uiDirective: "RENDER_APP",
        loading: true,
      };
    }

    const modules = getModulesEnabled(effectiveRestaurantId ?? null);

    // Derivação canónica de readiness de configuração + operação.
    const restaurant = runtimeToRestaurant({
      runtime,
      ownerUserId: "runtime-owner-unavailable",
      ownerPhone: "runtime-owner-phone-unavailable",
    });
    const restaurantReadiness = deriveRestaurantReadiness(restaurant);

    // Ordem de avaliação (primeiro bloqueio ganha)
    let reason: BlockingReason | undefined;

    if (!effectiveRestaurantId && (surface === "TPV" || surface === "KDS")) {
      reason = "RESTAURANT_NOT_FOUND";
    } else if (runtime.coreMode === "offline-erro") {
      reason = "CORE_OFFLINE";
    } else if (
      !hasInstalledDevice &&
      (surface === "TPV" || surface === "KDS") &&
      (runtime.systemState === "SETUP" ||
        bootstrap.operationMode === "exploracao")
    ) {
      reason = "BOOTSTRAP_INCOMPLETE";
    } else if (
      !hasInstalledDevice &&
      (surface === "TPV" || surface === "KDS") &&
      restaurantReadiness.configStatus === "INCOMPLETE"
    ) {
      // Configuração incompleta segundo o schema canónico (identity/local/menu/publication).
      reason = "BOOTSTRAP_INCOMPLETE";
    } else if (
      (surface === "TPV" || surface === "KDS" || surface === "DASHBOARD") &&
      bootstrap.operationMode === "operacao-real" &&
      effectiveRestaurantId &&
      !isBeforeOpenRitualComplete(effectiveRestaurantId, shift?.isShiftOpen)
    ) {
      reason = "MANDATORY_RITUAL_INCOMPLETE";
    } else if (
      (surface === "TPV" || surface === "KDS") &&
      bootstrap.operationMode === "operacao-real" &&
      shift &&
      !shift.isShiftOpen
    ) {
      // Lei do Turno: não bloquear por turno enquanto o primeiro refresh está a correr (evita "turno fechado" em cache ao navegar para KDS)
      if (shift.isChecking) {
        return {
          ready: false,
          surface,
          uiDirective: "RENDER_APP",
          loading: true,
        };
      }
      reason = "NO_OPEN_CASH_REGISTER";
    } else if (surface === "TPV" && !modules.tpv) {
      reason = "MODULE_NOT_ENABLED";
    } else if (surface === "KDS" && !modules.kds) {
      reason = "MODULE_NOT_ENABLED";
    } else if (
      surface === "DASHBOARD" &&
      bootstrap.operationMode === "operacao-real" &&
      shift &&
      !shift.isShiftOpen
    ) {
      if (shift.isChecking) {
        return {
          ready: false,
          surface,
          uiDirective: "RENDER_APP",
          loading: true,
        };
      }
      reason = "NO_OPEN_CASH_REGISTER";
    }

    if (reason) {
      const uiDirective = uiDirectiveFor(surface, reason);
      const redirectTo = redirectFor(surface, reason);
      return {
        ready: false,
        blockingReason: reason,
        surface,
        uiDirective,
        redirectTo,
      };
    }

    return {
      ready: true,
      surface,
      uiDirective: "RENDER_APP",
    };
  }, [
    surface,
    runtime.loading,
    runtime.coreMode,
    runtime.systemState,
    runtime.restaurant_id,
    bootstrap.operationMode,
    shift?.isShiftOpen,
    shift?.isChecking,
    // modules depend on restaurantId, inlined via getModulesEnabled(restaurantId)
  ]);
}
