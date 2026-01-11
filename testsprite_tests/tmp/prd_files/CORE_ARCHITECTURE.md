# CORE ARCHITECTURE — Sistema Fechado

**Este documento define a arquitetura FINAL e IMUTÁVEL do ChefIApp.**

Qualquer tentativa de criar um 5º core deve ser rejeitada no code review.

---

## Lei Fundamental

> **Existem exatamente 4 cores. Não mais. Não menos.**
> **Estes cores não se multiplicam. São finitos por definição.**

---

## Os 4 Cores (Fechados)

### CORE 1 — Core Ontológico

**Responsabilidade:** "O que existe / não existe no sistema"

**Manifestação atual:**
- `steps.identity.completed`
- `steps.menu.completed`
- `steps.payments.completed`
- `steps.published`
- Gates de transição

**Verdades que gera:**
```typescript
entity: {
  exists: boolean
  identityConfirmed: boolean
  menuDefined: boolean
  paymentConfigured: boolean
  published: boolean
}
```

**Status:** ✅ Sólido. Não precisa de alterações.

---

### CORE 2 — Core de Capacidades

**Responsabilidade:** "O que é permitido fazer agora"

**Manifestação atual:**
- `canPreview`
- `canUseTPV` (published + menu, **payments opcional**)
- `isReadyForTPV`
- Validações de transição de step

**Verdades que gera:**
```typescript
capabilities: {
  canPreview: boolean
  canReceiveOrders: boolean        // requer payments
  canUseTPV: boolean               // NÃO requer payments (cash/offline OK)
  canAccessPublicPage: boolean
}
```

**Status:** ✅ Sólido. Payments é opcional para TPV.

---

### CORE 3 — Core Psicológico

**Responsabilidade:** "O que o utilizador acredita que está a acontecer"

**Manifestação atual:**
- `previewState: 'none' | 'ghost' | 'live'`
- Microprogress (8 passos)
- Ghost preview (dados antes de URL)
- Copy diferente por estado

**Verdades que gera:**
```typescript
psychological: {
  previewState: 'none' | 'ghost' | 'live'
  previewIsReal: boolean             // published + identity + menu
  backendIsLive: boolean             // health check real, não hardcoded
  microprogress: number              // 0–8
  userBelievesItExists: boolean
}
```

**Status:** ✅ Implementado. previewIsReal depende de published.

---

### CORE 4 — Core de Contratos Web

**Responsabilidade:** "O que uma página pode ou não prometer"

**Manifestação atual:**
- `PAGE_CONTRACTS` (requires, guarantees, allowedPreviewStates)
- `validatePageContract()`
- Router guards (a implementar)

**Verdades que gera:**
```typescript
contract: {
  pageCanRender: boolean
  pageCanPromisePreview: boolean
  pageCanFetchHealth: boolean
  pageCanInferState: boolean
}
```

**Status:** 🟡 Implementado mas não ligado ao gate ainda.

---

## Fluxo de Verdade (Imutável)

```
[ Core 1: Ontológico ]  →  "identityConfirmed = true"
         ↓
[ Core 2: Capacidades ] →  "canPreview = true"
         ↓
[ Core 3: Psicológico ] →  "previewState = 'ghost'"
         ↓
[ Core 4: Contratos ]   →  "página /preview pode renderizar"
         ↓
[ Página ]              →  consulta, nunca infere
```

---

## Regras de Ouro (Invioláveis)

### 1. Páginas nunca decidem tempo
**Errado:**
```tsx
if (Date.now() > createdAt + 5000) {
  showPreview()
}
```

**Certo:**
```tsx
if (core.capabilities.canPreview) {
  showPreview()
}
```

---

### 2. Páginas nunca prometem existência
**Errado:**
```tsx
<h1>A tua página está online!</h1>
<iframe src="/public/{slug}" />  // pode não existir ainda
```

**Certo:**
```tsx
{core.previewState === 'live' && (
  <h1>A tua página está online!</h1>
)}
{core.previewState === 'ghost' && (
  <h1>Pré-visualização (ainda não publicado)</h1>
)}
```

---

### 3. Páginas nunca inferem backend
**Errado:**
```tsx
const hasMenu = items.length > 0  // inferência
```

**Certo:**
```tsx
const hasMenu = core.entity.menuDefined  // consulta
```

---

### 4. Páginas apenas consultam
**Toda página começa com:**
```tsx
export function MyPage() {
  const core = useWebCore()  // única fonte de verdade
  
  // validação de contrato
  if (!core.capabilities.canAccessThisPage) {
    return <Navigate to={fallback} />
  }
  
  // renderização baseada em consulta
  return <div>{core.previewState}</div>
}
```

---

## Proteção Contra o 5º Core

### Gate Automático
O `audit:web-e2e` valida:
1. Todas as páginas usam `useWebCore()`
2. Nenhuma página lê `localStorage` diretamente
3. Todos os contratos são respeitados
4. Nenhuma inferência de estado é feita

### Code Review Checklist
Antes de aprovar PR, verificar:
- [ ] Não cria nova fonte de verdade
- [ ] Não infere estado
- [ ] Não promete antes do core
- [ ] Usa `useWebCore()` em vez de `localStorage`

### Bloqueio Explícito
```typescript
// ❌ PROIBIDO criar isto:
const myNewCore = {
  someNewTruth: true
}

// ✅ PERMITIDO consultar isto:
const core = useWebCore()
```

---

## Por Que Isto Funciona

### Sem estes 4 cores:
- Cada página vira um micro-core
- IA "parece burra" (não consegue raciocinar)
- Bugs psicológicos constantes
- Regressões infinitas

### Com estes 4 cores fechados:
- Sistema previsível
- IA acelera desenvolvimento
- Zero bugs psicológicos
- Replicável em outros verticais

---

## Valor de Mercado

**Hoje:** Beta sólido com core fechado

**Após 3 casos reais:** Produto vendável

**Após 20–50 ativações:** Plataforma

**Lei de Wright aplicável:** Custo de onboarding cai exponencialmente

---

## Implementação do Lock

Este sistema está fechado. Para alterar qualquer core:

1. Propor mudança em CORE_ARCHITECTURE.md
2. Justificar por que os 4 cores existentes não resolvem
3. Demonstrar que não é confusão de camadas
4. Aprovar com 2+ revisores técnicos

**Se não pode ser justificado: é proibido.**

---

## Responsabilidade por Core

| Core | Ficheiro Principal | Quem Pode Alterar |
|------|-------------------|-------------------|
| 1. Ontológico | `core-engine/`, `state-machines/` | Core team apenas |
| 2. Capacidades | `WebCoreState.ts` | Core team com review |
| 3. Psicológico | `WebCoreState.ts` (previewState) | UX + Core team |
| 4. Contratos Web | `PageContracts.ts` | Qualquer dev com PR |

---

## Status Final

✅ Core 1: Ontológico — Sólido  
✅ Core 2: Capacidades — Sólido  
✅ Core 3: Psicológico — Implementado  
🟡 Core 4: Contratos Web — A ligar ao gate  

**Próximo passo:** Ligar Core 4 ao `audit:web-e2e` e fechar o sistema permanentemente.

---

**Data de Lock:** 2025-12-24  
**Versão:** 1.0 (Imutável)
