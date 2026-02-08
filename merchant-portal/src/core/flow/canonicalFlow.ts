/**
 * Sequência Canônica Oficial v1.0
 *
 * Contrato: docs/contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10
 * UI, Core e discurso comercial devem alinhar-se a esta sequência.
 */

export const CANONICAL_FLOW_STEPS = [
  "landing",
  "auth",
  "bootstrap",
  "first_product",
  "aha_moment",
  "trial_silent",
  "operation",
  "billing_async",
] as const;

export type CanonicalStepId = (typeof CANONICAL_FLOW_STEPS)[number];

export interface CanonicalStep {
  id: CanonicalStepId;
  order: number;
  label: string;
  required: boolean;
  description: string;
}

/** 8 passos oficiais (Sequência Canônica v1.0). */
export const CANONICAL_STEPS: CanonicalStep[] = [
  { id: "landing", order: 1, label: "Landing", required: true, description: "CTA: Testar 14 dias; Demo 3 min; Já tenho acesso (login)" },
  { id: "auth", order: 2, label: "Auth", required: true, description: "Demo 3 min, Simular registo local, Login produção" },
  { id: "bootstrap", order: 3, label: "Bootstrap obrigatório", required: true, description: "Criar restaurante: nome, tipo, país/moeda, contacto opcional" },
  { id: "first_product", order: 4, label: "Onboarding essencial", required: false, description: "Criar primeiro produto; opcional: pular (Continuar sem adicionar agora)" },
  { id: "aha_moment", order: 5, label: "Aha Moment", required: true, description: "Abrir TPV → Criar pedido → Finalizar venda → Feedback Pedido pago" },
  { id: "trial_silent", order: 6, label: "Trial silencioso", required: false, description: "trial_active; sem bloqueio operacional" },
  { id: "operation", order: 7, label: "Operação normal", required: false, description: "TPV / KDS / tarefas" },
  { id: "billing_async", order: 8, label: "Billing assíncrono", required: false, description: "Banner discreto; escolher plano quando fizer sentido" },
];

/** Discurso comercial: uma frase por fase (copy de referência para landing, emails, UI). */
export const CANONICAL_COPY: Record<CanonicalStepId, string> = {
  landing: "Primeira venda em menos de 5 minutos",
  auth: "Testar 14 dias no meu restaurante",
  bootstrap: "Nome e contacto para começar",
  first_product: "Um produto para destravar o TPV",
  aha_moment: "Pedido pago",
  trial_silent: "Trial em background, sem bloqueios",
  operation: "TPV, KDS e tarefas sem bloqueios",
  billing_async: "Escolher plano quando fizer sentido",
};

/** Rotas que correspondem a cada passo (para navegação e progresso). */
export const CANONICAL_STEP_ROUTES: Partial<Record<CanonicalStepId, string>> = {
  landing: "/",
  auth: "/auth",
  bootstrap: "/bootstrap",
  first_product: "/onboarding/first-product",
  aha_moment: "/op/tpv",
  operation: "/app/dashboard",
  billing_async: "/app/billing",
};

export function getCanonicalStep(id: CanonicalStepId): CanonicalStep {
  const step = CANONICAL_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown canonical step: ${id}`);
  return step;
}

export function getCanonicalCopy(stepId: CanonicalStepId): string {
  return CANONICAL_COPY[stepId];
}
