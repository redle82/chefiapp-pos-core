# FLOW CAUSALITY — Bloco 5 da Arquitetura

**Data de Lock:** 2025-12-24  
**Status:** IMUTÁVEL  
**Tipo:** Ordem causal dos acontecimentos

---

## ⚠️ CRÍTICO: Fluxo ≠ Navegação

A maior confusão em sistemas web modernos é misturar:

- **Fluxo (Causalidade):** ordem temporal dos acontecimentos no mundo real
- **Navegação (UI):** movimento entre páginas na interface

### Exemplo Visual

```
FLUXO (Causal):
Identity → Menu → Publish → TPV
(não pode inverter, é realidade física)

NAVEGAÇÃO (UI):
/app ⇄ /start/menu ⇄ /start/publish
(pode ir e voltar, é só interface)
```

---

## Sistema de 6 Blocos (Recap)

```
┌────────────────────────────────────────────────────┐
│  1. Core Ontológico    → "O que existe"           │ ✅
│  2. Core Capacidades   → "O que pode ser feito"   │ ✅
│  3. Core Psicológico   → "O que user acredita"    │ ✅
│  4. Contratos          → "O que pode prometer"    │ ✅
│  5. Fluxos             → "Ordem dos eventos"      │ ⬅ ESTE DOCUMENTO
│  6. Implementação      → "Como aparece"           │ (descartável)
└────────────────────────────────────────────────────┘
```

---

## Fluxo Causal Completo (Ordem Fixa)

```
START
  ↓
[1] Identity       ← identidade do restaurante (obrigatório)
  ↓
[2] Slug           ← URL slug (obrigatório)
  ↓
[3] Menu           ← produtos (obrigatório)
  ↓
[4] Payments       ← configuração pagamentos (OPCIONAL)
  ↓ (pode saltar)
[5] Publish        ← torna público (obrigatório)
  ↓
[6] TPV Ready      ← sistema pronto para uso (obrigatório)
  ↓
END
```

### Regras Causais

1. **Identity antes de tudo**
   - Sem identidade, nada mais pode existir
   - Menu sem identity = violação causal

2. **Menu antes de Publish**
   - Não pode publicar sem produtos
   - Publish sem menu = violação causal

3. **Payments OPCIONAL**
   - Pode saltar identity → menu → publish
   - TPV funciona com cash/offline
   - Fix crítico: payments não obrigatório para TPV

4. **Publish antes de TPV**
   - TPV sem publicação = violação causal
   - URL deve existir antes de ser usado

---

## Validação de Causalidade

### ✅ Fluxos Válidos

```typescript
// Fluxo completo (com payments)
identity → slug → menu → payments → publish → tpv-ready

// Fluxo curto (sem payments)
identity → slug → menu → publish → tpv-ready

// Revisitar steps anteriores
identity → menu → identity (OK, pode editar)
```

### ❌ Violações Causais

```typescript
// Menu antes de identity
menu → identity  // ❌ violação

// Publish antes de menu
identity → publish  // ❌ violação

// TPV antes de publish
menu → tpv-ready  // ❌ violação

// Preview real sem publish
ghost → live (sem published)  // ❌ violação
```

---

## API do FlowEngine

### Detectar Step Atual

```typescript
import { detectCurrentStep } from '@/core/FlowEngine'

const currentStep = detectCurrentStep(core)
// 'identity' | 'menu' | 'publish' | 'tpv-ready' | 'none'
```

### Validar Transição

```typescript
import { canTransitionTo } from '@/core/FlowEngine'

const result = canTransitionTo(core, 'publish')

if (result.allowed) {
  navigate('/start/publish')
} else {
  console.warn(result.reason)
  // "Menu required before publish"
}
```

### Validar Fluxo Completo

```typescript
import { validateFlow } from '@/core/FlowEngine'

const validation = validateFlow(core)

if (!validation.valid) {
  console.error('Causality violations:', validation.causalityViolations)
  // ["Menu exists but identity not confirmed"]
}

console.log('Current:', validation.currentStep)
console.log('Completed:', validation.completedSteps)
console.log('Next allowed:', validation.nextAllowedSteps)
```

### Calcular Progresso

```typescript
import { calculateFlowProgress } from '@/core/FlowEngine'

const progress = calculateFlowProgress(core)
// 0-100 (percentage)

// Exemplo:
// identity + menu completados = 33%
// identity + menu + publish = 66%
// tudo completo = 100%
```

---

## Diferença: Fluxo vs Router

### ❌ ERRADO (Router decide causalidade)

```typescript
// pages/Publish.tsx
function PublishPage() {
  // Assume que pode publicar só porque chegou aqui
  return <PublishButton />
}
```

**Problema:** Router permite navegar para `/publish`, mas causalidade pode estar violada (sem menu).

### ✅ CORRETO (FlowEngine valida causalidade)

```typescript
// pages/Publish.tsx
import { useWebCore } from '@/core/useWebCore'
import { canTransitionTo } from '@/core/FlowEngine'

function PublishPage() {
  const core = useWebCore()
  
  const validation = canTransitionTo(core, 'publish')
  
  if (!validation.allowed) {
    return <Navigate to="/start/menu" />
  }
  
  return <PublishButton />
}
```

**Benefício:** Mesmo que URL seja forçada manualmente, causalidade é respeitada.

---

## Integração com Contratos

Fluxos alimentam contratos:

### CONTRACT_CAN_PUBLISH (CAP-002)

```typescript
validate: (core) => {
  const canPublish = core.entity.identityConfirmed && core.entity.menuDefined
  
  // Valida causalidade também
  const flowValidation = validateFlow(core)
  const hasFlowViolations = flowValidation.causalityViolations.length > 0
  
  return {
    satisfied: canPublish && !hasFlowViolations,
    reason: hasFlowViolations
      ? `Flow violation: ${flowValidation.causalityViolations[0]}`
      : undefined
  }
}
```

### CONTRACT_NAVIGATION_CONTRACT (PAGE-002)

```typescript
validate: (core) => {
  const flowValidation = validateFlow(core)
  
  return {
    satisfied: flowValidation.valid,
    reason: flowValidation.valid
      ? undefined
      : `Flow violations: ${flowValidation.causalityViolations.join(', ')}`
  }
}
```

---

## Exemplo Completo: Wizard com Fluxo

```typescript
import { useWebCore } from '@/core/useWebCore'
import { validateFlow, getNextRequiredStep } from '@/core/FlowEngine'

function WizardLayout() {
  const core = useWebCore()
  const flowValidation = validateFlow(core)
  
  // Valida causalidade antes de renderizar
  if (!flowValidation.valid) {
    return (
      <ErrorState 
        message="Flow violation detected"
        violations={flowValidation.causalityViolations}
      />
    )
  }
  
  // Próximo step obrigatório
  const nextRequired = getNextRequiredStep(core)
  
  return (
    <div>
      <FlowProgress 
        current={flowValidation.currentStep}
        completed={flowValidation.completedSteps}
        progress={calculateFlowProgress(core)}
      />
      
      <Routes>
        <Route path="identity" element={<IdentityPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="publish" element={<PublishPage />} />
      </Routes>
      
      {nextRequired && (
        <NextStepButton targetStep={nextRequired} />
      )}
    </div>
  )
}
```

---

## Casos de Uso Reais

### 1. Bloquear Acesso Precoce ao TPV

```typescript
// pages/TPVReadyPage.tsx
const validation = canTransitionTo(core, 'tpv-ready')

if (!validation.allowed) {
  // Reason: "Must be published before TPV ready"
  return <Navigate to="/start/publish" />
}
```

### 2. Permitir Saltar Payments

```typescript
// pages/MenuPage.tsx
function onNext() {
  // Pode ir direto para publish, saltando payments
  const toPublish = canTransitionTo(core, 'publish')
  
  if (toPublish.allowed) {
    navigate('/start/publish')  // OK, payments é opcional
  }
}
```

### 3. Detectar Estado Corrompido

```typescript
// app initialization
const flowValidation = validateFlow(core)

if (flowValidation.causalityViolations.length > 0) {
  // "Menu exists but identity not confirmed"
  // → localStorage corrompido ou manipulado
  
  logError('Causality violation detected', {
    violations: flowValidation.causalityViolations,
    core: core,
  })
  
  // Reset ou redirect para recovery
  clearState()
  navigate('/app')
}
```

---

## Validação no Gate

```bash
npm run audit:twelve-contracts
```

Agora valida:
1. Todos os 12 contratos
2. **Causalidade de fluxos** ⬅ novo
3. Contratos implícitos
4. Hierarquia

**Teste específico:**

```javascript
// scripts/validate-twelve-contracts.js

// Estado inválido: menu sem identity
const corruptedState = {
  entity: {
    identityConfirmed: false,  // ❌
    menuDefined: true,          // ❌ violação causal
    published: false,
  },
  // ...
}

const flowValidation = validateFlow(corruptedState)

if (!flowValidation.valid) {
  console.error('❌ CAUSALITY VIOLATION')
  console.error(flowValidation.causalityViolations)
  process.exit(1)
}
```

---

## Regras de Ouro

1. **Fluxo é imutável**
   - Identity sempre antes de menu
   - Menu sempre antes de publish
   - Publish sempre antes de TPV
   - Não há "fluxo alternativo"

2. **Payments é único opcional**
   - Pode saltar identity → menu → publish
   - Todos os outros steps são obrigatórios
   - Fix crítico validado

3. **Navegação não sobrepõe fluxo**
   - Router permite `/publish` (UI)
   - FlowEngine bloqueia se menu incompleto (causalidade)
   - Sempre consultar FlowEngine antes de ação

4. **Violações são erros graves**
   - Menu sem identity = bug no código
   - Não é "estado válido alternativo"
   - Gate deve bloquear deploy

---

## Comparação com Sistemas Comuns

### Sistema Típico (Errado)

```typescript
// ❌ Router decide tudo
<Route path="/publish" element={<PublishPage />} />

// Página assume que está OK estar aqui
function PublishPage() {
  return <button onClick={publish}>Publicar</button>
}
```

**Problema:** URL forçada = acesso sem validar menu.

### Este Sistema (Correto)

```typescript
// ✅ Router + FlowEngine
<Route path="/publish" element={<PublishPage />} />

function PublishPage() {
  const core = useWebCore()
  const validation = canTransitionTo(core, 'publish')
  
  if (!validation.allowed) {
    return <Redirect to="/start/menu" reason={validation.reason} />
  }
  
  return <button onClick={publish}>Publicar</button>
}
```

**Benefício:** Mesmo URL manipulada, causalidade protegida.

---

## Próximos Passos

- [ ] Integrar FlowEngine em todas as páginas do wizard
- [ ] Dashboard visual do fluxo (progresso + next step)
- [ ] E2E test que força violação causal
- [ ] Router guard que chama `validateFlow()` antes de cada transição

---

## Status Final

✅ **BLOCO 5 FECHADO**

- Fluxo causal formalizado
- 6 steps definidos (1 opcional)
- Validação automática via contratos
- Gate protege causalidade
- Payments confirmado opcional

**Arquitetura completa:**

1. ✅ Core Ontológico
2. ✅ Core Capacidades
3. ✅ Core Psicológico
4. ✅ Contratos (12)
5. ✅ Fluxos (causalidade)
6. ⏳ Implementação (incremental)

---

**Última atualização:** 2025-12-24  
**Responsável:** Core team  
**Próxima revisão:** Apenas se surgir novo fluxo crítico
