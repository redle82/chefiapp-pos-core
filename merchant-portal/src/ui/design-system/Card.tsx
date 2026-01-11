import React from 'react';
import { cn } from './tokens';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
  padding?: 'sm' | 'md' | 'lg';
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
  padding = 'md',
  style,
}) => {
  return (
    <div
      className={cn(
        'card',
        `card--padding-${padding}`,
        {
          'card--elevated': elevated,
          'card--clickable': onClick,
          // Sovereign: default to a glass-like surface if not overridden
          'card--glass': !elevated
        },
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;
