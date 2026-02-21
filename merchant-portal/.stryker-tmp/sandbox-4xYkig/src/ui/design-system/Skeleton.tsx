import React from 'react';
import { cn } from './tokens';
import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

/**
 * Skeleton: Loading placeholder
 * - Variants: text (lines), circular (avatar), rectangular, card
 * - Animated shimmer effect
 * - Respects dark/light mode
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('skeleton-lines', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton--text"
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : '100%', // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('skeleton', `skeleton--${variant}`, className)}
      style={style}
    />
  );
};

/**
 * SkeletonCard: Pre-built card loading state
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('skeleton-card', className)}>
      <Skeleton variant="rectangular" height={120} />
      <div className="skeleton-card__content">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" lines={2} />
        <div className="skeleton-card__footer">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonKpi: KPI card loading state
 */
export const SkeletonKpi: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('skeleton-kpi', className)}>
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="50%" height={12} />
    </div>
  );
};

export default Skeleton;
