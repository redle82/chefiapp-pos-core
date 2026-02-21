/**
 * Design System Index — Phase 1 Hardening
 *
 * Exports all tokens and components for use throughout the application.
 *
 * Usage:
 *   import { Colors, Brand, AppShell } from '@/ui/design-system';
 *
 * CSS Variables:
 *   Import tokens.css in your entry point for CSS custom properties.
 */
// @ts-nocheck


// Tokens
export {
  // Brand
  Brand,
  // Colors
  Colors,
  Opacity,
  // Typography
  Typography,
  // Spacing & Layout
  Spacing,
  BorderRadius,
  Breakpoints,
  MediaQueries,
  // Effects
  Elevation,
  Transitions,
  ZIndex,
  // Components
  ComponentTokens,
  // Utilities
  getCSSVariables,
  cn,
  // Migration helpers
  LegacyColorMap,
} from './tokens';

// Layout Components
export { AppShell } from './AppShell';
export { TopBar } from './TopBar';
export { SideNav } from './SideNav';
export { MobileNav } from './MobileNav';

// Primitives (Card, Button, Input used by BootstrapPage and others)
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';

// Data Display Components
export { TruthBadge } from './TruthBadge';
export { Stepper } from './Stepper';
export { RiskChip } from './RiskChip';
export { EmptyState } from './EmptyState';
export { KpiCard } from './KpiCard';
export { InsightCard } from './InsightCard';
export { DateRangeSelector } from './DateRangeSelector';
export { OrderCard } from './OrderCard';

// Feedback Components
export { Toast, ToastContainer, useToast } from './Toast';
export { InlineAlert } from './InlineAlert';
export { Skeleton, SkeletonCard, SkeletonKpi } from './Skeleton';
export { CoreStatusBanner } from './CoreStatusBanner';

// AppStaff Components
export { TaskCard } from './TaskCard';
export { ShiftCard } from './ShiftCard';

// Export all together as namespace
import * as DesignSystem from './tokens';

export default {
  ...DesignSystem,
};
