/**
 * RitualScreen — Ceremonial full-screen layout
 *
 * Used for access-denied, onboarding rituals, and other "moment" screens.
 */
// @ts-nocheck

import React from "react";
import styles from "./RitualScreen.module.css";

interface RitualAction {
  label: string;
  onClick: () => void;
}

interface RitualScreenProps {
  id: string;
  title: string;
  subtitle?: string;
  primaryAction?: RitualAction;
  secondaryAction?: RitualAction;
  children?: React.ReactNode;
}

export const RitualScreen: React.FC<RitualScreenProps> = ({
  title,
  subtitle,
  primaryAction,
  children,
}) => {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className={styles.primaryButton}
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  );
};
