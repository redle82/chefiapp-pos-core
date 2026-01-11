# CONTRACT HIERARCHY — 12 Contratos Fechados

**Data de Lock:** 2025-12-24  
**Status:** IMUTÁVEL  
**Número Total:** 12 contratos (nem mais, nem menos)

---

## Sistema de 4 Famílias

```
┌─────────────────────────────────────────────────────────────┐
│                    HIERARQUIA FIXA                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ONTOLÓGICO (Core 1) — "O que existe"                   │
│     ↓ pode influenciar                                      │
│  2. CAPACIDADES (Core 2) — "O que pode ser feito"          │
│     ↓ pode influenciar                                      │
│  3. PSICOLÓGICO (Core 3) — "O que o utilizador acredita"   │
│     ↓ pode influenciar                                      │
│  4. PÁGINA (Core 4) — "O que cada página pode prometer"    │
│                                                             │
│  ⚠️  PROIBIDO subir na hierarquia                           │
│  ⚠️  Página não corrige erro ontológico                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FAMÍLIA 1 — CONTRATOS ONTOLÓGICOS (3)

### ONT-001: Entity Exists
**Requer:** `identityConfirmed === true`  
**Garante:** Restaurante existe no sistema  
**Bloqueia:** menu, payments, publish, preview, tpv

```typescript
// ✅ CORRETO
if (core.entity.identityConfirmed) {
  return <MenuPage />
}

// ❌ ERRADO (contrato implícito)
if (wizardState.steps.identity.completed) {
  return <MenuPage />
}
```

---

### ONT-002: Menu Exists
**Requer:** `menuDefined === true`  
**Garante:** Entidade comercial válida  
**Bloqueia:** publish, orders, tpv

```typescript
// ✅ CORRETO
if (core.entity.menuDefined) {
  enablePublishButton()
}

// ❌ ERRADO (contrato implícito)
if (menu.length > 0) {
  enablePublishButton()
}
```

---

### ONT-003: Published Exists
**Requer:** `published === true`  
**Garante:** Entidade pública  
**Bloqueia:** URL, iframe, pedidos reais, tpv

```typescript
// ✅ CORRETO
if (core.entity.published) {
  return <PublicURL slug={slug} />
}

// ❌ ERRADO (contrato implícito)
if (slug) {
  return <PublicURL slug={slug} />
}
```

---

## FAMÍLIA 2 — CONTRATOS DE CAPACIDADES (4)

### CAP-001: Can Preview
**Requer:** `identityConfirmed === true`  
**Garante:** `previewState ≠ 'none'`  
**Permite:** ghost preview ou live preview

```typescript
// ✅ CORRETO
if (core.capabilities.canPreview) {
  return <PreviewButton />
}

// ❌ ERRADO (assume capacidade sem verificar)
return <PreviewButton />
```

---

### CAP-002: Can Publish
**Requer:** `identity + menu + gates.ok`  
**Garante:** Publicação possível  
**Bloqueia:** Botão publicar antes da hora

```typescript
// ✅ CORRETO
const canPublish = core.entity.identityConfirmed && core.entity.menuDefined

if (canPublish) {
  return <PublishButton />
}

// ❌ ERRADO (página decide se pode publicar)
if (steps.identity && steps.menu) {
  return <PublishButton />
}
```

---

### CAP-003: Can Receive Orders
**Requer:** `published && menuDefined && paymentConfigured`  
**Garante:** Criação de pedidos possível  
**Bloqueia:** Criar pedidos sem setup completo

```typescript
// ✅ CORRETO
if (core.capabilities.canReceiveOrders) {
  await createOrder(items)
}

// ❌ ERRADO (assume que pode aceitar pedidos)
await createOrder(items)
```

---

### CAP-004: Can Use TPV
**Requer:** `published && menuDefined` *(payments opcional — cash/offline OK)*  
**Garante:** Acesso ao TPV  
**Bloqueia:** TPV Ready precoce

```typescript
// ✅ CORRETO
if (core.capabilities.canUseTPV) {
  return <Navigate to="/app/tpv-ready" />
}

// ❌ ERRADO (regride fix crítico)
if (published && menuDefined && paymentConfigured) {
  return <Navigate to="/app/tpv-ready" />
}
```

⚠️ **CRÍTICO:** Este contrato corrige regressão histórica.  
TPV funciona com cash/offline, payments não é obrigatório.

---

## FAMÍLIA 3 — CONTRATOS PSICOLÓGICOS (3)

### PSY-001: Ghost Integrity
**Requer:** `identityConfirmed === true`  
**Garante:** Ghost preview coerente  
**Bloqueia:** Preview vazio ou técnico

```typescript
// ✅ CORRETO
if (core.previewState === 'ghost' && core.entity.identityConfirmed) {
  return <GhostPreview data={restaurantData} />
}

// ❌ ERRADO (mostra ghost sem validar)
if (previewState === 'ghost') {
  return <GhostPreview data={restaurantData} />
}
```

---

### PSY-002: Live Integrity
**Requer:** `published && backendIsLive === true`  
**Garante:** Iframe real funcional  
**Bloqueia:** Iframe branco / erro

```typescript
// ✅ CORRETO
if (core.previewState === 'live' && core.truth.backendIsLive) {
  return <iframe src={publicURL} />
}

// ❌ ERRADO (assume backend sempre up)
if (core.previewState === 'live') {
  return <iframe src={publicURL} />
}
```

---

### PSY-003: URL Promise
**Requer:** `published === true`  
**Garante:** URL válida  
**Bloqueia:** Mostrar link antes da publicação

```typescript
// ✅ CORRETO
if (core.truth.urlExists && core.entity.published) {
  return <CopyLinkButton url={publicURL} />
}

// ❌ ERRADO (mostra URL antes de publicar)
if (slug) {
  return <CopyLinkButton url={`/${slug}`} />
}
```

---

## FAMÍLIA 4 — CONTRATOS DE PÁGINA (2)

### PAGE-001: Page Contract
**Requer:** `validatePageContract(path, core)`  
**Garante:** Página só renderiza se contratos satisfeitos  
**Implementação:** `PageContracts.ts`

```typescript
// Exemplo: /app/tpv-ready
{
  path: '/app/tpv-ready',
  contractIds: ['ONT-003', 'CAP-004', 'PAGE-001'],
  requires: {
    published: true,
    menuDefined: true,
  },
  allowedPreviewStates: ['live'],
  description: 'TPV ready — só se published + menu (payments opcional)',
}
```

---

### PAGE-002: Navigation Contract
**Requer:** `validateStepTransition(core, target)`  
**Garante:** Navegação válida  
**Bloqueia:** Saltos ilegais no funil

```typescript
// ✅ CORRETO
const transition = validateStepTransition(core, '/start/menu')
if (transition.allowed) {
  navigate('/start/menu')
} else {
  console.warn(transition.reason)
}

// ❌ ERRADO (navegação sem validação)
navigate('/start/menu')
```

---

## Matriz de Dependências

| Contrato | Depende de | Influencia |
|----------|-----------|------------|
| ONT-001  | —         | CAP-001, PSY-001, PAGE-001 |
| ONT-002  | ONT-001   | CAP-002, CAP-004 |
| ONT-003  | ONT-002   | CAP-004, PSY-002, PSY-003 |
| CAP-001  | ONT-001   | PSY-001, PAGE-001 |
| CAP-002  | ONT-001, ONT-002 | PAGE-001 |
| CAP-003  | ONT-003, ONT-002 | — |
| CAP-004  | ONT-003, ONT-002 | PAGE-001 |
| PSY-001  | CAP-001   | PAGE-001 |
| PSY-002  | ONT-003   | PAGE-001 |
| PSY-003  | ONT-003   | PAGE-001 |
| PAGE-001 | Todos     | — (leaf) |
| PAGE-002 | Todos     | — (leaf) |

---

## Exemplo Completo: TPV Ready Page

```typescript
import { useWebCore } from '@/core/useWebCore'

function TPVReadyPage() {
  const core = useWebCore()

  // Validação automática via PAGE-001
  const validation = validatePageContract('/app/tpv-ready', core)
  
  if (!validation.allowed) {
    return <Navigate to={validation.fallback || '/app'} />
  }

  // Todos os contratos satisfeitos:
  // ✅ ONT-003: published === true
  // ✅ ONT-002: menuDefined === true
  // ✅ CAP-004: canUseTPV === true
  // ✅ PSY-002: previewState === 'live'
  // ✅ PAGE-001: contrato de página respeitado

  return (
    <div>
      <h1>TPV Ready</h1>
      {core.capabilities.canUseTPV && (
        <TPVInterface />
      )}
    </div>
  )
}
```

---

## Detecção de Anti-Patterns

### ❌ Contrato Implícito em Componente
```typescript
// PROIBIDO — contrato implícito
function PreviewButton() {
  const [published] = useState(localStorage.getItem('published'))
  
  if (!published) return null  // ← contrato implícito
  
  return <button>Preview</button>
}
```

### ✅ Contrato Explícito via Core
```typescript
// CORRETO — consulta core
function PreviewButton() {
  const core = useWebCore()
  
  if (!core.capabilities.canPreview) return null
  
  return <button>Preview</button>
}
```

---

## Validação no Gate

```bash
npm run audit:twelve-contracts
```

**Testa:**
1. Todos os 12 contratos em 5 estados diferentes
2. TPV sem payments (regressão crítica)
3. Detecção de contratos implícitos em src/
4. Hierarquia não violada

**Exit code:**
- `0` = todos os contratos satisfeitos
- `1` = violações detectadas → deploy bloqueado

---

## Regras de Ouro

1. **Nenhum contrato pode subir na hierarquia**
   - Página não corrige erro ontológico
   - Psicológico não cria capacidade
   - Capacidade não declara existência

2. **Número fechado: 12 contratos**
   - Criar 13º contrato = criar 5º core (proibido)
   - Detector automático bloqueia no gate

3. **Contratos implícitos são detectados**
   - `if (!published)` em componente = violação
   - `if (menu.length > 0)` em componente = violação
   - `wizardState.` em componente = violação

4. **Páginas consultam, nunca inferem**
   - `useWebCore()` é única fonte de verdade
   - Sem `localStorage.getItem()` direto
   - Sem assumir capacidades

---

## Próximos Passos

- [ ] Refatorar páginas restantes para usar `contractIds`
- [ ] Adicionar router guard que chama `validatePageContract()`
- [ ] Dashboard visual dos 12 contratos (status live)
- [ ] E2E test que força violação e valida bloqueio

---

**Última atualização:** 2025-12-24  
**Status:** SISTEMA FECHADO  
**Gate:** Linked to `audit:web-e2e`
