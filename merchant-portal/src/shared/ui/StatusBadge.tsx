/**
 * StatusBadge Component
 *
 * Badge para indicar status de entidades.
 * Mapeia status para cores automaticamente.
 */

import { useTranslation } from "react-i18next";
import {
  Badge,
  type BadgeStatus,
} from "../../ui/design-system/primitives/Badge";

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "warning"
  | "error"
  | "info";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { badgeStatus: BadgeStatus; i18nKey: string }
> = {
  active: { badgeStatus: "success", i18nKey: "common:status.active" },
  inactive: { badgeStatus: "neutral", i18nKey: "common:status.inactive" },
  pending: { badgeStatus: "warning", i18nKey: "common:status.pending" },
  success: { badgeStatus: "success", i18nKey: "common:status.success" },
  warning: { badgeStatus: "warning", i18nKey: "common:status.warning" },
  error: { badgeStatus: "error", i18nKey: "common:status.error" },
  info: { badgeStatus: "info", i18nKey: "common:status.info" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  return (
    <Badge status={config.badgeStatus} label={label || t(config.i18nKey)} />
  );
}
