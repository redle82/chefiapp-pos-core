/**
 * Shared UI Primitives
 *
 * Componentes base reutilizáveis.
 * Re-exporta do design-system para centralizar imports.
 */

// Primitives do design-system
export {
  Badge,
  EmptyState,
  Select,
  Skeleton,
  Stepper,
  Text,
  Button,
  Card,
  Input,
} from "../../ui/design-system/primitives";

// Componentes de estado do design-system
export { ErrorBoundary } from "../../ui/design-system/ErrorBoundary";
export { InlineAlert } from "../../ui/design-system/InlineAlert";
export { Toast } from "../../ui/design-system/Toast";

// Layouts
export { AppShell } from "../../ui/design-system/AppShell";
export { TopBar } from "../../ui/design-system/TopBar";
export { SideNav } from "../../ui/design-system/SideNav";
export { MobileNav } from "../../ui/design-system/MobileNav";

// Componentes shared/ui novos
export { LoadingState } from "./LoadingState";
export { StatusBadge } from "./StatusBadge";
export { PageShell } from "./PageShell";
export { SectionCard } from "./SectionCard";
export { ModalShell } from "./ModalShell";

// Tipos comuns de UI
export type { BadgeStatus, BadgeVariant, BadgeSize } from "../../ui/design-system/primitives/Badge";
export type { LoadingVariant } from "./LoadingState";
export type { StatusType } from "./StatusBadge";
