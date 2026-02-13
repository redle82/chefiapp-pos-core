import React, { useMemo } from "react";
import { now as getNow } from "../../../intelligence/nervous-system/Clock";
import { StaffLayout } from "../../../ui/design-system/layouts/StaffLayout";
import { Badge } from "../../../ui/design-system/primitives/Badge";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";
import type { LatentObligation } from "../context/StaffCoreTypes";
import styles from "./ManagerCalendarView.module.css";

// ------------------------------------------------------------------
// 📅 CÉREBRO EXECUTIVO (Calendar View)
// ------------------------------------------------------------------

const CalendarCard: React.FC<{
  obligation: LatentObligation;
  status: "overdue" | "today" | "future";
}> = ({ obligation, status }) => {
  const surface = status === "future" ? "layer1" : "layer2";
  const borderColor =
    status === "overdue"
      ? colors.destructive.base
      : status === "today"
      ? colors.warning.base
      : colors.border.subtle;

  return (
    <Card
      surface={surface}
      padding="md"
      className={styles.card}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className={styles.cardContent}>
        <div>
          <div className={styles.metaRow}>
            <Text
              size="xs"
              weight="bold"
              color="tertiary"
              className={styles.metaLabel}
            >
              {obligation.type} • {obligation.sourceId}
            </Text>
          </div>
          <Text size="lg" weight="bold" color="primary">
            {obligation.title}
          </Text>
          <Text size="sm" color="secondary">
            {obligation.description}
          </Text>
        </div>
        <div className={styles.criticalitySection}>
          <Text size="xs" color="tertiary" className={styles.criticalityLabel}>
            CRITICALITY
          </Text>
          <Badge
            status={
              obligation.criticality === "high"
                ? "error"
                : obligation.criticality === "medium"
                ? "warning"
                : "neutral"
            }
            label={obligation.criticality.toUpperCase()}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
};

export const ManagerCalendarView: React.FC = () => {
  const { activeWorkerId, activeRole, obligations } = useStaff();
  const now = getNow();

  const { overdue, today, future } = useMemo(() => {
    const result = {
      overdue: [] as LatentObligation[],
      today: [] as LatentObligation[],
      future: [] as LatentObligation[],
    };

    obligations?.forEach((ob) => {
      if (ob.status === "fulfilled" || ob.status === "expired") return;

      if (ob.validUntil < now) {
        result.overdue.push(ob);
      } else if (ob.validFrom <= now && ob.validUntil >= now) {
        result.today.push(ob);
      } else if (ob.validFrom > now) {
        result.future.push(ob);
      }
    });

    return result;
  }, [obligations, now]);

  return (
    <StaffLayout
      title="Time Horizon"
      userName={activeWorkerId || "Manager"}
      role={activeRole}
      status="active"
    >
      <div className={styles.page}>
        {/* OVERDUE */}
        {overdue.length > 0 && (
          <div className="animate-pulse">
            <div className={styles.sectionHeader}>
              <Text
                size="sm"
                weight="bold"
                color="destructive"
                className={styles.sectionTitle}
              >
                ⚠️ Attention Needed
              </Text>
            </div>
            {overdue.map((ob) => (
              <CalendarCard key={ob.id} obligation={ob} status="overdue" />
            ))}
          </div>
        )}

        {/* TODAY */}
        <div>
          <Text
            size="sm"
            weight="bold"
            color="warning"
            className={styles.sectionTitleSpaced}
          >
            Active Window (Now)
          </Text>
          {today.length === 0 ? (
            <div className={styles.emptyState}>
              <Text size="sm" color="tertiary">
                No active obligations for today.
              </Text>
            </div>
          ) : (
            today.map((ob) => (
              <CalendarCard key={ob.id} obligation={ob} status="today" />
            ))
          )}
        </div>

        {/* FUTURE */}
        <div>
          <Text
            size="sm"
            weight="bold"
            color="tertiary"
            className={styles.sectionTitleSpaced}
          >
            Horizon
          </Text>
          {future.map((ob) => (
            <CalendarCard key={ob.id} obligation={ob} status="future" />
          ))}
        </div>
      </div>
    </StaffLayout>
  );
};
