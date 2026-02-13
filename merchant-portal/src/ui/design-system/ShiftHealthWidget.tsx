import React from "react";
import type { ShiftMetrics } from "../../intelligence/nervous-system/ShiftEngine";
import { Card } from "./Card";
import { Text } from "./primitives/Text";
import styles from "./ShiftHealthWidget.module.css";
import { colors } from "./tokens/colors";

interface ShiftHealthWidgetProps {
  metrics: ShiftMetrics;
}

export const ShiftHealthWidget: React.FC<ShiftHealthWidgetProps> = ({
  metrics,
}) => {
  const { status, loadIndex, activeStaff, activeTasks } = metrics;

  let toneColor = colors.success.base;
  let label = "Turno Saudável";

  if (status === "yellow") {
    toneColor = colors.warning.base;
    label = "Atenção";
  } else if (status === "red") {
    toneColor = colors.error.base;
    label = "Sobrecarga";
  }

  return (
    <Card
      surface="layer1"
      padding="sm"
      className={styles.card}
      style={{ "--tone-color": toneColor } as React.CSSProperties}
    >
      <div className={styles.content}>
        <div>
          <Text size="xs" color="tertiary">
            CARGA HUMANA
          </Text>
          <Text size="lg" weight="bold" className={styles.loadValue}>
            {loadIndex}{" "}
            <span className={styles.loadDetail}>
              ({activeTasks}/{activeStaff})
            </span>
          </Text>
        </div>
        <div className={styles.statusSection}>
          <div className={styles.statusDot} />
          <Text size="sm" weight="medium">
            {label}
          </Text>
        </div>
      </div>
    </Card>
  );
};
