// @ts-nocheck
import React from "react";
import { Button } from "./Button";
import "./EmptyState.css";
import { OSCopy } from "./sovereign/OSCopy";
import { cn } from "./tokens";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  /**
   * Sovereign Mode: automatically fills title/description from OSCopy.
   */
  mode?: keyof typeof OSCopy.emptyStates;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

/**
 * EmptyState: The Void of the System.
 *
 * Rules:
 * - If 'mode' is provided, it dictates the copy.
 * - If no title/desc provided, falls back to 'generic' void.
 * - Actions use the Sovereign Button.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  mode,
  action,
  secondaryAction,
  className,
  children,
}) => {
  // 1. Resolve Sovereign Text
  const systemCopy = mode
    ? OSCopy.emptyStates[mode]
    : OSCopy.emptyStates.generic;

  const resolvedTitle =
    "title" in systemCopy ? systemCopy.title : systemCopy.titulo;
  const resolvedDescription =
    "description" in systemCopy ? systemCopy.description : systemCopy.descricao;

  // 2. Final Text (Prop overrides system)
  const finalTitle = title || resolvedTitle;
  const finalDesc = description || resolvedDescription;

  return (
    <div className={cn("empty-state", className)}>
      <div className="empty-state__icon">
        {icon || <span style={{ fontSize: 48, opacity: 0.2 }}>∅</span>}
      </div>

      <h3 className="empty-state__title">{finalTitle}</h3>
      <p className="empty-state__description">{finalDesc}</p>

      <div className="empty-state__actions">
        {action && (
          <Button
            variant="primary"
            onClick={action.onClick}
            className="empty-state__action"
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="secondary"
            onClick={secondaryAction.onClick}
            className="empty-state__action"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default EmptyState;
