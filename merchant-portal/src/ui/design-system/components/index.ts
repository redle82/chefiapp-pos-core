/**
 * ChefIApp Design System — Component Library
 *
 * Shared components with consistent dark theme styling.
 * Use these instead of hardcoded inline styles.
 *
 * Usage:
 *   import { DSButton, DSCard, DSBadge, DSInput, DSModal } from "@/ui/design-system/components";
 */

// Primitives
export { DSButton } from "./DSButton";
export type { DSButtonVariant, DSButtonSize } from "./DSButton";

export { DSCard } from "./DSCard";
export type { DSCardPadding } from "./DSCard";

export { DSBadge } from "./DSBadge";
export type { DSBadgeVariant, DSBadgeSize } from "./DSBadge";

export { DSInput } from "./DSInput";

export { DSModal } from "./DSModal";

// Composites
export { DSKpiCard } from "./DSKpiCard";
export { DSPageHeader } from "./DSPageHeader";

// State views

export { LoadingState, useLoadingState } from "./LoadingState";
export type { LoadingStateProps, LoadingStateVariant } from "./LoadingState";

export { GlobalLoadingView } from "./GlobalLoadingView";
export type { GlobalLoadingViewProps, GlobalLoadingLayout } from "./GlobalLoadingView";

export { GlobalEmptyView } from "./GlobalEmptyView";
export type { GlobalEmptyViewProps, GlobalEmptyLayout } from "./GlobalEmptyView";

export { GlobalErrorView } from "./GlobalErrorView";
export type { GlobalErrorViewProps, GlobalErrorLayout } from "./GlobalErrorView";

export { GlobalBlockedView } from "./GlobalBlockedView";
export type { GlobalBlockedViewProps } from "./GlobalBlockedView";
