import React from "react";
import "./Card.css";
import { cn } from "./tokens";

type CardSurface = "base" | "layer1" | "layer2" | "layer3";
type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
  hoverable?: boolean;
  surface?: CardSurface;
  padding?: CardPadding;
  style?: React.CSSProperties;
}

/**
 * Card: Container component for grouped content
 * Base component for OrderCard, TaskCard, ShiftCard, etc.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  elevated = false,
  hoverable = false,
  surface,
  padding = "md",
  style,
}) => {
  return (
    <div
      className={cn(
        "card",
        `card--padding-${padding}`,
        surface ? `card--surface-${surface}` : null,
        {
          "card--elevated": elevated,
          "card--clickable": onClick || hoverable,
          // Sovereign: default to a glass-like surface if not overridden
          "card--glass": !elevated && !surface,
        },
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;
