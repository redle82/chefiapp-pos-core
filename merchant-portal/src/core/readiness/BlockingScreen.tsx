/**
 * BlockingScreen — Ecrã de bloqueio canónico por BlockingReason (ORE)
 *
 * Um único componente que recebe blockingReason (e opcionalmente redirectTo)
 * e mostra título, descrição e CTA adequados via GlobalBlockedView.
 * Quando NOT_PUBLISHED, usa MenuState para mensagem humana por estado (MENU_OPERATIONAL_STATE).
 *
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 * @see docs/architecture/MENU_OPERATIONAL_STATE.md
 */

import { GlobalBlockedView } from "../../ui/design-system/components";
import {
  useMenuState,
  MENU_STATE_MESSAGES,
} from "../menu/MenuState";
import type { BlockingReason } from "./types";

const DASHBOARD = "/app/dashboard";
const CONFIG_MODULES = "/config/modules";

interface BlockingScreenProps {
  reason?: BlockingReason;
  redirectTo?: string;
}

const COPY: Record<
  BlockingReason,
  { title: string; description: string; actionLabel: string; defaultTo: string }
> = {
  CORE_OFFLINE: {
    title: "Core indisponível",
    description:
      "O servidor do restaurante não está a responder. Verifique a ligação ou tente mais tarde.",
    actionLabel: "Ir para o Portal",
    defaultTo: DASHBOARD,
  },
  BOOTSTRAP_INCOMPLETE: {
    title: "Configuração incompleta",
    description:
      "Faltam passos essenciais de configuração. Revê o Dashboard para completar identidade, local, cardápio e publicação antes de operar.",
    actionLabel: "Ir para o Dashboard",
    defaultTo: DASHBOARD,
  },
  MANDATORY_RITUAL_INCOMPLETE: {
    title: "Abertura de turno pendente",
    description:
      "Conclua as tarefas de abertura no AppStaff (Gerente): validar prontidão e abrir turno no terminal operacional. Só depois pode vender.",
    actionLabel: "Ver instruções no painel",
    defaultTo: DASHBOARD,
  },
  NO_OPEN_CASH_REGISTER: {
    title: "O turno ainda não está aberto",
    description: "Abra o turno no TPV para poder vender e operar a cozinha.",
    actionLabel: "Abrir turno",
    defaultTo: "/op/tpv",
  },
  SHIFT_NOT_STARTED: {
    title: "O turno ainda não está aberto",
    description: "Abra o turno no TPV para poder vender e operar a cozinha.",
    actionLabel: "Abrir turno",
    defaultTo: "/op/tpv",
  },
  PERMISSION_DENIED: {
    title: "Sem permissão",
    description: "Não tem permissão para aceder a esta área.",
    actionLabel: "Ir para o Portal",
    defaultTo: DASHBOARD,
  },
  MODE_NOT_ALLOWED: {
    title: "Modo não permitido",
    description: "Esta ação não está disponível no modo atual.",
    actionLabel: "Ir para o Portal",
    defaultTo: DASHBOARD,
  },
  MODULE_NOT_ENABLED: {
    title: "Módulo não ativo",
    description:
      "Ative este módulo em Configuração > Módulos para usar esta ferramenta.",
    actionLabel: "Configuração > Módulos",
    defaultTo: CONFIG_MODULES,
  },
  NOT_PUBLISHED: {
    title: "Sistema não operacional",
    description:
      "As ferramentas de operação (TPV, KDS) só ficam disponíveis após publicar o restaurante. Aceda ao portal de gestão para configurar.",
    actionLabel: "Ir para o Portal de Gestão",
    defaultTo: DASHBOARD,
  },
  RESTAURANT_NOT_FOUND: {
    title: "Restaurante não encontrado",
    description: "O restaurante solicitado não existe ou não está acessível.",
    actionLabel: "Voltar ao início",
    defaultTo: "/",
  },
  BILLING_PAST_DUE: {
    title: "Assinatura em atraso",
    description:
      "O pagamento da assinatura está em atraso. Regularize em Faturação para continuar a operar (TPV, KDS).",
    actionLabel: "Ir para Faturação",
    defaultTo: "/app/billing",
  },
  BILLING_SUSPENDED: {
    title: "Assinatura suspensa",
    description:
      "A assinatura está suspensa. Renove ou reative o plano em Faturação para continuar a operar (TPV, KDS).",
    actionLabel: "Ir para Faturação",
    defaultTo: "/app/billing",
  },
};

export function BlockingScreen({ reason, redirectTo }: BlockingScreenProps) {
  const menuState = useMenuState();

  if (!reason) {
    return (
      <GlobalBlockedView
        title="Operação indisponível"
        description="Não foi possível determinar o estado operacional. Tente voltar ao portal."
        action={{ label: "Ir para o Portal", to: DASHBOARD }}
      />
    );
  }

  const copy = COPY[reason];
  const to = redirectTo ?? copy.defaultTo;

  // MENU_OPERATIONAL_STATE: mensagem humana por estado quando bloqueio é por menu não publicado
  const description =
    reason === "NOT_PUBLISHED" && MENU_STATE_MESSAGES[menuState].blockTpv
      ? MENU_STATE_MESSAGES[menuState].blockTpv
      : copy.description;

  return (
    <GlobalBlockedView
      title={copy.title}
      description={description}
      action={{ label: copy.actionLabel, to }}
    />
  );
}
