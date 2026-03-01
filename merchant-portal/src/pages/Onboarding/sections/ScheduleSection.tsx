/**
 * ScheduleSection - Seção de Horários
 * Configura horários de funcionamento por dia da semana
 * Em modo Docker usa dockerCoreClient (PostgREST); caso contrário Supabase.
 */

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import {
  BackendType,
  getBackendType,
} from "../../../core/infra/backendAdapter";
import { useTenant } from "../../../core/tenant/TenantContext";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import styles from "./ScheduleSection.module.css";
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
  const { tenantId } = useTenant();
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
    const restaurantId = runtime.restaurant_id || identity.id || tenantId;

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
    <div className={styles.container}>
      <h1 className={styles.title}>
        ⏰ Horários{" "}
        {isSaving && <span className={styles.saving}>(Salvando...)</span>}
      </h1>
      <p className={styles.subtitle}>
        Configure os horários de funcionamento por dia da semana
      </p>

      <div className={styles.daysList}>
        {DAYS.map((day) => {
          const schedule = schedules[day.id];
          return (
            <div
              key={day.id}
              className={`${styles.dayCard} ${
                schedule.open ? styles.dayCardOpen : styles.dayCardClosed
              }`}
            >
              <div className={styles.dayRow}>
                <label className={styles.dayLabel}>
                  <input
                    type="checkbox"
                    checked={schedule.open}
                    onChange={(e) =>
                      updateSchedule(day.id, "open", e.target.checked)
                    }
                    className={styles.dayCheckbox}
                  />
                  <span className={styles.dayName}>{day.label}</span>
                </label>
                {schedule.open && (
                  <div className={styles.timeRange}>
                    <input
                      type="time"
                      title={`Hora de abertura - ${day.label}`}
                      aria-label={`Hora de abertura - ${day.label}`}
                      value={schedule.start}
                      onChange={(e) =>
                        updateSchedule(day.id, "start", e.target.value)
                      }
                      className={styles.timeInput}
                    />
                    <span className={styles.untilText}>até</span>
                    <input
                      type="time"
                      title={`Hora de fecho - ${day.label}`}
                      aria-label={`Hora de fecho - ${day.label}`}
                      value={schedule.end}
                      onChange={(e) =>
                        updateSchedule(day.id, "end", e.target.value)
                      }
                      className={styles.timeInput}
                    />
                  </div>
                )}
                {!schedule.open && (
                  <span className={styles.closedText}>Fechado</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
