/**
 * ModuleGate — FASE 1 Passo 2: só permite acesso ao TPV/KDS se o módulo estiver ativo
 *
 * Usa preferência em localStorage (modulesConfigStorage) até haver backend.
 *
 * ORE: Para rotas TPV/KDS, preferir useOperationalReadiness("TPV"|"KDS"); o ORE trata
 * MODULE_NOT_ENABLED e devolve BlockingScreen. Este componente é legado quando a rota
 * já usa ORE na página (ex.: TPVMinimal, KDSMinimal).
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 */

import React, { useContext } from "react";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import {
  getModulesEnabled,
  type ModulesEnabled,
} from "../../core/storage/modulesConfigStorage";
import { GlobalBlockedView } from "../../ui/design-system/components";

interface Props {
  moduleId: "tpv" | "kds";
  children: React.ReactNode;
}

const LABELS: Record<keyof ModulesEnabled, string> = {
  tpv: "TPV",
  kds: "KDS",
};

export function ModuleGate({ moduleId, children }: Props) {
  const context = useContext(RestaurantRuntimeContext);
  const restaurantId = context?.runtime?.restaurant_id ?? null;
  const enabled = getModulesEnabled(restaurantId);

  if (enabled[moduleId]) {
    return <>{children}</>;
  }

  return (
    <GlobalBlockedView
      title={`${LABELS[moduleId]} não ativo`}
      description={`Ative o módulo ${LABELS[moduleId]} em Configuração > Módulos para usar esta ferramenta.`}
      action={{ label: "Configuração > Módulos", to: "/admin/modules" }}
    />
  );
}
