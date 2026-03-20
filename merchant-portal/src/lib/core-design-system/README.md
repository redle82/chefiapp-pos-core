# @chefiapp/core-design-system

**Fonte única de tokens** (cores, tipografia, espaçamento, motion, tap targets) para todos os terminais ChefIApp: Landing, Web Pública, Web Operacional, AppStaff, KDS, TPV.

- **Contrato:** [CORE_DESIGN_SYSTEM_CONTRACT.md](../docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md)
- **Princípios Restaurant OS:** [RESTAURANT_OS_DESIGN_PRINCIPLES.md](../docs/architecture/RESTAURANT_OS_DESIGN_PRINCIPLES.md)
- **Regra:** Core decide. Contratos autorizam. Design System revela.
- **Subordinado a:** CORE_OPERATIONAL_UI_CONTRACT, Shells (OperationalShell).

## Uso

```ts
import { colors, spacing, fontFamily, fontSize, motion, tapTarget } from '@chefiapp/core-design-system';
import '@chefiapp/core-design-system/tokens.css';
```

## Conteúdo

- **tokens.ts** — cores, radius, elevation, stateVisual, tapTarget (44–48px)
- **typography.ts** — fontFamily, fontWeight, fontSize (incl. display para KDS/TPV), lineHeight
- **spacing.ts** — spacing, space (base 4px), tapTargetPx
- **motion.ts** — duration, easing, motion (mínimo; apenas feedback)
- **tokens.css** — CSS custom properties (--ds-*)
- **components/** — lista contratual (Button, Card, Panel, List, StatusBadge, Modal, Input); implementação em merchant-portal e mobile-app
- **states/** — lista contratual (LoadingState, EmptyState, ErrorState, OfflineState); implementação em merchant-portal e mobile-app

## Aplicação por terminal

| Terminal | Onde aplicar |
|----------|--------------|
| merchant-portal (Landing, Web Pública, Command Center) | Importar tokens; Shell aplica VPC; painéis usam componentes que consomem estes tokens |
| mobile-app (AppStaff) | Mapear tokens para React Native (StyleSheet); componentes nativos com valores do core-design-system |

Nenhum terminal define cores globais ou font-size arbitrário fora destes tokens.
