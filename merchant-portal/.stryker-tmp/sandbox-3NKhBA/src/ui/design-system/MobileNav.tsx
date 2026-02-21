// @ts-nocheck
import React from 'react';
import { cn } from './tokens';
import './MobileNav.css';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

interface MobileNavProps {
  items: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * MobileNav: Bottom navigation bar for mobile
 * - Fixed at bottom of viewport
 * - Max 5 items (iOS/Android convention)
 * - Touch-friendly targets (44px min)
 * - Badge support for notifications
 */
export const MobileNav: React.FC<MobileNavProps> = ({
  items,
  activeId,
  onSelect,
  className,
}) => {
  // Limit to 5 items max
  const visibleItems = items.slice(0, 5);

  return (
    <nav className={cn('mobilenav', className)}>
      {visibleItems.map((item) => {
        const isActive = item.id === activeId;

        return (
          <a
            key={item.id}
            href={item.href}
            className={cn('mobilenav__item', isActive && 'mobilenav__item--active')}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
              onSelect?.(item.id);
            }}
          >
            <span className="mobilenav__icon">
              {item.icon}
              {item.badge && (
                <span className="mobilenav__badge">{item.badge}</span>
              )}
            </span>
            <span className="mobilenav__label">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

export default MobileNav;
