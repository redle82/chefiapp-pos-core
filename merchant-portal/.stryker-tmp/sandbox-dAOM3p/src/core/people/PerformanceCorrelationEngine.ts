/**
 * PerformanceCorrelationEngine - Engine de Correlação Tempo ↔ Desempenho
 *
 * Analisa correlação entre horas trabalhadas e desempenho
 */
// @ts-nocheck


// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { supabase } from "../supabase";
import { taskFiltering } from "../tasks/TaskFiltering";
import { employeeProfileEngine } from "./EmployeeProfileEngine";
import { timeTrackingEngine } from "./TimeTrackingEngine";

export interface PerformanceCorrelation {
  id: string;
  employeeId: string;
  restaurantId: string;
  periodStart: Date;
  periodEnd: Date;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  overtimeHours: number;
  lateArrivals: number;
  absences: number;
  tasksCompleted: number;
  tasksOnTime: number;
  averageTaskTime: number;
  qualityScore: number;
  correlationScore: number; // -1 a 1
  insights: Record<string, any>;
}

export class PerformanceCorrelationEngine {
  /**
   * Calcular correlação para um período
   */
  async calculateCorrelation(
    employeeId: string,
    restaurantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PerformanceCorrelation> {
    // Buscar métricas de tempo
    const timeMetrics = await timeTrackingEngine.getTotalHoursWorked(
      employeeId,
      periodStart,
      periodEnd
    );

    const daysInPeriod = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Buscar métricas de desempenho (tarefas)
    const tasks = await taskFiltering.getTasksForRole(
      restaurantId,
      "employee",
      employeeId,
      {
        dueAfter: periodStart,
        dueBefore: periodEnd,
      }
    );

    const completedTasks = tasks.filter((t) => t.status === "completed");
    const onTimeTasks = completedTasks.filter((t) => {
      if (!t.completedAt) return false;
      return t.completedAt <= t.dueAt;
    });

    // Calcular tempo médio de tarefa
    const tasksWithTime = completedTasks.filter(
      (t) => t.startedAt && t.completedAt
    );
    const averageTaskTime =
      tasksWithTime.length > 0
        ? tasksWithTime.reduce((sum, t) => {
            const duration =
              (t.completedAt!.getTime() - t.startedAt!.getTime()) / (1000 * 60);
            return sum + duration;
          }, 0) / tasksWithTime.length
        : 0;

    // Buscar perfil para quality score
    const profile = await employeeProfileEngine.get(employeeId, restaurantId);
    const qualityScore = profile?.reliabilityScore || 0.5;

    // Calcular correlação
    // Correlação negativa = mais horas = pior desempenho (fadiga)
    // Correlação positiva = mais horas = melhor desempenho (experiência)
    let correlationScore = 0;

    if (timeMetrics.totalHours > 0 && completedTasks.length > 0) {
      // Normalizar métricas
      const hoursPerTask = timeMetrics.totalHours / completedTasks.length;
      const onTimeRate =
        completedTasks.length > 0
          ? onTimeTasks.length / completedTasks.length
          : 0;

      // Correlação simples: se mais horas = mais tarefas completas e no prazo, correlação positiva
      // Se mais horas = mais atrasos, correlação negativa
      if (timeMetrics.overtimeHours > 0) {
        // Horas extras geralmente indicam fadiga = correlação negativa
        correlationScore = -0.3;
      }

      if (timeMetrics.lateArrivals > 0) {
        // Atrasos indicam problemas = correlação negativa
        correlationScore -= timeMetrics.lateArrivals * 0.1;
      }

      if (onTimeRate > 0.8 && timeMetrics.totalHours < 50) {
        // Bom desempenho com horas normais = correlação positiva
        correlationScore += 0.2;
      }

      correlationScore = Math.max(-1, Math.min(1, correlationScore));
    }

    // Gerar insights
    const insights: Record<string, any> = {
      recommendation:
        correlationScore < -0.3
          ? "Reduzir carga de trabalho - fadiga detectada"
          : correlationScore > 0.3
          ? "Aumentar responsabilidades - bom desempenho"
          : "Manter carga atual",
      optimalHours:
        timeMetrics.totalHours / daysInPeriod < 6
          ? "Aumentar horas para melhorar produtividade"
          : timeMetrics.totalHours / daysInPeriod > 10
          ? "Reduzir horas para evitar fadiga"
          : "Horas adequadas",
    };

    // Salvar correlação
    const { data, error } = await supabase
      .from("performance_correlations")
      .upsert(
        {
          employee_id: employeeId,
          restaurant_id: restaurantId,
          period_start: periodStart.toISOString().split("T")[0],
          period_end: periodEnd.toISOString().split("T")[0],
          total_hours_worked: timeMetrics.totalHours,
          average_hours_per_day: timeMetrics.totalHours / daysInPeriod,
          overtime_hours: timeMetrics.overtimeHours,
          late_arrivals: timeMetrics.lateArrivals,
          absences: timeMetrics.absences,
          tasks_completed: completedTasks.length,
          tasks_on_time: onTimeTasks.length,
          average_task_time: averageTaskTime,
          quality_score: qualityScore,
          correlation_score: correlationScore,
          insights: insights,
        },
        {
          onConflict: "employee_id,period_start,period_end",
        }
      )
      .select("*")
      .single();

    if (error) throw error;

    return this.mapToCorrelation(data);
  }

  /**
   * Buscar correlações de um funcionário
   */
  async listByEmployee(employeeId: string): Promise<PerformanceCorrelation[]> {
    const { data, error } = await supabase
      .from("performance_correlations")
      .select("*")
      .eq("employee_id", employeeId)
      .order("period_start", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToCorrelation);
  }

  private mapToCorrelation(row: any): PerformanceCorrelation {
    return {
      id: row.id,
      employeeId: row.employee_id,
      restaurantId: row.restaurant_id,
      periodStart: new Date(row.period_start),
      periodEnd: new Date(row.period_end),
      totalHoursWorked: parseFloat(row.total_hours_worked || 0),
      averageHoursPerDay: parseFloat(row.average_hours_per_day || 0),
      overtimeHours: parseFloat(row.overtime_hours || 0),
      lateArrivals: row.late_arrivals || 0,
      absences: row.absences || 0,
      tasksCompleted: row.tasks_completed || 0,
      tasksOnTime: row.tasks_on_time || 0,
      averageTaskTime: parseFloat(row.average_task_time || 0),
      qualityScore: parseFloat(row.quality_score || 0),
      correlationScore: parseFloat(row.correlation_score || 0),
      insights: row.insights || {},
    };
  }
}

export const performanceCorrelationEngine = new PerformanceCorrelationEngine();
