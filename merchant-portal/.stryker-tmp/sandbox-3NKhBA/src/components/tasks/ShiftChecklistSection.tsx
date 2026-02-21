/**
 * ShiftChecklistSection — Checklist do turno (FASE 3 Passo 2)
 *
 * Mostra itens do checklist do turno atual; staff marca conclusão.
 * Só aparece quando há turno ativo (chefiapp_turn_session_id no localStorage).
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import {
  getActiveTurnSessionIdFromStorage,
  readShiftChecklistCompletions,
  readShiftChecklistTemplates,
  type ShiftChecklistCompletion,
  type ShiftChecklistTemplate,
} from "../../infra/readers/ShiftChecklistReader";
import {
  completeShiftChecklistItem,
  uncompleteShiftChecklistItem,
} from "../../infra/writers/ShiftChecklistWriter";

interface ShiftChecklistSectionProps {
  restaurantId: string;
  /** userId para completed_by (opcional) */
  userId?: string | null;
  variant?: "compact" | "full";
}

export function ShiftChecklistSection({
  restaurantId,
  userId = null,
  variant = "full",
}: ShiftChecklistSectionProps) {
  const [turnSessionId, setTurnSessionId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ShiftChecklistTemplate[]>([]);
  const [completions, setCompletions] = useState<ShiftChecklistCompletion[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sessionId = getActiveTurnSessionIdFromStorage();
    setTurnSessionId(sessionId);

    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setError(null);
      // P0 FIX: Provisionamento removido da UI para evitar 404 em Docker
      // await ensureDefaultShiftChecklistTemplates(restaurantId);
      const [tpl, comp] = await Promise.all([
        readShiftChecklistTemplates(restaurantId),
        sessionId
          ? readShiftChecklistCompletions(sessionId)
          : Promise.resolve([]),
      ]);
      setTemplates(tpl);
      setCompletions(comp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar checklist");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const isCompleted = (templateId: string) =>
    completions.some((c) => c.template_id === templateId);

  const handleToggle = async (templateId: string) => {
    if (!turnSessionId) return;
    setTogglingId(templateId);
    try {
      if (isCompleted(templateId)) {
        await uncompleteShiftChecklistItem(turnSessionId, templateId);
        setCompletions((prev) =>
          prev.filter((c) => c.template_id !== templateId),
        );
      } else {
        await completeShiftChecklistItem(
          turnSessionId,
          templateId,
          userId ?? null,
        );
        setCompletions((prev) => [
          ...prev,
          {
            id: "",
            turn_session_id: turnSessionId,
            template_id: templateId,
            completed_at: new Date().toISOString(),
            completed_by: userId ?? null,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setTogglingId(null);
    }
  };

  if (!restaurantId) {
    return (
      <div
        style={{
          padding: variant === "compact" ? 12 : 24,
          backgroundColor: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          fontSize: 14,
          color: "#64748b",
        }}
      >
        Configure o restaurante para ver o checklist do turno.
      </div>
    );
  }

  if (!turnSessionId) {
    return (
      <div
        style={{
          padding: variant === "compact" ? 12 : 24,
          backgroundColor: "#f8f9fa",
          borderRadius: 8,
          color: "#666",
          fontSize: 14,
        }}
      >
        Abra um turno (TPV ou App Staff) para ver e marcar o checklist do turno.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#666", fontSize: 14 }}>
        A carregar checklist…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 12,
          backgroundColor: "#fee",
          borderRadius: 8,
          color: "#c00",
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div style={{ padding: 24, color: "#666", fontSize: 14 }}>
        Nenhum item no checklist. O dono pode configurar em Config → Pessoas.
      </div>
    );
  }

  return (
    <section
      style={{
        padding: variant === "compact" ? 12 : 24,
        backgroundColor: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: 16,
          fontWeight: 600,
          color: "#333",
        }}
      >
        Checklist do turno
      </h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {templates.map((t) => (
          <li
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <input
              type="checkbox"
              checked={isCompleted(t.id)}
              disabled={!!togglingId}
              onChange={() => handleToggle(t.id)}
              style={{
                width: 20,
                height: 20,
                cursor: togglingId ? "wait" : "pointer",
              }}
            />
            <span style={{ fontSize: 14, color: "#333", flex: 1 }}>
              {t.label}
            </span>
            {t.kind !== "general" && (
              <span
                style={{
                  fontSize: 11,
                  color: "#999",
                  textTransform: "uppercase",
                }}
              >
                {t.kind}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
