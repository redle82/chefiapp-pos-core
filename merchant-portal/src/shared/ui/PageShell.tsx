/**
 * PageShell Component
 *
 * Container padrão para páginas.
 * Fornece padding, max-width e estrutura consistente.
 */

import React from "react";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const MAX_WIDTH_CLASSES = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function PageShell({
  children,
  title,
  subtitle,
  actions,
  className = "",
  maxWidth = "lg",
}: PageShellProps) {
  return (
    <div className={`mx-auto px-4 py-6 ${MAX_WIDTH_CLASSES[maxWidth]} ${className}`}>
      {(title || actions) && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
