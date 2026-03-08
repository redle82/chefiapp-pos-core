# Shared

> Código compartilhado entre features — UI primitives, utils, tipos base.

## Estrutura

```
shared/
├── ui/           # Primitives de UI (componentes base)
├── utils/        # Utilitários puros (formatação, helpers)
└── types/        # Tipos TypeScript base
```

## ui/

Componentes de UI reutilizáveis, sem lógica de negócio:

- `EmptyState` — Estado vazio com ação
- `LoadingState` — Estados de loading (skeleton, spinner)
- `Badge` — Badges de status
- `Button` — Botão base
- `Card` — Card container
- `Text` — Tipografia
- `Select` — Select input
- `Skeleton` — Placeholder de loading
- `Stepper` — Indicador de passos

### Uso

```typescript
import { EmptyState, LoadingState, Badge } from '@shared/ui';

function MyComponent() {
  if (loading) return <LoadingState variant="skeleton" />;
  if (items.length === 0) return <EmptyState title="Sem itens" />;
  return <Badge tone="success">Ativo</Badge>;
}
```

## utils/

Funções utilitárias puras:

- Formatação de datas
- Formatação de moeda
- Helpers de string
- Validadores genéricos

### Regras

- Sem side effects
- Sem dependências de React
- Testáveis isoladamente

## types/

Tipos TypeScript compartilhados:

- Tipos de API
- Tipos de UI
- Tipos utilitários

### Exemplo

```typescript
// shared/types/api.ts
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// shared/types/ui.ts
export type Tone = 'neutral' | 'action' | 'success' | 'warning' | 'danger';
export type Size = 'sm' | 'md' | 'lg';
```

## Imports

Use aliases para imports limpos:

```typescript
// tsconfig paths
"@shared/*": ["src/shared/*"]

// Uso
import { EmptyState } from '@shared/ui';
import { formatCurrency } from '@shared/utils';
import type { ApiResponse } from '@shared/types';
```
