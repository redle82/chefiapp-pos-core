// @ts-nocheck
import type { RestaurantReadiness } from "./restaurantReadiness";
import type { PreflightOperationalResult } from "../readiness/preflightOperational";
import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { MenuState } from "../menu/MenuState";
import type { BillingStatus } from "../billing/coreBillingApi";

export type NodeId =
  | "identity"
  | "location_currency"
  | "menu"
  | "tables"
  | "cash_register"
  | "payments"
  | "team"
  | "tpv_preview"
  | "tpv_live"
  | "billing";

export type NodeState = "missing" | "incomplete" | "ready";

export interface NodeVisualState {
  state: NodeState;
  icon: string;
  tooltip: string;
}

export type SystemTreeStateMap = Record<NodeId, NodeVisualState>;

export interface SystemTreeContext {
  readiness: RestaurantReadiness;
  preflight: PreflightOperationalResult;
  runtime: RestaurantRuntime;
  menuState: MenuState;
}

const STATE_ICON: Record<NodeState, string> = {
  missing: "🔴",
  incomplete: "🟡",
  ready: "🟢",
};

function makeNode(state: NodeState, tooltip: string): NodeVisualState {
  return {
    state,
    icon: STATE_ICON[state],
    tooltip,
  };
}

/**
 * Deriva o estado da SystemTree (🔴/🟡/🟢) a partir de readiness, preflight e runtime.
 *
 * Regras são propositadamente conservadoras: preferem marcar como `incomplete`
 * em vez de `ready` quando há dúvida.
 */
export function deriveSystemTreeState(
  context: SystemTreeContext
): SystemTreeStateMap {
  const { readiness, preflight, runtime, menuState } = context;
  const setup = runtime.setup_status ?? {};

  const map = {} as SystemTreeStateMap;

  // Identidade
  const identityState: NodeState = preflight.hasIdentity ? "ready" : "missing";
  map.identity = makeNode(
    identityState,
    identityState === "ready"
      ? "Identidade completa."
      : "Define nome, tipo e país do restaurante."
  );

  // Local & Moeda (location + schedule)
  const hasLocation = setup.location === true;
  const hasSchedule = setup.schedule === true;
  let locationState: NodeState;
  if (hasLocation && hasSchedule) locationState = "ready";
  else if (hasLocation || hasSchedule) locationState = "incomplete";
  else locationState = "missing";
  map.location_currency = makeNode(
    locationState,
    locationState === "ready"
      ? "Localização e horários configurados."
      : "Configura localização e horários."
  );

  // Menu (usa MenuState canónico)
  let menuNodeState: NodeState;
  switch (menuState) {
    case "LIVE":
      menuNodeState = "ready";
      break;
    case "EMPTY":
      menuNodeState = "missing";
      break;
    default:
      menuNodeState = "incomplete";
      break;
  }
  const menuTooltip =
    menuState === "LIVE"
      ? "Menu publicado e disponível para venda."
      : menuState === "EMPTY"
      ? "Cria produtos e categorias no Menu Builder."
      : "Completa o setup e publica o menu.";
  map.menu = makeNode(menuNodeState, menuTooltip);

  // Mesas / Zonas — heurística via setup_status.tables
  const hasTablesFlag = setup.tables === true;
  const tablesState: NodeState = hasTablesFlag ? "ready" : "missing";
  map.tables = makeNode(
    tablesState,
    tablesState === "ready"
      ? "Mesas / zonas configuradas."
      : "Configura mesas e zonas se usares serviço em mesa."
  );

  // Turnos & Caixa — ligado ao RestaurantReadiness
  let cashState: NodeState;
  if (readiness.operationalStatus === "turn_open") cashState = "ready";
  else if (readiness.configStatus === "ready") cashState = "incomplete";
  else cashState = "missing";
  map.cash_register = makeNode(
    cashState,
    cashState === "ready"
      ? "Turno aberto. Podes vender."
      : cashState === "incomplete"
      ? "Turno fechado. Abre um turno para começar a vender."
      : "Configura identidade e menu antes de abrir um turno."
  );

  // Métodos de Pagamento — heurística simples via setup_status.payments
  const hasPayments = setup.payments === true;
  const paymentsState: NodeState = hasPayments ? "ready" : "missing";
  map.payments = makeNode(
    paymentsState,
    hasPayments
      ? "Métodos de pagamento configurados."
      : "Configura pelo menos um método de pagamento."
  );

  // Equipa — usa setup_status.people como proxy
  const hasPeople = setup.people === true;
  const teamState: NodeState = hasPeople ? "ready" : "incomplete";
  map.team = makeNode(
    teamState,
    teamState === "ready"
      ? "Equipa registada."
      : "Adiciona os membros principais da equipa."
  );

  // TPV Preview — permitido assim que há alguma configuração base
  let tpvPreviewState: NodeState;
  if (readiness.configStatus === "ready") tpvPreviewState = "ready";
  else if (preflight.hasIdentity || preflight.hasPublishedMenu)
    tpvPreviewState = "incomplete";
  else tpvPreviewState = "missing";
  map.tpv_preview = makeNode(
    tpvPreviewState,
    "Ver TPV em modo exemplo, sem vendas reais."
  );

  // TPV Real — dependente de turno aberto e configuração mínima
  let tpvLiveState: NodeState;
  if (readiness.operationalStatus === "turn_open") tpvLiveState = "ready";
  else if (readiness.configStatus === "ready") tpvLiveState = "incomplete";
  else tpvLiveState = "missing";
  const tpvLiveTooltip =
    tpvLiveState === "ready"
      ? "TPV pronto para vendas reais (turno aberto)."
      : tpvLiveState === "incomplete"
      ? "Abre um turno para começar a vender no TPV."
      : "Completa identidade e menu antes de operar o TPV.";
  map.tpv_live = makeNode(tpvLiveState, tpvLiveTooltip);

  // Plano & Faturação — baseado em billing_status
  const billingStatus = runtime.billing_status as BillingStatus | null | undefined;
  let billingNodeState: NodeState;
  if (billingStatus === "active") billingNodeState = "ready";
  else if (billingStatus === "trial" || billingStatus === "past_due")
    billingNodeState = "incomplete";
  else billingNodeState = "missing";
  const billingTooltip =
    billingNodeState === "ready"
      ? "Plano e faturação ativos."
      : billingNodeState === "incomplete"
      ? "Trial ou pendência de faturação. Revê o plano."
      : "Ativa um plano para desbloquear faturação.";
  map.billing = makeNode(billingNodeState, billingTooltip);

  return map;
}

/**
 * Verifica se existem nós críticos vermelhos (missing) que bloqueiam operação.
 * Nós críticos: identidade, menu publicado e caixa/turno.
 */
export function hasCriticalRedNodes(state: SystemTreeStateMap): boolean {
  const criticalNodes: NodeId[] = ["identity", "menu", "cash_register"];
  return criticalNodes.some((id) => state[id]?.state === "missing");
}