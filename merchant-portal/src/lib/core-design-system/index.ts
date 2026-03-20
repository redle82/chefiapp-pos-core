/**
 * @chefiapp/core-design-system
 *
 * Tokens globais (imutáveis) para todos os terminais ChefIApp.
 * Subordinado ao Core e a docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md.
 *
 * Uso:
 *   import { colors, spacing, typography } from '@chefiapp/core-design-system';
 *   import '@chefiapp/core-design-system/tokens.css';
 *
 * Componentes (Button, Card, Panel, List, StatusBadge, Modal, Input,
 * LoadingState, EmptyState, ErrorState, OfflineState) são definidos pelo
 * contrato e implementados em merchant-portal e mobile-app usando estes tokens.
 */

export { colors, radius, elevation, stateVisual, tapTarget, darkFirst, timeVisual } from './tokens';
export type { Colors, Radius, Elevation, StateVisual, TapTarget, DarkFirst, TimeVisual } from './tokens';

export { duration, easing, motion } from './motion';
export type { Duration, Easing, Motion } from './motion';

export { fontFamily, fontWeight, fontSize, lineHeight } from './typography';
export type { FontFamily, FontWeight, FontSize, LineHeight } from './typography';

export { spacing, space, tapTargetPx, stressSafe } from './spacing';
export type { Spacing, Space, StressSafe } from './spacing';

export { CONTRACT_COMPONENTS, type ContractComponentName } from './components';
export { CONTRACT_STATES, OPERATIONAL_STATES, type ContractStateName, type OperationalStateName } from './states';
