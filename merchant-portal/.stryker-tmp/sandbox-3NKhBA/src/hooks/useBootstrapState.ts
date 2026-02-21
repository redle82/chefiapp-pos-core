/**
 * useBootstrapState — Estado canónico do contrato RESTAURANT_BOOTSTRAP_CONTRACT
 *
 * Um único hook que expõe o Bootstrap State para todas as telas.
 * Nenhuma tela infere estado; todas consomem este hook.
 *
 * @see docs/bootstrap/RESTAURANT_BOOTSTRAP_CONTRACT.md
 */
// @ts-nocheck


import { useContext, useMemo } from "react";
import { useRestaurantRuntime } from "../context/RestaurantRuntimeContext";
import { ShiftContext } from "../core/shift/ShiftContext";

export type RestaurantBootstrapState = {
  coreStatus: "online" | "offline-intencional" | "offline-erro";
  dataSource: "core" | "local" | "exemplo";
  publishStatus: "nao-publicado" | "publicado" | "desalinhado";
  operationMode: "exploracao" | "operacao-real";
  blockingLevel: "nenhum" | "parcial" | "total";
};

export function useBootstrapState(): RestaurantBootstrapState {
  const { runtime } = useRestaurantRuntime();
  const shift = useContext(ShiftContext);

  return useMemo(() => {
    const coreStatus = runtime.coreMode ?? "online";

    const dataSource: RestaurantBootstrapState["dataSource"] =
      runtime.coreReachable
        ? runtime.dataMode === "live"
          ? "core"
          : "exemplo"
        : "local";

    const publishStatus: RestaurantBootstrapState["publishStatus"] =
      runtime.isPublished ? "publicado" : "nao-publicado";

    const operationMode: RestaurantBootstrapState["operationMode"] =
      runtime.systemState === "SETUP" || runtime.productMode === "trial"
        ? "exploracao"
        : "operacao-real";

    const blockingLevel: RestaurantBootstrapState["blockingLevel"] =
      coreStatus === "offline-erro"
        ? "parcial"
        : publishStatus !== "publicado"
        ? "parcial"
        : operationMode === "operacao-real" && shift && !shift.isShiftOpen
        ? "parcial"
        : "nenhum";

    return {
      coreStatus,
      dataSource,
      publishStatus,
      operationMode,
      blockingLevel,
    };
  }, [
    runtime.coreMode,
    runtime.coreReachable,
    runtime.dataMode,
    runtime.isPublished,
    runtime.systemState,
    runtime.productMode,
    shift?.isShiftOpen,
  ]);
}
