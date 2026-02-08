/**
 * SHIFT CHECKLIST WRITER
 *
 * FASE 3 Passo 2: Marcar/desmarcar itens do checklist do turno; templates padrão.
 */

import { isDockerBackend } from "../../core/infra/backendAdapter";
import { dockerCoreClient } from "../docker-core/connection";

const DEFAULT_TEMPLATES: {
  label: string;
  sort_order: number;
  kind: "opening" | "closing" | "general";
}[] = [
  { label: "Verificar equipamentos", sort_order: 1, kind: "opening" },
  { label: "Confirmar stock mínimo", sort_order: 2, kind: "opening" },
  { label: "Limpar área de trabalho", sort_order: 3, kind: "opening" },
  { label: "Fechar caixa e conferir", sort_order: 10, kind: "closing" },
  { label: "Desligar equipamentos", sort_order: 11, kind: "closing" },
];

/** 404 ou tabela inexistente = Core não expõe gm_shift_checklist_templates; não logar nem inserir. */
function isTableUnavailableError(
  error: { message?: string; code?: string; status?: number } | null,
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = String(error.code ?? "").toLowerCase();
  const status = (error as { status?: number }).status;
  return (
    status === 404 ||
    code === "pgrst116" ||
    code === "42p01" ||
    code === "404" ||
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror")
  );
}

/**
 * Garante que o restaurante tem templates de checklist; se não tiver, insere os padrões.
 * Se a tabela não existir no Core (404), falha em silêncio — API_ERROR_CONTRACT.
 */
export async function ensureDefaultShiftChecklistTemplates(
  restaurantId: string,
): Promise<void> {
  // P0 FIX: Em Docker Core, não tentar provisionar defaults via Core
  // pois a tabela gm_shift_checklist_templates pode não existir.
  if (isDockerBackend()) {
    return;
  }

  const { count, error: countError } = await dockerCoreClient
    .from("gm_shift_checklist_templates")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  if (countError || (count ?? 0) > 0) return;
  if (
    isTableUnavailableError(
      countError as { message?: string; code?: string } | null,
    )
  )
    return;

  const { error: insertError } = await dockerCoreClient
    .from("gm_shift_checklist_templates")
    .insert(
      DEFAULT_TEMPLATES.map((t) => ({
        restaurant_id: restaurantId,
        label: t.label,
        sort_order: t.sort_order,
        kind: t.kind,
      })),
    );

  if (insertError && !isTableUnavailableError(insertError)) {
    const msg = insertError.message ?? "Unknown error";
    console.warn("[ShiftChecklist] ensureDefaultShiftChecklistTemplates:", msg);
  }
}

/**
 * Marca um item do checklist como concluído no turno.
 */
export async function completeShiftChecklistItem(
  turnSessionId: string,
  templateId: string,
  completedByUserId: string | null,
): Promise<void> {
  const { error } = await dockerCoreClient
    .from("gm_shift_checklist_completions")
    .upsert(
      {
        turn_session_id: turnSessionId,
        template_id: templateId,
        completed_at: new Date().toISOString(),
        completed_by: completedByUserId,
      },
      { onConflict: "turn_session_id,template_id" },
    );

  if (error) {
    throw new Error(`completeShiftChecklistItem: ${error.message}`);
  }
}

/**
 * Remove a conclusão de um item do checklist (desmarca).
 */
export async function uncompleteShiftChecklistItem(
  turnSessionId: string,
  templateId: string,
): Promise<void> {
  const { error } = await dockerCoreClient
    .from("gm_shift_checklist_completions")
    .delete()
    .eq("turn_session_id", turnSessionId)
    .eq("template_id", templateId);

  if (error) {
    throw new Error(`uncompleteShiftChecklistItem: ${error.message}`);
  }
}
