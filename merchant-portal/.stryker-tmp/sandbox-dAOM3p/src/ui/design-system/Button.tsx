// @ts-nocheck
import React from "react";
import "./Button.css";
import type { FireState } from "./sovereign/FireSystem";
import { cn } from "./tokens";

type ButtonTone =
  | "action"
  | "warning"
  | "destructive"
  | "neutral"
  | "info"
  | "success";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "critical"
  | "constructive"
  | "outline"
  | "warning"
  | "info"
  | "neutral"
  | "solid";

type ButtonSize = "sm" | "md" | "lg" | "xl" | "default";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 'outline' is alias for 'secondary'
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fireContext?: FireState;
}

/**
 * Button: The Sovereign Interaction Primitive
 *
 * Variants:
 * - primary: Gold/Brand
 * - secondary (or outline): Neutral/Glass
 * - ghost: Text only
 * - critical: OS RED
 * - constructive: Green
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      tone,
      size = "md",
      fullWidth = false,
      loading,
      isLoading,
      icon,
      children,
      className,
      disabled,
      fireContext: _fireContext,
      ...props
    },
    ref,
  ) => {
    const resolvedLoading = Boolean(isLoading ?? loading);

    const resolveVariant = (): Exclude<ButtonVariant, "solid"> => {
      const hasExplicitVariant =
        variant && variant !== "solid" && variant !== "primary";

      if (hasExplicitVariant) {
        return variant === "neutral" ? "secondary" : variant;
      }

      if (tone) {
        const toneMap: Record<ButtonTone, Exclude<ButtonVariant, "solid">> = {
          action: "primary",
          warning: "warning",
          destructive: "critical",
          neutral: "secondary",
          info: "info",
          success: "constructive",
        };

        return toneMap[tone];
      }

      return "primary";
    };

    const resolvedVariant = resolveVariant();
    const resolvedSize = size === "default" ? "md" : size;

    const buttonProps = {
      ref,
      className: cn(
        "button",
        `button--${resolvedVariant}`,
        `button--${resolvedSize}`,
        {
          "button--full-width": fullWidth,
          "button--loading": resolvedLoading,
        },
        className,
      ),
      disabled: disabled || resolvedLoading,
      ...props,
    };

    return resolvedLoading ? (
      <button {...buttonProps} aria-busy="true">
        {resolvedLoading && <span className="button__spinner" />}
        {icon && !resolvedLoading && (
          <span className="button__icon">{icon}</span>
        )}
        <span className="button__content">{children}</span>
      </button>
    ) : (
      <button {...buttonProps} aria-busy="false">
        {resolvedLoading && <span className="button__spinner" />}
        {icon && !resolvedLoading && (
          <span className="button__icon">{icon}</span>
        )}
        <span className="button__content">{children}</span>
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
