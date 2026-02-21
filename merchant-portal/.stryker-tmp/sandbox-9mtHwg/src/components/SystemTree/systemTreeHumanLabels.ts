/**
 * Camada semântica da System Tree
 * Traduz estado técnico em narrativa humana e ação.
 */

import type { SetupStatus } from "../../context/RestaurantRuntimeContext";
import type { NodeStatus } from "../../context/SystemTreeContext";

export type ExecutiveState = "operando" | "atencao" | "critico";

/** Status técnico → label humano + emoji */
export function statusToHumanLabel(status: NodeStatus): {
  emoji: string;
  label: string;
} {
  switch (status) {
    case "active":
    case "installed":
    case "complete":
      return { emoji: "🟢", label: "Ativo" };
    case "inactive":
    case "not_installed":
    case "incomplete":
      return { emoji: "⚠", label: "Atenção" };
    case "locked":
      return { emoji: "🔴", label: "Bloqueado" };
    case "dormant":
      return { emoji: "💤", label: "Pausado" };
    case "observing":
      return { emoji: "👁", label: "Em observação" };
    default:
      return { emoji: "○", label: String(status) };
  }
}

/** Tipo técnico → label humano */
export function typeToHumanLabel(type: string): string {
  const map: Record<string, string> = {
    core: "Núcleo do sistema",
    domain: "Domínio",
    module: "Módulo",
    config: "Configuração",
    operation: "Operação",
    permission: "Permissão",
    data: "Dados",
    roadmap: "Roadmap",
  };
  return map[type] ?? type;
}

/** Estado geral do restaurante (para visão executiva) */
export function getExecutiveState(
  restaurantStatus: string | null,
  setupStatus: SetupStatus,
): { state: ExecutiveState; label: string } {
  if (restaurantStatus === "suspended") {
    return { state: "critico", label: "Faturação suspensa" };
  }
  if (restaurantStatus === "past_due") {
    return { state: "atencao", label: "Pagamento em atraso" };
  }
  if (restaurantStatus === "paused") {
    return { state: "atencao", label: "Sistema pausado" };
  }
  if (restaurantStatus !== "active") {
    return { state: "atencao", label: "Onboarding em andamento" };
  }
  const incomplete = Object.entries(setupStatus).filter(([, v]) => !v).length;
  if (incomplete > 2) {
    return { state: "atencao", label: "Configuração incompleta" };
  }
  if (incomplete > 0) {
    return { state: "operando", label: "Operando (ajustes pendentes)" };
  }
  return { state: "operando", label: "Operando" };
}

/** Próximo passo recomendado com base em setup_status */
export function getRecommendedAction(setupStatus: SetupStatus): string {
  const order = [
    "identity",
    "location",
    "menu",
    "schedule",
    "people",
    "payments",
    "publish",
  ];
  for (const key of order) {
    if (setupStatus[key] === false) {
      const labels: Record<string, string> = {
        identity: "definir identidade do restaurante",
        location: "configurar endereço e mesas",
        menu: "finalizar cardápio",
        schedule: "definir horário de funcionamento",
        people: "cadastrar equipe",
        payments: "configurar formas de pagamento",
        publish: "publicar restaurante",
      };
      return labels[key] ?? `completar ${key}`;
    }
  }
  return "tudo em ordem — operação ao vivo";
}

/** Checklist executivo (itens principais) */
export function getExecutiveChecklist(
  setupStatus: SetupStatus,
  installedModules: string[] = [],
  plan: string = "basic",
  status: string = "active",
): { label: string; ok: boolean }[] {
  const has = (k: string) => !!setupStatus[k];
  const hasModule = (id: string) => installedModules.includes(id);

  const checklist = [
    { label: "Pedidos ativos", ok: has("identity") && has("location") },
    { label: "KDS conectado", ok: hasModule("kds") },
    { label: "Cardápio completo", ok: has("menu") },
    { label: "Horário definido", ok: has("schedule") },
    { label: "Equipe cadastrada", ok: has("people") },
    { label: "Pagamentos configurados", ok: has("payments") },
  ];

  // Adiciona item de faturação
  if (status === "suspended" || status === "past_due") {
    checklist.push({ label: "Regularizar faturação", ok: false });
  } else if (plan === "basic") {
    checklist.push({ label: "Modo Trial (Plano Free)", ok: true });
  }

  return checklist;
}

/** Dados mínimos de um nó para narrativa de bloqueio */
export interface LockedNodeInfo {
  id: string;
  label: string;
  type: string;
  description?: string;
  lockedReason?: string;
  installable?: boolean;
}

/**
 * Para TODO nó LOCKED: 4 respostas que transformam arquitetura em decisão.
 * 1. O que é
 * 2. Por que está bloqueado
 * 3. O que destrava
 * 4. Agora ou depois
 */
export function getLockedNarrative(node: LockedNodeInfo): {
  oQueE: string;
  porQueBloqueado: string;
  oQueDestrava: string;
  agoraOuDepois: string;
} {
  const typeLabel = typeToHumanLabel(node.type);

  const oQueE =
    node.description ??
    (node.type === "domain"
      ? `Este domínio permite gerenciar operações de ${node.label.toLowerCase()} integradas ao restaurante.`
      : node.type === "module"
      ? `Este módulo adiciona a capacidade de ${node.label} ao sistema.`
      : `${node.label} — ${typeLabel}.`);

  const porQueBloqueado =
    node.lockedReason ?? "Recurso não disponível no plano atual.";

  const oQueDestrava =
    porQueBloqueado.toLowerCase().includes("módulo não instalado") ||
    porQueBloqueado.toLowerCase().includes("modulo nao instalado")
      ? `Para ativar, instale o módulo ${node.label}.`
      : node.installable
      ? "Você pode ativar este recurso no painel de módulos."
      : "Solicite ativação ou aguarde disponibilidade no roadmap.";

  const agoraOuDepois = node.installable
    ? "Pode ser ativado agora."
    : "Disponível no roadmap ou sob demanda.";

  return { oQueE, porQueBloqueado, oQueDestrava, agoraOuDepois };
}
