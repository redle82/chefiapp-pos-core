/**
 * Componentes definidos pelo CORE_DESIGN_SYSTEM_CONTRACT.
 *
 * Implementação: merchant-portal/src/ui/design-system e mobile-app
 * devem fornecer Button, Card, Panel, List, StatusBadge, Modal, Input
 * usando tokens de @chefiapp/core-design-system.
 *
 * Este módulo não exporta React components; exporta apenas a lista contratual
 * e tipos mínimos para referência.
 */

export const CONTRACT_COMPONENTS = [
  'Button',
  'Card',
  'Panel',
  'List',
  'StatusBadge',
  'Modal',
  'Input',
] as const;

export type ContractComponentName = (typeof CONTRACT_COMPONENTS)[number];
