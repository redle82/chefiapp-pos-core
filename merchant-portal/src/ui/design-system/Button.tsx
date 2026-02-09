import React from "react";
import "./Button.css";
import type { FireState } from "./sovereign/FireSystem";
import { cn } from "./tokens";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 'outline' is alias for 'secondary'
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "critical"
    | "constructive"
    | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
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
      size = "md",
      fullWidth = false,
      loading = false,
      children,
      className,
      disabled,
      fireContext: _fireContext,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "button",
          `button--${variant}`,
          `button--${size}`,
          {
            "button--full-width": fullWidth,
            "button--loading": loading,
          },
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <span className="button__spinner" />}
        <span className="button__content">{children}</span>
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
