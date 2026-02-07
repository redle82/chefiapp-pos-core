import React, { useEffect, useState } from "react";
import { Badge } from "../../../ui/design-system/primitives/Badge";
import { Card } from "../../../ui/design-system/primitives/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
// LEGACY / LAB — blocked in Docker mode
import { db } from "../../../core/db";

interface StaffPerformance {
  employeeId: string;
  employeeName: string;
  role: string;
  shiftsCount: number;
  totalMinutes: number;
  actionsCount: number;
  avgActionsPerHour: number;
}

interface StaffPerformanceWidgetProps {
  restaurantId: string;
  daysBack?: number; // Default: 7 days
}

/**
 * StaffPerformanceWidget
 * Phase 4: Owner's Insight
 * Displays staff performance metrics based on shift_logs and action_logs.
 */
export const StaffPerformanceWidget: React.FC<StaffPerformanceWidgetProps> = ({
  restaurantId,
  daysBack = 7,
}) => {
  const [performance, setPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchPerformance = async () => {
      setLoading(true);

      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      // Fetch completed shifts with employee info
      const { data: shifts, error: shiftsError } = await supabase
        .from("shift_logs")
        .select(
          `
                    id,
                    employee_id,
                    role,
                    duration_minutes,
                    status,
                    employees ( name )
                `
        )
        .eq("restaurant_id", restaurantId)
        .eq("status", "completed")
        .gte("start_time", since.toISOString());

      if (shiftsError) {
        console.error("Failed to fetch shifts:", shiftsError);
        setLoading(false);
        return;
      }

      // Fetch action counts per shift
      const shiftIds = (shifts || []).map((s: any) => s.id);
      const { data: actions, error: actionsError } = await supabase
        .from("action_logs")
        .select("shift_id")
        .in("shift_id", shiftIds.length > 0 ? shiftIds : ["none"]);

      if (actionsError) {
        console.error("Failed to fetch actions:", actionsError);
      }

      // Aggregate by employee
      const employeeMap = new Map<string, StaffPerformance>();

      (shifts || []).forEach((shift: any) => {
        const empId = shift.employee_id;
        const existing = employeeMap.get(empId) || {
          employeeId: empId,
          employeeName: shift.employees?.name || "Desconhecido",
          role: shift.role,
          shiftsCount: 0,
          totalMinutes: 0,
          actionsCount: 0,
          avgActionsPerHour: 0,
        };

        existing.shiftsCount++;
        existing.totalMinutes += shift.duration_minutes || 0;

        // Count actions for this shift
        const shiftActions = (actions || []).filter(
          (a: any) => a.shift_id === shift.id
        );
        existing.actionsCount += shiftActions.length;

        employeeMap.set(empId, existing);
      });

      // Calculate avg actions per hour
      const result = Array.from(employeeMap.values()).map((emp) => ({
        ...emp,
        avgActionsPerHour:
          emp.totalMinutes > 0
            ? Math.round((emp.actionsCount / (emp.totalMinutes / 60)) * 10) / 10
            : 0,
      }));

      // Sort by actions per hour (descending)
      result.sort((a, b) => b.avgActionsPerHour - a.avgActionsPerHour);

      setPerformance(result);
      setLoading(false);
    };

    fetchPerformance();
  }, [restaurantId, daysBack]);

  const getRoleEmoji = (role: string) => {
    const emojis: Record<string, string> = {
      waiter: "🍽️",
      kitchen: "👨‍🍳",
      bar: "🍹",
      manager: "🧑‍💼",
      runner: "🏃",
      cleaner: "🧹",
    };
    return emojis[role] || "👤";
  };

  const getPerformanceBadge = (avgActions: number) => {
    if (avgActions >= 5)
      return { status: "ready" as const, label: "⭐ Excelente" };
    if (avgActions >= 3) return { status: "warning" as const, label: "Bom" };
    if (avgActions >= 1)
      return { status: "warning" as const, label: "Regular" };
    return { status: "error" as const, label: "Baixo" };
  };

  if (loading) {
    return (
      <Card surface="layer1" padding="lg">
        <Text size="sm" color="tertiary">
          A carregar performance...
        </Text>
      </Card>
    );
  }

  return (
    <Card surface="layer1" padding="lg">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text size="lg" weight="bold" color="primary">
          👥 Performance da Equipa
        </Text>
        <Badge status="ready" label={`Últimos ${daysBack} dias`} size="sm" />
      </div>

      {performance.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Text size="2xl">📊</Text>
          <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>
            Sem dados de turnos completados.
          </Text>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {performance.map((emp, idx) => {
            const badge = getPerformanceBadge(emp.avgActionsPerHour);
            return (
              <div
                key={emp.employeeId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor:
                    idx === 0
                      ? `${colors.success.base}15`
                      : colors.surface.layer2,
                  borderRadius: 8,
                  border:
                    idx === 0 ? `1px solid ${colors.success.base}40` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>
                    {idx === 0 ? "🏆" : getRoleEmoji(emp.role)}
                  </span>
                  <div>
                    <Text size="md" weight="bold" color="primary">
                      {emp.employeeName}
                    </Text>
                    <Text size="xs" color="secondary">
                      {emp.shiftsCount} turnos •{" "}
                      {Math.round(emp.totalMinutes / 60)}h trabalhadas
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text size="lg" weight="black" color="action">
                    {emp.avgActionsPerHour}
                  </Text>
                  <Text size="xs" color="tertiary">
                    ações/hora
                  </Text>
                  <Badge status={badge.status} label={badge.label} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
