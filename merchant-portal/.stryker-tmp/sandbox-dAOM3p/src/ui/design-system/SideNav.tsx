// @ts-nocheck
import React from 'react';
import { cn } from './tokens';
import './SideNav.css';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  active?: boolean;
}

interface SideNavProps {
  items: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  collapsed?: boolean;
  className?: string;
}

/**
 * SideNav: Desktop sidebar navigation
 * - Collapsible (icons only or full labels)
 * - Active state with accent color
 * - Badge support for notifications
 * - Touch-friendly tap targets (44px min)
 */
export const SideNav: React.FC<SideNavProps> = ({
  items,
  activeId,
  onSelect,
  collapsed = false,
  className,
}) => {
  return (
    <nav className={cn('sidenav', collapsed && 'sidenav--collapsed', className)}>
      <ul className="sidenav__list">
        {items.map((item) => {
          const isActive = item.active || item.id === activeId;

          return (
            <li key={item.id} className="sidenav__item">
              <a
                href={item.href}
                className={cn('sidenav__link', isActive && 'sidenav__link--active')}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                  onSelect?.(item.id);
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidenav__icon">{item.icon}</span>
                {!collapsed && (
                  <span className="sidenav__label">{item.label}</span>
                )}
                {item.badge && (
                  <span className="sidenav__badge">{item.badge}</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SideNav;
