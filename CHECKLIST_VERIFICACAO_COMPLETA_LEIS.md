# ✅ CHECKLIST COMPLETA DE VERIFICAÇÃO — LEIS DO SISTEMA

**Data:** 2026-01-24  
**Status:** Checklist Oficial  
**Base:** Contratos, Leis e Arquitetura Locked

---

## 🎯 OBJETIVO

Este checklist garante que o sistema flua conforme as **leis imutáveis** definidas nos contratos, arquitetura e especificações.

---

## 📋 PARTE 1: CONTRATOS (12 CONTRATOS FECHADOS)

### FAMÍLIA 1: ONTOLÓGICOS (Core 1) — "O que existe"

#### ✅ ONT-001: Entity Exists
- [ ] `identityConfirmed === true` antes de qualquer operação
- [ ] Nenhum componente acessa `menu`, `payments`, `publish`, `preview`, `tpv` sem verificar `identityConfirmed`
- [ ] FlowGate bloqueia acesso se `!identityConfirmed`
- [ ] **Validação:** `core.entity.identityConfirmed` é a única fonte de verdade

#### ✅ ONT-002: Menu Exists
- [ ] `menuDefined === true` antes de `publish`, `orders`, `tpv`
- [ ] Nenhum componente assume menu existe sem verificar `menuDefined`
- [ ] **Validação:** `core.entity.menuDefined` é a única fonte de verdade

#### ✅ ONT-003: Published Exists
- [ ] `published === true` antes de `url-access`, `iframe`, `real-orders`, `tpv`
- [ ] Preview "real" só existe após `published === true`
- [ ] **Validação:** `core.entity.published` é a única fonte de verdade

**Regras de Causalidade:**
- [ ] Identity precede menu (não pode ter menu sem identity)
- [ ] Menu precede payments (não pode ter payments sem menu)
- [ ] Complete setup before publish (não pode publicar sem tudo completo)

---

### FAMÍLIA 2: CAPACIDADES (Core 2) — "O que pode ser feito"

#### ✅ CAP-001: Can Preview
- [ ] `canPreview === true` requer `identityConfirmed === true`
- [ ] Preview (ghost ou live) só funciona se `canPreview === true`
- [ ] **Validação:** `core.capabilities.canPreview` é a única fonte de verdade

#### ✅ CAP-002: Can Publish
- [ ] `canPublish === true` requer `identityConfirmed && menuDefined`
- [ ] Botão de publish só aparece se `canPublish === true`
- [ ] **Validação:** `core.capabilities.canPublish` é a única fonte de verdade

#### ✅ CAP-003: Can Receive Orders
- [ ] `canReceiveOrders === true` requer `published && menuDefined && paymentConfigured`
- [ ] Pedidos só podem ser criados se `canReceiveOrders === true`
- [ ] **Validação:** `core.capabilities.canReceiveOrders` é a única fonte de verdade

#### ✅ CAP-004: Can Use TPV
- [ ] `canUseTPV === true` requer `published && menuDefined` (payments **opcional**)
- [ ] TPV funciona com cash/offline (não requer payments)
- [ ] **Validação:** `core.capabilities.canUseTPV` é a única fonte de verdade

---

### FAMÍLIA 3: PSICOLÓGICOS (Core 3) — "O que o utilizador acredita"

#### ✅ PSY-001: Ghost Integrity
- [ ] `previewState === 'ghost'` requer `identityConfirmed === true`
- [ ] Ghost preview só aparece se `identityConfirmed === true`
- [ ] **Validação:** `core.previewState === 'ghost'` só é válido com identity

#### ✅ PSY-002: Live Integrity
- [ ] `previewState === 'live'` requer `published === true && backendIsLive === true`
- [ ] Live preview só aparece se `published && backendIsLive`
- [ ] **Validação:** `core.previewState === 'live'` só é válido com published + backend up

#### ✅ PSY-003: URL Promise
- [ ] `urlExists === true` requer `published === true`
- [ ] URL pública só é mostrada se `published === true`
- [ ] **Validação:** `core.truth.urlExists` só é válido com published

---

### FAMÍLIA 4: PÁGINAS (Core 4) — "O que cada página pode prometer"

#### ✅ PAGE-001: Page Contract
- [ ] Cada página declara `requires`, `guarantees`, `allowedPreviewStates`
- [ ] Nenhuma página promete algo que o core não declarou como existente
- [ ] **Validação:** `validatePageContract(path, core)` passa para todas as páginas

#### ✅ PAGE-002: Navigation Contract
- [ ] Navegação bloqueada se fluxo causal violado
- [ ] FlowGate valida antes de permitir navegação
- [ ] **Validação:** `validateFlow(core)` não retorna violações

**Regra de Ouro:**
> **Uma página web não pode prometer algo que o core ainda não declarou como existente.**

---

## 📋 PARTE 2: LEIS DA VERDADE (SYSTEM_TRUTH_CODEX)

### ✅ LEI 1: UI é Consequência
- [ ] UI não "antecipa" o Core
- [ ] Se não há confirmação, UI não finge que aconteceu
- [ ] **Validação:** Nenhum componente mostra estado "sucesso" sem confirmação do Core

### ✅ LEI 2: Não existe "Online Mode"
- [ ] Sistema opera como "Fast Offline"
- [ ] Fluxo: `Ação → Registro local → Fila → Reconciler → API → Confirmação`
- [ ] Online é só "fila com latência baixa"
- [ ] **Validação:** Todas as ações críticas passam pela fila offline

### ✅ LEI 3: Truth Zero (Onboarding é sagrado)
- [ ] Nunca iniciar onboarding se Core está DOWN/UNKNOWN
- [ ] Se Core não responde, sistema bloqueia ação e explica
- [ ] Oferece "Retry" e "Demo Mode" explicitamente rotulado
- [ ] **Validação:** `healthStatus !== 'UP'` bloqueia onboarding

---

## 📋 PARTE 3: REGRAS DO CORE (Imutabilidade e Causalidade)

### ✅ Estados Financeiros Irreversíveis
- [ ] Operações fechadas são imutáveis
- [ ] Sem pagamento sem pedido finalizado
- [ ] Sem pedido sem sessão ativa
- [ ] Sem transições escondidas
- [ ] **Validação:** Database triggers bloqueiam UPDATE/DELETE em estados fechados

### ✅ Máquinas de Estado
- [ ] State machines são "source of truth" versionadas (JSON)
- [ ] Executor tipado valida transições
- [ ] **Validação:** Nenhuma transição de estado sem validação

---

## 📋 PARTE 4: CONTRATO DO HEALTH (Truth Signal)

### ✅ Status Possíveis
- [ ] `UNKNOWN`: inicial / não verificado
- [ ] `UP`: ok
- [ ] `DEGRADED`: ok porém lento (latência acima do limiar)
- [ ] `DOWN`: indisponível / erro / timeout

### ✅ Regras Obrigatórias
- [ ] Polling **dinâmico** (DOWN = mais agressivo; UP = normal)
- [ ] Toda ação crítica passa por gating (ex.: create/publish/pay)
- [ ] Logs registram mudanças de estado (UP→DOWN etc.)
- [ ] **Validação:** `useHealthCheck()` implementa polling dinâmico

---

## 📋 PARTE 5: FLOWGATE (Arquitetura Locked)

### ✅ Ponto de Entrada Único
- [ ] Landing → `/app` (único ponto de entrada)
- [ ] FlowGate intercepta `/app`
- [ ] Nenhum componente decide rota (só FlowGate)
- [ ] **Validação:** Nenhum `Link to="/login"` direto na Landing

### ✅ Soberania do FlowGate
- [ ] FlowGate só usa:
  - ✅ `auth.user` (sessão Supabase)
  - ✅ `restaurant_members` (VIEW)
  - ✅ `gm_restaurants.onboarding_completed_at` (flag clara)
- [ ] FlowGate **não usa:**
  - ❌ `profiles` (opcional)
  - ❌ `system_config` (opcional)
  - ❌ Dados "nice to have"
- [ ] **Validação:** `FlowGate.tsx` não acessa dados opcionais

### ✅ Regras de Decisão
- [ ] `!auth` → `/login`
- [ ] `!restaurant` → `/onboarding/identity`
- [ ] `completed` → `/app/dashboard`
- [ ] **Validação:** `resolveNextRoute()` implementa essas regras

---

## 📋 PARTE 6: GARANTIAS DO SISTEMA (SYSTEM_OF_RECORD_SPEC)

### ✅ Garantia de Atomicidade
- [ ] "No Financial Fact exists without a Legal Seal"
- [ ] Atomic Commit Protocol via `CoreTransactionManager`
- [ ] **Validação:** Impossível gerar "ghost revenue" ou "off-book sales"

### ✅ Garantia de Imutabilidade
- [ ] "History is Write-Once, Read-Many"
- [ ] Database-level `BEFORE UPDATE/DELETE` Triggers
- [ ] **Validação:** Não é possível alterar vendas passadas sem deixar trilha forense

### ✅ Garantia de Independência
- [ ] "Fiscal Bureaucracy does not block Financial Reality"
- [ ] Observer Pattern Implementation
- [ ] **Validação:** Loja continua operando mesmo se API fiscal offline

---

## 📋 PARTE 7: VALIDAÇÕES TÉCNICAS (Genesis Protocol)

### ✅ Layer 0: Void (Código/Existência)
- [ ] `no_critical_bloat`: `tsc -b` exit code 0
- [ ] `routes_alive`: Playwright E2E passa
- [ ] `env_sanitized`: Zero chaves vivas no código
- [ ] **Validação:** `npm run audit:web-e2e` passa

### ✅ Layer 1: Universe (Dados/Verdade)
- [ ] `db_reachable`: Ping Supabase < 2s
- [ ] `schema_valid`: Tabelas críticas existem
- [ ] `seed_verified`: Entidade piloto existe (WARN se fail, não BLOCK)
- [ ] **Validação:** Conexão DB funcional

### ✅ Layer 2: State (Lógica/Regras)
- [ ] `pricing_logic_valid`: `price + tax - discount == total`
- [ ] `state_consistency`: Estado final == Estado esperado após N eventos
- [ ] **Validação:** Testes unitários de pricing passam

### ✅ Layer 3: Action (Verbos/Segurança)
- [ ] `rbac_enforced`: 403 Forbidden em rotas protegidas
- [ ] `flow_complete`: E2E critical path passa
- [ ] **Validação:** Testes de segurança passam

---

## 📋 PARTE 8: PROTEÇÃO CONTRA 5º CORE

### ✅ Detecção de Violações
- [ ] `detectFifthCoreAttempt()` bloqueia:
  - Novos state managers
  - `localStorage.getItem()` direto
  - Contextos com palavra "Core" não aprovados
  - Hardcoded truths
- [ ] **Validação:** `grep` não encontra padrões proibidos

### ✅ Code Review Checklist
- [ ] Não cria nova fonte de verdade?
- [ ] Usa `useWebCore()` em vez de inferir?
- [ ] Respeita contratos de página?
- [ ] **Validação:** Code review valida essas regras

---

## 📋 PARTE 9: VALIDAÇÕES DE INTEGRIDADE

### ✅ Idempotência
- [ ] Operações podem ser repetidas sem efeitos colaterais
- [ ] Pedidos não duplicam
- [ ] Pagamentos não duplicam
- [ ] **Validação:** Testes de idempotência passam

### ✅ Fiscal
- [ ] External ID nunca fica em estado silencioso
- [ ] Retry automático com backoff exponencial
- [ ] Estados: `PENDING_EXTERNAL_ID`, `CONFIRMED_EXTERNAL_ID`, `FAILED_EXTERNAL_ID`
- [ ] **Validação:** Nenhum pedido fica sem External ID indefinidamente

### ✅ Offline/Reconexão
- [ ] Fila offline funciona
- [ ] Reconciliação automática quando internet volta
- [ ] Nenhum pedido perdido
- [ ] **Validação:** Teste de reconexão passa (>95% sync)

---

## 📋 PARTE 10: VALIDAÇÕES DE PERFORMANCE

### ✅ Loops Eliminados
- [ ] Sem loops de `useEffect`
- [ ] Sem loops de realtime subscribe/unsubscribe
- [ ] Sem loops de FlowGate navigation
- [ ] Sem loops de Identity resolution
- [ ] **Validação:** Console não mostra loops infinitos

### ✅ Logs
- [ ] Sem 409 Conflict em loop (`app_logs`)
- [ ] Idempotency key em todos os logs
- [ ] **Validação:** Network tab não mostra 409 em loop

---

## 🎯 COMO USAR ESTE CHECKLIST

### Antes de Deploy
1. Executar `npm run audit:web-e2e`
2. Verificar todas as partes 1-10
3. Se alguma falhar → **BLOQUEAR DEPLOY**

### Durante Code Review
1. Verificar partes relevantes ao PR
2. Se violar qualquer contrato → **REJEITAR PR**

### Durante Testes
1. Executar checklist completo
2. Documentar falhas
3. Corrigir antes de produção

---

## 📊 STATUS DE VALIDAÇÃO

**Última execução:** [DATA]  
**Resultado:** [PASS/FAIL]  
**Falhas encontradas:** [NÚMERO]  
**Correções aplicadas:** [LISTA]

---

**Este checklist é a lei suprema do sistema.**  
**Qualquer PR que viole este checklist deve ser rejeitado.**
