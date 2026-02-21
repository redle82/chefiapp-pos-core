# Core — Sistema Imutável de Verdade (4 Cores Fechados)

**Este módulo implementa os 4 cores do ChefIApp Web Module.**

> ⚠️ **ESTE SISTEMA ESTÁ FECHADO**  
> Existem exatamente 4 cores. Não mais. Não menos.  
> Ver [CORE_ARCHITECTURE.md](../../../../CORE_ARCHITECTURE.md) para detalhes.

---

## Os 4 Cores

### CORE 1: Ontológico
**"O que existe / não existe no sistema"**

```typescript
entity: {
  exists: boolean
  identityConfirmed: boolean
  menuDefined: boolean
  paymentConfigured: boolean
  published: boolean
}
```

### CORE 2: Capacidades
**"O que é permitido fazer agora"**

```typescript
capabilities: {
  canPreview: boolean
  canReceiveOrders: boolean
  canUseTPV: boolean
  canAccessPublicPage: boolean
}
```

### CORE 3: Psicológico
**"O que o utilizador acredita que está a acontecer"**

```typescript
psychological: {
  previewState: 'none' | 'ghost' | 'live'
  previewIsReal: boolean
  backendIsLive: boolean
  urlExists: boolean
}
```

### CORE 4: Contratos Web
**"O que uma página pode ou não prometer"**

```typescript
contract: {
  requires?: { identityConfirmed?: boolean, ... }
  guarantees?: { doesNotPromisePreview?: boolean, ... }
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>
}
```

---

Historicamente, páginas web foram pensadas como **documentos** ou **views**, não como **sistemas de estado**.

Sem um core imutável, cada página:
- Infere estado (em vez de consultar)
- Cria verdades implícitas (conflitos semânticos)
- Promete capacidades antes de existirem (bugs psicológicos)

**Resultado:** A UX perde centro de gravidade.

## Princípios

1. **Páginas nunca inferem**  
   Páginas consultam `useWebCore()`, nunca lêem `localStorage` diretamente.

2. **Páginas nunca prometem**  
   Se o core diz `canPreview: false`, a página não mostra preview.

3. **Páginas nunca decidem tempo**  
   "Preview aparece após identidade" → o core decide, não a página.

4. **Páginas nunca interpretam ausência como erro**  
   `previewState: 'ghost'` é um estado legítimo, não um fallback.

## Estrutura

```
core/
├── WebCoreState.ts      # Core ontológico: entity, capabilities, truth
├── useWebCore.tsx       # React hook para consultar o core
├── PageContracts.ts     # Contratos imutáveis de cada página
└── index.ts             # Barrel export
```

## API

### `useWebCore()`

Hook para consultar o core. Retorna `WebCoreState`:

```tsx
const core = useWebCore()

// Verdades ontológicas
core.entity.exists              // boolean
core.entity.identityConfirmed   // boolean
core.entity.published           // boolean

// Capacidades reais
core.capabilities.canPreview    // boolean
core.capabilities.canUseTPV     // boolean

// Verdades sobre o sistema
core.truth.previewIsReal        // preview aponta para dados reais?
core.truth.backendIsLive        // backend está acessível?
core.truth.urlExists            // slug publicado e acessível?

// Estado psicológico (nunca inferido)
core.previewState               // 'none' | 'ghost' | 'live'
```

### Exemplo: Página que consulta o core

**❌ Antes (infere estado):**

```tsx
export function PreviewPage() {
  const slug = localStorage.getItem('slug')
  
  if (!slug) {
    return <div>Sem preview ainda</div>
  }
  
  return <iframe src={`/public/${slug}`} />
}
```

**✅ Depois (consulta core):**

```tsx
export function PreviewPage() {
  const core = useWebCore()
  
  if (!core.capabilities.canPreview) {
    return <div>Preenche a identidade primeiro</div>
  }
  
  const label = core.previewState === 'live' ? 'Página ao vivo' : 'Preview'
  
  return <iframe src={`/public/${slug}`} />
}
```

### Page Contracts

Cada página declara o que precisa antes de renderizar:

```tsx
export const PAGE_CONTRACTS: Record<string, PageContract> = {
  '/app/preview': {
    requires: {
      identityConfirmed: true,
    },
    guarantees: {
      doesNotInferState: true,
    },
    allowedPreviewStates: ['ghost', 'live'],
  },
  
  '/app/tpv-ready': {
    requires: {
      published: true,
      menuDefined: true,
      paymentConfigured: true,
    },
    allowedPreviewStates: ['live'],
  },
}
```

### Validação de Contratos

```tsx
import { validatePageContract } from './core'

const validation = validatePageContract('/app/preview', core)

if (!validation.allowed) {
  console.error(validation.reason)
  navigate(validation.fallback || '/app')
}
```

## Lei Fundamental

> **Uma página web não deve nunca ser capaz de prometer algo que o core ainda não declarou como existente.**

Quando esta lei é respeitada:
- A UX estabiliza
- A IA passa a ajudar (sem alucinações)
- O número de iterações cai brutalmente

## Integração com Gate

O `audit:web-e2e` pode validar se páginas respeitam seus contratos:

```typescript
for (const [path, contract] of Object.entries(PAGE_CONTRACTS)) {
  const validation = validatePageContract(path, core)
  if (!validation.allowed) {
    throw new Error(`Page ${path} violated contract: ${validation.reason}`)
  }
}
```

## Próximos Passos

1. **Refatorar páginas legacy**  
   Converter todas as páginas para usar `useWebCore()` em vez de inferir estado.

2. **Gate de contratos**  
   Adicionar validação de contratos ao `audit:web-e2e`.

3. **Health check real**  
   Ligar `core.truth.backendIsLive` ao health endpoint do backend.

4. **Estados intermediários**  
   Adicionar `previewState: 'loading'` para carregamentos assíncronos.

## Filosofia

Este core transforma a web de **"teatro frágil"** em **sistema confiável**.

Páginas deixam de ser "micro-cores" com regras próprias, e passam a ser **lentes** sobre uma única verdade imutável.
