/**
 * SectionCard Component
 *
 * Card para seções de conteúdo.
 * Usado em formulários, configurações, etc.
 */

import React from "react";
import { Card } from "../../ui/design-system/Card";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASSES = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function SectionCard({
  children,
  title,
  description,
  icon,
  actions,
  className = "",
  padding = "md",
}: SectionCardProps) {
  return (
    <Card className={className}>
      {(title || actions) && (
        <div className="flex items-start justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            <div>
              {title && (
                <h3 className="font-medium text-white">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-zinc-400">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={PADDING_CLASSES[padding]}>{children}</div>
    </Card>
  );
}
