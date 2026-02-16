/**
 * ScheduleSection - Seção de Horários
 * Configura horários de funcionamento por dia da semana
 * Em modo Docker usa dockerCoreClient (PostgREST); caso contrário Supabase.
 */

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import {
  BackendType,
  getBackendType,
} from "../../../core/infra/backendAdapter";
// Domain writes ONLY via Core (Supabase removed — §4). No fallback.

const DAYS = [
  { id: 0, label: "Domingo", short: "Dom" },
  { id: 1, label: "Segunda", short: "Seg" },
  { id: 2, label: "Terça", short: "Ter" },
  { id: 3, label: "Quarta", short: "Qua" },
  { id: 4, label: "Quinta", short: "Qui" },
  { id: 5, label: "Sexta", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
];

export function ScheduleSection() {
  const { updateSectionStatus } = useOnboarding();
  const { identity } = useRestaurantIdentity();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [schedules, setSchedules] = useState<
    Record<number, { open: boolean; start: string; end: string }>
  >(() => {
    const defaultSchedule: Record<
      number,
      { open: boolean; start: string; end: string }
    > = {};
    for (let i = 0; i <= 6; i++) {
      defaultSchedule[i] = { open: i !== 0, start: "09:00", end: "22:00" }; // Fechado domingo por padrão
    }
    return defaultSchedule;
  });

  const updateSchedule = (
    day: number,
    field: "open" | "start" | "end",
    value: boolean | string,
  ) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    const isValid = Object.values(schedules).every((s) => {
      if (!s.open) return true; // Se fechado, é válido
      return s.start && s.end && s.start < s.end;
    });

    const status = isValid ? "COMPLETE" : "INCOMPLETE";
    updateSectionStatus("schedule", status);

    // Atualizar RestaurantRuntimeContext (persistência real)
    if (runtime.restaurant_id) {
      updateSetupStatus("schedule", isValid).catch((error) => {
        const msg = error?.message ?? String(error);
        if (msg.includes("aborted")) return;
        console.error(
          "[ScheduleSection] Erro ao atualizar setup_status:",
          error,
        );
      });
    }

    // Salvar no banco se válido e tiver restaurantId
    // Usar restaurant_id do RestaurantRuntimeContext (fonte única de verdade)
    const restaurantId =
      runtime.restaurant_id ||
      identity.id ||
      (typeof window !== "undefined"
        ? localStorage.getItem("chefiapp_restaurant_id")
        : null);

    if (isValid && restaurantId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          // ANTI-SUPABASE §4: Schedule write ONLY via Core. Fail explicit if not Docker.
          if (getBackendType() !== BackendType.docker) {
            throw new Error(
              "Core indisponível. Configure o Docker Core para salvar os horários.",
            );
          }
          console.log("[ScheduleSection] Salvando no banco (Core)...", {
            restaurantId,
            schedules,
          });

          await dockerCoreClient
            .from("restaurant_schedules")
            .delete()
            .eq("restaurant_id", restaurantId);

          const schedulesToInsert = Object.entries(schedules).map(
            ([day, schedule]) => ({
              restaurant_id: restaurantId,
              day_of_week: parseInt(day),
              open: schedule.open,
              start_time: schedule.start,
              end_time: schedule.end,
            }),
          );

          const { error } = await dockerCoreClient
            .from("restaurant_schedules")
            .insert(schedulesToInsert);

          if (error) {
            console.error("[ScheduleSection] Erro ao salvar horários:", error);
            alert(`Erro ao salvar: ${error.message}`);
          } else {
            console.log("[ScheduleSection] ✅ Horários salvos no banco");
            updateSetupStatus("schedule", true).catch((err) => {
              console.warn(
                "[ScheduleSection] Erro ao persistir setup_status:",
                err,
              );
            });
          }
        } catch (error: any) {
          console.error("[ScheduleSection] Erro ao salvar horários:", error);
          alert(`Erro ao salvar: ${error?.message || "Erro desconhecido"}`);
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    } else if (isValid && !restaurantId) {
      console.warn(
        "[ScheduleSection] Dados válidos mas sem restaurantId. Aguardando...",
      );
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [schedules, identity.id, updateSectionStatus]);

  return (
    <div style={{ padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
        ⏰ Horários{" "}
        {isSaving && (
          <span style={{ fontSize: "14px", color: "var(--color-primary)" }}>
            (Salvando...)
          </span>
        )}
      </h1>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
        Configure os horários de funcionamento por dia da semana
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {DAYS.map((day) => {
          const schedule = schedules[day.id];
          return (
            <div
              key={day.id}
              style={{
                padding: "16px",
                border: "1px solid var(--surface-border)",
                borderRadius: "8px",
                backgroundColor: schedule.open ? "var(--card-bg-on-dark)" : "var(--surface-elevated)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "12px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={schedule.open}
                    onChange={(e) =>
                      updateSchedule(day.id, "open", e.target.checked)
                    }
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      minWidth: "80px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {day.label}
                  </span>
                </label>
                {schedule.open && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                    }}
                  >
                    <input
                      type="time"
                      value={schedule.start}
                      onChange={(e) =>
                        updateSchedule(day.id, "start", e.target.value)
                      }
                      style={{
                        padding: "8px",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                    <span style={{ color: "var(--text-primary)" }}>até</span>
                    <input
                      type="time"
                      value={schedule.end}
                      onChange={(e) =>
                        updateSchedule(day.id, "end", e.target.value)
                      }
                      style={{
                        padding: "8px",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                )}
                {!schedule.open && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "var(--text-tertiary)",
                      fontStyle: "italic",
                    }}
                  >
                    Fechado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
