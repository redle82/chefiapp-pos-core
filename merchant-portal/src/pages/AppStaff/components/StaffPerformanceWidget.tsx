import React, { useEffect, useState } from "react";
import { Badge } from "../../../ui/design-system/primitives/Badge";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import styles from "./StaffPerformanceWidget.module.css";
// LEGACY / LAB — blocked in Docker mode

// LEGACY: Supabase client removed — Docker Core only
const supabase = null as any;

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
 * StaffPerformanceWidget (DEPRECATED)
 * Metrics are being migrated to Docker Core Engine.
 * This widget is temporarily disabled.
 */
export const StaffPerformanceWidget: React.FC<StaffPerformanceWidgetProps> = () => {
  return (
    <Card surface="layer1" padding="lg">
      <div className={styles.headerRow}>
        <Text size="lg" weight="bold" color="primary">
          👥 Performance da Equipa
        </Text>
        <Badge status="warning" label="Em migração" size="sm" />
      </div>

      <div className={styles.emptyState}>
        <Text size="2xl">🚧</Text>
        <Text size="sm" color="tertiary" className={styles.emptyText}>
          As métricas de performance estão a ser migradas para o novo sistema Core.
          Esta funcionalidade estará disponível em breve.
        </Text>
      </div>
    </Card>
  );
};

