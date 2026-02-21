/**
 * ChefIApp AI Gateway
 *
 * Uma IA, vários papéis. Contrato central para inferência (explicar, sugerir).
 * Ver docs/CHEFIAPP_AI_GATEWAY_SPEC.md
 *
 * Versão 0: mock provider; contrato vivo. Quando VITE_AI_GATEWAY_ENDPOINT
 * estiver configurado, usa o endpoint real.
 */
// @ts-nocheck


export type Intent =
  | "perception_explanation"
  | "mentor_advice"
  | "dashboard_summary"
  | "trial_narration"
  | "system_diagnosis";

export interface InferResult {
  explanation: string;
  suggestion?: string;
  priority?: "low" | "medium" | "high" | "critical";
  meta?: { model?: string; tokens?: number; intent: string };
}

export type InferContext = Record<string, unknown>;

const AI_GATEWAY_ENDPOINT =
  typeof import.meta !== "undefined" &&
  import.meta.env?.VITE_AI_GATEWAY_ENDPOINT
    ? String(import.meta.env.VITE_AI_GATEWAY_ENDPOINT).trim()
    : "";

/**
 * Mock: devolve InferResult por intent para validar contrato e fluxo.
 */
function mockInfer(intent: Intent, context: InferContext): InferResult {
  const zone = (context.zone as string) || "zona";
  const duration = (context.duration_minutes as number) ?? 0;
  const movement = (context.movement as string) || "desconhecido";
  const activeOrders = (context.active_orders as number) ?? 0;

  switch (intent) {
    case "perception_explanation": {
      const zoneLabel =
        zone === "kitchen"
          ? "Cozinha"
          : zone === "floor"
          ? "Salão"
          : zone === "storage"
          ? "Estoque"
          : zone === "cash"
          ? "Caixa"
          : zone === "entrance"
          ? "Entrada"
          : zone;
      const explanation =
        duration > 0 && movement === "low"
          ? `${zoneLabel} sem movimento há ${duration} min. Com ${activeOrders} pedido(s) ativo(s), pode indicar gargalo antes do pico.`
          : `${zoneLabel}: movimento ${movement}. ${activeOrders} pedido(s) ativo(s). Sistema a observar padrões; sem identificar pessoas.`;
      return {
        explanation,
        suggestion:
          duration > 3 && movement === "low"
            ? "Verificar gargalo na cozinha e priorizar saída de pedidos."
            : undefined,
        priority: duration >= 5 ? "high" : "medium",
        meta: { intent },
      };
    }
    case "mentor_advice":
      return {
        explanation:
          "Com base no estado atual do restaurante, o sistema sugere rever as tarefas abertas e os alertas. Próximo passo: consolidar prioridades no dashboard.",
        suggestion: "Rever tarefas e alertas no dashboard.",
        priority: "medium",
        meta: { intent },
      };
    case "dashboard_summary":
      return {
        explanation:
          "Resumo do que importa agora: estado operacional e alertas ativos. A IA explica e sugere; o sistema não executa sozinho.",
        meta: { intent },
      };
    case "trial_narration":
      return {
        explanation:
          "Simulated Environment (Trial Infrastructure): o sistema mostra o que seria observado em operação real, sem executar ações.",
        meta: { intent },
      };
    case "system_diagnosis":
      return {
        explanation:
          "Estado do sistema: módulos e conectividade. Nenhum dado sensível é enviado; apenas metadados para diagnóstico.",
        meta: { intent },
      };
    default:
      return {
        explanation: `Intent "${intent}" recebido. Contexto: ${JSON.stringify(
          context,
        ).slice(0, 200)}.`,
        meta: { intent: String(intent) },
      };
  }
}

/**
 * Chama o gateway real (POST { intent, context }) se endpoint configurado.
 */
async function realInfer(
  intent: Intent,
  context: InferContext,
): Promise<InferResult> {
  const res = await fetch(AI_GATEWAY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent, context }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `AI Gateway HTTP ${res.status}`);
  }
  const data = (await res.json()) as InferResult;
  if (typeof data.explanation !== "string") {
    throw new Error("AI Gateway respondeu sem explanation");
  }
  return {
    explanation: data.explanation,
    suggestion: data.suggestion,
    priority: data.priority,
    meta: { ...data.meta, intent },
  };
}

/**
 * Inferência central: um intent + contexto → explicação (e opcional sugestão/prioridade).
 * Usa endpoint real se VITE_AI_GATEWAY_ENDPOINT estiver definido; senão, mock.
 */
export async function infer(
  intent: Intent,
  context: InferContext,
): Promise<InferResult> {
  if (AI_GATEWAY_ENDPOINT) {
    return realInfer(intent, context);
  }
  return Promise.resolve(mockInfer(intent, context));
}
