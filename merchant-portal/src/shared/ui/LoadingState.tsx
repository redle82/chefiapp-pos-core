/**
 * LoadingState Component
 *
 * Componente para estados de carregamento.
 * Variantes: spinner, skeleton, dots.
 */

import React from "react";
import { Skeleton } from "../../ui/design-system/primitives";

export type LoadingVariant = "spinner" | "skeleton" | "dots";

interface LoadingStateProps {
  variant?: LoadingVariant;
  message?: string;
  className?: string;
  lines?: number;
}

export function LoadingState({
  variant = "spinner",
  message,
  className = "",
  lines = 3,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={16} width="100%" />
        ))}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        <span className="animate-bounce delay-0 h-2 w-2 rounded-full bg-current" />
        <span className="animate-bounce delay-100 h-2 w-2 rounded-full bg-current" />
        <span className="animate-bounce delay-200 h-2 w-2 rounded-full bg-current" />
        {message && <span className="ml-2 text-sm">{message}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </div>
  );
}
