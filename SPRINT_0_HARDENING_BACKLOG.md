# 🔧 SPRINT 0: HARDENING BACKLOG
## Backlog Técnico Executável - Zero Glamour, Máxima Eficiência

**Data:** 2026-01-20  
**Objetivo:** Transformar 15 itens obrigatórios em tarefas executáveis  
**Filosofia:** "Backlog chato, feio e eficiente. Zero glamour, zero confusão."

---

## 📋 ESTRUTURA DO BACKLOG

### Formato de Tarefa
- **ID:** Identificador único
- **Épico:** Categoria principal
- **Tarefa:** Descrição objetiva
- **Critério de Pronto:** Definição objetiva e testável
- **Estimativa:** Dias (realista, com margem)
- **Dependências:** O que precisa estar pronto antes
- **Status:** 🔴 Não Iniciado | 🟡 Em Progresso | 🟢 Completo

---

## 🎯 ÉPICO 1: CORE ENGINE - TRANSAÇÕES ATÔMICAS

### EPIC-1.1: Tornar Efeitos 100% Transacionais

#### TASK-1.1.1: Passar txId para saveOrder
- **Descrição:** Modificar `saveOrder` para aceitar `txId` opcional. Se `txId` presente, salvar na transação. Se ausente, salvar direto (compatibilidade).
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `saveOrder(order, txId)` aceita `txId` opcional
  - ✅ Se `txId` presente, salva em `tx.changes`
  - ✅ Se `txId` ausente, salva direto (backward compatible)
  - ✅ Teste unitário: `saveOrder` com `txId` salva na transação
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** 🟢 Completo

#### TASK-1.1.2: Passar txId para saveSession
- **Descrição:** Mesmo que TASK-1.1.1, mas para `saveSession`
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `saveSession(session, txId)` aceita `txId` opcional
  - ✅ Teste unitário: `saveSession` com `txId` salva na transação
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** 🟢 Completo

#### TASK-1.1.3: Passar txId para savePayment
- **Descrição:** Mesmo que TASK-1.1.1, mas para `savePayment`
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `savePayment(payment, txId)` aceita `txId` opcional
  - ✅ Teste unitário: `savePayment` com `txId` salva na transação
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** 🟢 Completo

#### TASK-1.1.4: Modificar calculateTotal para usar txId
- **Descrição:** Modificar `calculateTotal` para passar `txId` para `saveOrder`
- **Arquivo:** `core-engine/effects/index.ts`
- **Critério de Pronto:**
  - ✅ `calculateTotal` recebe `txId` do contexto
  - ✅ `repo.saveOrder(order, txId)` é chamado com `txId`
  - ✅ Teste: `calculateTotal` dentro de transação salva na transação
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.1.1
- **Status:** 🟢 Completo

#### TASK-1.1.5: Modificar lockItems para usar txId
- **Descrição:** Mesmo que TASK-1.1.4, mas para `lockItems`
- **Arquivo:** `core-engine/effects/index.ts`
- **Critério de Pronto:**
  - ✅ `lockItems` recebe `txId` do contexto
  - ✅ `repo.saveOrder(order, txId)` é chamado com `txId`
  - ✅ Teste: `lockItems` dentro de transação salva na transação
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.1.1
- **Status:** 🟢 Completo

#### TASK-1.1.6: Modificar applyPaymentToOrder para usar txId
- **Descrição:** Mesmo que TASK-1.1.4, mas para `applyPaymentToOrder`
- **Arquivo:** `core-engine/effects/index.ts`
- **Critério de Pronto:**
  - ✅ `applyPaymentToOrder` recebe `txId` do contexto
  - ✅ `repo.saveOrder(order, txId)` e `repo.savePayment(payment, txId)` usam `txId`
  - ✅ Teste: `applyPaymentToOrder` dentro de transação salva na transação
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.1.1, TASK-1.1.3
- **Status:** 🟢 Completo

#### TASK-1.1.7: Modificar CoreExecutor para passar txId no contexto
- **Descrição:** Modificar `CoreExecutor.transition` para passar `txId` no `EffectContext`
- **Arquivo:** `core-engine/executor/CoreExecutor.ts`
- **Critério de Pronto:**
  - ✅ `EffectContext` inclui `txId: string`
  - ✅ `txId` é passado para todos os effects
  - ✅ Teste: Effect recebe `txId` correto
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.1.4, TASK-1.1.5, TASK-1.1.6
- **Status:** 🟢 Completo

#### TASK-1.1.8: Teste de Falha Parcial (Rollback)
- **Descrição:** Criar teste que simula falha após `lockItems` mas antes de `applyPaymentToOrder`. Verificar que rollback funciona.
- **Arquivo:** `core-engine/tests/transactions.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: `lockItems` sucesso, `applyPaymentToOrder` falha
  - ✅ Após rollback, order NÃO está locked
  - ✅ Após rollback, payment NÃO foi criado
  - ✅ Estado é consistente (não parcial)
- **Estimativa:** 1 dia
- **Dependências:** TASK-1.1.7
- **Status:** ✅ Completo

**Total Épico 1.1:** 4.5 dias

---

### EPIC-1.2: Isolamento Transacional (Snapshot/Clone)

#### TASK-1.2.1: Implementar clone profundo de Order
- **Descrição:** Criar função `cloneOrder(order: Order): Order` que faz deep clone
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `cloneOrder` retorna cópia independente
  - ✅ Modificação na cópia não afeta original
  - ✅ Teste: Modificar cópia, original inalterado
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-1.2.2: Implementar clone profundo de Session
- **Descrição:** Mesmo que TASK-1.2.1, mas para `Session`
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `cloneSession` retorna cópia independente
  - ✅ Teste: Modificar cópia, original inalterado
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-1.2.3: Implementar clone profundo de Payment
- **Descrição:** Mesmo que TASK-1.2.1, mas para `Payment`
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `clonePayment` retorna cópia independente
  - ✅ Teste: Modificar cópia, original inalterado
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-1.2.4: Modificar getOrder para retornar clone
- **Descrição:** Modificar `getOrder` para retornar `cloneOrder(order)` em vez de referência direta
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `getOrder` retorna clone
  - ✅ Modificação do retorno não afeta estado interno
  - ✅ Teste: Modificar order retornado, estado interno inalterado
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.2.1
- **Status:** ✅ Completo

#### TASK-1.2.5: Modificar getSession para retornar clone
- **Descrição:** Mesmo que TASK-1.2.4, mas para `getSession`
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `getSession` retorna clone
  - ✅ Teste: Modificar session retornado, estado interno inalterado
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.2.2
- **Status:** ✅ Completo

#### TASK-1.2.6: Modificar getPayment para retornar clone
- **Descrição:** Mesmo que TASK-1.2.4, mas para `getPayments` (retorna array de clones)
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `getPayments` retorna clones
  - ✅ Teste: Modificar payment retornado, estado interno inalterado
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.2.3
- **Status:** ✅ Completo

#### TASK-1.2.7: Criar snapshot dentro de transação
- **Descrição:** Modificar `beginTransaction` para criar snapshot dos objetos afetados
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `beginTransaction` cria snapshot dos objetos atuais
  - ✅ Snapshot é usado no rollback
  - ✅ Teste: Rollback restaura estado do snapshot
- **Estimativa:** 1 dia
- **Dependências:** TASK-1.2.4, TASK-1.2.5, TASK-1.2.6
- **Status:** ✅ Completo

**Total Épico 1.2:** 4 dias

---

### EPIC-1.3: Verificação de Versão e Detecção de Conflito

#### TASK-1.3.1: Comparar versão no commit
- **Descrição:** Modificar `commit` para comparar versão atual com versão do snapshot antes de aplicar mudanças
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `commit` lê versão atual do objeto
  - ✅ Compara com versão do snapshot
  - ✅ Se diferente, lança `ConcurrencyConflictError`
  - ✅ Teste: Commit com versão divergida lança erro
- **Estimativa:** 1 dia
- **Dependências:** TASK-1.2.7
- **Status:** ✅ Completo

#### TASK-1.3.2: Criar ConcurrencyConflictError
- **Descrição:** Criar classe de erro `ConcurrencyConflictError` para conflitos de versão
- **Arquivo:** `core-engine/repo/errors.ts` (novo)
- **Critério de Pronto:**
  - ✅ `ConcurrencyConflictError` estende `Error`
  - ✅ Inclui `entityId`, `expectedVersion`, `actualVersion`
  - ✅ Mensagem clara sobre conflito
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-1.3.3: Modificar CoreExecutor para tratar ConcurrencyConflictError
- **Descrição:** Modificar `CoreExecutor` para capturar `ConcurrencyConflictError` e retornar resultado apropriado
- **Arquivo:** `core-engine/executor/CoreExecutor.ts`
- **Critério de Pronto:**
  - ✅ `ConcurrencyConflictError` é capturado
  - ✅ `TransitionResult` inclui `conflict: true`
  - ✅ Teste: Transição com conflito retorna `conflict: true`
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.3.1, TASK-1.3.2
- **Status:** ✅ Completo

#### TASK-1.3.4: Teste de Concorrência (Lost Update)
- **Descrição:** Criar teste que simula duas gravações concorrentes. Verificar que segunda detecta conflito.
- **Arquivo:** `core-engine/tests/concurrency.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: Duas transições simultâneas no mesmo objeto
  - ✅ Primeira sucesso, segunda detecta conflito
  - ✅ Estado final é consistente (não lost update)
- **Estimativa:** 1 dia
- **Dependências:** TASK-1.3.3
- **Status:** ✅ Completo

**Total Épico 1.3:** 3 dias

---

### EPIC-1.4: Locking Multi-Entity

#### TASK-1.4.1: Implementar lock múltiplo (Order + Payment)
- **Descrição:** Modificar `withLock` para aceitar múltiplos `entityIds` e travar todos antes de executar
- **Arquivo:** `core-engine/repo/InMemoryRepo.ts`
- **Critério de Pronto:**
  - ✅ `withLock([entityId1, entityId2], callback)` trava ambos
  - ✅ Ordem de lock é determinística (evita deadlock)
  - ✅ Teste: Lock múltiplo funciona
- **Estimativa:** 1 dia
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-1.4.2: Modificar PAYMENT:CONFIRMED para lock Order + Payment
- **Descrição:** Modificar transição `PAYMENT:CONFIRMED` para travar tanto Payment quanto Order
- **Arquivo:** `core-engine/executor/CoreExecutor.ts`
- **Critério de Pronto:**
  - ✅ `PAYMENT:CONFIRMED` trava `paymentId` e `orderId`
  - ✅ Teste: Transição trava ambos os objetos
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-1.4.1
- **Status:** ✅ Completo

#### TASK-1.4.3: Teste de Race Condition (PAYMENT + ORDER)
- **Descrição:** Criar teste que simula `PAYMENT:CONFIRMED` concorrente com `ORDER:CANCEL`. Verificar que não há race condition.
- **Arquivo:** `core-engine/tests/race-conditions.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: `PAYMENT:CONFIRMED` e `ORDER:CANCEL` simultâneos
  - ✅ Um sucesso, outro detecta conflito ou aguarda lock
  - ✅ Estado final é consistente (não order paid + cancelled)
- **Estimativa:** 1 dia
- **Dependências:** TASK-1.4.2
- **Status:** ✅ Completo

**Total Épico 1.4:** 2.5 dias

**TOTAL ÉPICO 1 (CORE ENGINE):** 14 dias

---

## 🎯 ÉPICO 2: FISCAL E LEGAL

### EPIC-2.1: Fiscal Server-Side

#### TASK-2.1.1: Completar lógica de processamento no worker
- **Descrição:** Mover lógica de `FiscalService.processPaymentConfirmed` para `fiscal-queue-worker.ts`
- **Arquivo:** `server/fiscal-queue-worker.ts`
- **Critério de Pronto:**
  - ✅ Worker busca order do DB
  - ✅ Worker detecta país e seleciona adapter
  - ✅ Worker cria TaxDocument
  - ✅ Worker chama `adapter.onSealed`
  - ✅ Worker registra em `fiscal_event_store`
  - ⏳ Teste: Worker processa item da fila corretamente (próxima tarefa)
- **Estimativa:** 2 dias
- **Dependências:** Nenhuma (worker já criado)
- **Status:** ✅ Completo (lógica implementada, teste pendente)

#### TASK-2.1.2: Remover processPaymentConfirmed do frontend
- **Descrição:** Remover chamada direta a `FiscalService.processPaymentConfirmed` do frontend
- **Arquivo:** `merchant-portal/src/pages/TPV/components/FiscalPrintButton.tsx`
- **Critério de Pronto:**
  - ✅ Frontend não chama `FiscalService.processPaymentConfirmed`
  - ✅ Frontend apenas chama `/api/fiscal/emit`
  - ⏳ Teste: Frontend não emite fiscal diretamente (próxima tarefa)
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-2.1.3: Validar que fiscal nunca é emitido no browser
- **Descrição:** Criar teste E2E que verifica que fiscal nunca é emitido no browser
- **Arquivo:** `tests/e2e/fiscal-server-side.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: Pagamento completo não emite fiscal no browser
  - ✅ Teste: Fiscal é adicionado à fila, não emitido diretamente
  - ✅ Teste: Worker processa fila e emite fiscal
- **Estimativa:** 1 dia
- **Dependências:** TASK-2.1.1, TASK-2.1.2
- **Status:** ✅ Completo

**Total Épico 2.1:** 3.5 dias

---

### EPIC-2.2: Retry Fiscal Automático

#### TASK-2.2.1: Implementar retry com exponential backoff
- **Descrição:** Modificar worker para retentar itens `RETRYING` com exponential backoff
- **Arquivo:** `server/fiscal-queue-worker.ts`, `supabase/migrations/20260120000002_create_fiscal_queue.sql`
- **Critério de Pronto:**
  - ✅ Worker processa itens `RETRYING` quando `next_retry_at <= NOW()` (já implementado em get_next_fiscal_queue_item)
  - ✅ Backoff: `2^attempts * 60 segundos` (já implementado em mark_fiscal_queue_failed)
  - ✅ Máximo 10 tentativas (atualizado de 5 para 10)
  - ⏳ Teste: Retry funciona com backoff correto (próxima tarefa)
- **Estimativa:** 1 dia
- **Dependências:** TASK-2.1.1
- **Status:** ✅ Completo (lógica já estava implementada, apenas ajustes de logging e max_retries)

#### TASK-2.2.2: Marcar como FAILED após máximo de tentativas
- **Descrição:** Após 10 tentativas, marcar item como `FAILED` e notificar admin
- **Arquivo:** `server/fiscal-queue-worker.ts`, `supabase/migrations/20260120000002_create_fiscal_queue.sql`
- **Critério de Pronto:**
  - ✅ Após 10 tentativas, status = `FAILED` (já implementado em mark_fiscal_queue_failed)
  - ✅ `error_history` contém histórico de erros (campo JSONB adicionado)
  - ✅ Log crítico quando item falha permanentemente
  - ⏳ Teste: Item falha após 10 tentativas (próxima tarefa)
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-2.2.1
- **Status:** ✅ Completo

#### TASK-2.2.3: Teste de Retry Automático
- **Descrição:** Criar teste que simula falha de API e verifica retry automático
- **Arquivo:** `tests/integration/fiscal-retry.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: API falha, item é marcado como `RETRYING`
  - ✅ Teste: Após backoff, item é retentado (retry_count incrementado)
  - ✅ Teste: Após max retries, item é marcado como `FAILED`
  - ✅ Teste: Backoff exponencial calculado corretamente
- **Estimativa:** 1 dia
- **Dependências:** TASK-2.2.2
- **Status:** ✅ Completo

**Total Épico 2.2:** 2.5 dias

---

### EPIC-2.3: Cálculo de IVA Correto

#### TASK-2.3.1: Separar vatRate de vatAmount
- **Descrição:** Modificar `TaxDocument` para ter `vatRate` (percentual) e `vatAmount` (valor absoluto) separados
- **Arquivo:** `fiscal-modules/types.ts`, `server/fiscal-queue-worker.ts`, `merchant-portal/src/core/fiscal/FiscalService.ts`, `fiscal-modules/adapters/*.ts`
- **Critério de Pronto:**
  - ✅ `TaxDocument` tem `vatRate: number` (0.23 = 23%)
  - ✅ `TaxDocument` tem `vatAmount: number` (valor em centavos)
  - ✅ Teste: Criação de TaxDocument com ambos os campos (4 testes passando)
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-2.3.2: Corrigir InvoiceXpressAdapter
- **Descrição:** Modificar `InvoiceXpressAdapter` para usar `vatRate` corretamente no cálculo
- **Arquivo:** `fiscal-modules/adapters/InvoiceXpressAdapter.ts`, `server/fiscal/InvoiceXpressAdapterServer.ts`, `server/fiscal-queue-worker.ts`
- **Critério de Pronto:**
  - ✅ `unit_price_without_tax = unit_price / (1 + vatRate)` (corrigido)
  - ✅ `vatAmount` é calculado corretamente (usando vatRate do TaxDocument)
  - ✅ Teste: Cálculo de IVA está correto (4 testes passando)
- **Estimativa:** 1 dia
- **Dependências:** TASK-2.3.1
- **Status:** ✅ Completo

#### TASK-2.3.3: Teste de Cálculo Fiscal
- **Descrição:** Criar teste que valida cálculo fiscal completo
- **Arquivo:** `tests/unit/fiscal-calculation.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: Produto €10.00 + IVA 23% = €12.30 total
  - ✅ Teste: Base tributável = €10.00
  - ✅ Teste: IVA = €2.30
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-2.3.2
- **Status:** ✅ Completo

**Total Épico 2.3:** 2 dias

---

### EPIC-2.4: Validação de Pagamento Total

#### TASK-2.4.1: Validar payment_status = PAID antes de emitir
- **Descrição:** Modificar endpoint `/api/fiscal/emit` para validar que `payment_status = 'paid'` antes de adicionar à fila
- **Arquivo:** `server/web-module-api-server.ts`
- **Critério de Pronto:**
  - ✅ Endpoint valida `payment_status = 'paid'` ou `'PAID'`
  - ✅ Endpoint valida `total_paid >= orderTotal`
  - ✅ Endpoint valida `amountCents = orderTotal` (TASK-2.4.1 adicionado)
  - ✅ Se inválido, retorna erro 400
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma (já implementado, validar)
- **Status:** ✅ Completo

#### TASK-2.4.2: Teste de Validação de Pagamento
- **Descrição:** Criar teste que valida que fiscal não emite se pagamento parcial
- **Arquivo:** `tests/integration/fiscal-payment-validation.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: Pagamento parcial rejeita emissão fiscal
  - ✅ Teste: Pagamento total permite emissão fiscal
  - ✅ Teste: amountCents diferente rejeita emissão fiscal
  - ⚠️ Nota: Testes de integração requerem DATABASE_URL e schema correto
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-2.4.1
- **Status:** ✅ Completo (testes criados, podem precisar ajustes de schema)

**Total Épico 2.4:** 1 dia

**TOTAL ÉPICO 2 (FISCAL E LEGAL):** 9 dias

---

## 🎯 ÉPICO 3: SEGURANÇA

### EPIC-3.1: OAuth Seguro

#### TASK-3.1.1: Criar endpoint backend para token exchange
- **Descrição:** Criar endpoint `/api/oauth/exchange` que recebe código OAuth e troca por token no backend
- **Arquivo:** `server/web-module-api-server.ts`
- **Critério de Pronto:**
  - ✅ Endpoint recebe `code` e `provider` (ubereats, deliveroo, glovo)
  - ✅ Endpoint busca `client_secret` de variáveis de ambiente (backend, não frontend)
  - ✅ Endpoint troca código por token
  - ✅ Endpoint salva tokens em `integration_credentials`
  - ✅ Endpoint retorna token (será criptografado na TASK-3.1.2)
  - ✅ Teste: Validação de parâmetros funciona
- **Estimativa:** 2 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-3.1.2: Criptografar tokens no DB
- **Descrição:** Criptografar tokens OAuth antes de salvar no DB
- **Arquivo:** `server/middleware/security.ts`
- **Critério de Pronto:**
  - ✅ Tokens são criptografados antes de salvar
  - ✅ Tokens são descriptografados ao ler
  - ✅ Chave de criptografia está em variável de ambiente
  - ✅ Teste: Token criptografado não é legível no DB
- **Estimativa:** 1 dia
- **Dependências:** TASK-3.1.1
- **Status:** 🔴 Não Iniciado

#### TASK-3.1.3: Remover client_secret do frontend
- **Descrição:** Remover todas as referências a `client_secret` do frontend
- **Arquivo:** `merchant-portal/src/integrations/adapters/**/*.ts`
- **Critério de Pronto:**
  - ✅ Frontend não contém `client_secret`
  - ✅ Frontend chama `/api/oauth/exchange` em vez de fazer OAuth direto
  - ✅ Teste: Frontend não expõe client_secret
- **Estimativa:** 1 dia
- **Dependências:** TASK-3.1.1
- **Status:** 🔴 Não Iniciado

**Total Épico 3.1:** 4 dias

---

### EPIC-3.2: Bypass de Dev Restrito

#### TASK-3.2.1: Restringir skip_activation a desenvolvimento
- **Descrição:** Modificar `RequireActivation` para verificar `NODE_ENV === 'development'` antes de permitir bypass
- **Arquivo:** `merchant-portal/src/core/activation/RequireActivation.tsx`
- **Critério de Pronto:**
  - ✅ Bypass só funciona se `import.meta.env.DEV === true`
  - ✅ Em produção, bypass é ignorado
  - ✅ Teste: Bypass não funciona em produção
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-3.2.2: Remover outros bypasses de dev
- **Descrição:** Buscar e remover outros bypasses de dev (skip_onboarding, etc)
- **Arquivo:** `merchant-portal/src/**/*.tsx`
- **Critério de Pronto:**
  - ✅ Nenhum bypass funciona em produção
  - ✅ Todos os bypasses verificam `NODE_ENV`
  - ✅ Teste: Bypasses não funcionam em produção
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-3.2.1
- **Status:** ✅ Completo (skip_activation corrigido em RequireActivation e DashboardZero, useCoreHealth já verifica DEV)

**Total Épico 3.2:** 1 dia

---

### EPIC-3.3: DB como Fonte de Verdade

#### TASK-3.3.1: Modificar RequireActivation para verificar DB primeiro
- **Descrição:** Modificar `RequireActivation` para sempre verificar DB antes de confiar em localStorage
- **Arquivo:** `merchant-portal/src/core/activation/RequireActivation.tsx`
- **Critério de Pronto:**
  - ✅ `RequireActivation` verifica DB primeiro
  - ✅ localStorage é usado apenas como cache
  - ✅ Se DB e cache divergem, DB vence
  - ✅ Teste: Estado crítico sempre vem do DB
- **Estimativa:** 1 dia
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-3.3.2: Modificar DashboardZero para verificar DB primeiro
- **Descrição:** Mesmo que TASK-3.3.1, mas para `DashboardZero`
- **Arquivo:** `merchant-portal/src/pages/Dashboard/DashboardZero.tsx`
- **Critério de Pronto:**
  - ✅ `DashboardZero` verifica DB primeiro
  - ✅ Teste: Estado crítico sempre vem do DB
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-3.3.1
- **Status:** ✅ Completo

#### TASK-3.3.3: Teste de Manipulação de localStorage
- **Descrição:** Criar teste que tenta burlar guards via localStorage
- **Arquivo:** `tests/e2e/security-localstorage.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: Manipular localStorage não burla guards
  - ✅ Teste: Sistema sempre verifica DB
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-3.3.2
- **Status:** ✅ Completo

**Total Épico 3.3:** 2 dias

---

### EPIC-3.4: Webhooks Assinados

#### TASK-3.4.1: Implementar validação de assinatura Glovo
- **Descrição:** Validar assinatura HMAC dos webhooks Glovo
- **Arquivo:** `server/web-module-api-server.ts`
- **Critério de Pronto:**
  - ✅ Webhook Glovo valida assinatura HMAC
  - ✅ Webhooks não assinados são rejeitados
  - ✅ Teste: Webhook falso é rejeitado
- **Estimativa:** 1 dia
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-3.4.2: Implementar validação de assinatura UberEats
- **Descrição:** Mesmo que TASK-3.4.1, mas para UberEats
- **Arquivo:** `server/web-module-api-server.ts`
- **Critério de Pronto:**
  - ✅ Webhook UberEats valida assinatura
  - ✅ Teste: Webhook falso é rejeitado
- **Estimativa:** 1 dia
- **Dependências:** TASK-3.4.1
- **Status:** ✅ Completo

**Total Épico 3.4:** 2 dias

**TOTAL ÉPICO 3 (SEGURANÇA):** 9 dias

---

## 🎯 ÉPICO 4: OFFLINE

### EPIC-4.1: Idempotência na Fila Offline

#### TASK-4.1.1: Adicionar idempotency_key a operações
- **Descrição:** Modificar fila offline para incluir `idempotency_key` em todas as operações
- **Arquivo:** `merchant-portal/src/core/queue/useOfflineReconciler.ts`
- **Critério de Pronto:**
  - ✅ Todas as operações têm `idempotency_key` único
  - ✅ `idempotency_key` é baseado em conteúdo + timestamp
  - ✅ Teste: Operações têm idempotency_key
- **Estimativa:** 1 dia
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-4.1.2: Verificar idempotency_key antes de aplicar
- **Descrição:** Modificar backend para verificar `idempotency_key` antes de aplicar operação
- **Arquivo:** `server/web-module-api-server.ts`
- **Critério de Pronto:**
  - ✅ Backend verifica se `idempotency_key` já foi processado
  - ✅ Se já processado, retorna resultado anterior (idempotente)
  - ✅ Teste: Operação duplicada não é aplicada duas vezes
- **Estimativa:** 1.5 dias
- **Dependências:** TASK-4.1.1
- **Status:** ✅ Completo

#### TASK-4.1.3: Teste de Duplicação Offline
- **Descrição:** Criar teste que simula retry de operação offline
- **Arquivo:** `tests/integration/offline-idempotency.test.ts` (novo)
- **Critério de Pronto:**
  - ✅ Teste: Operação enviada duas vezes não duplica
  - ✅ Teste: Retry após falha não duplica
- **Estimativa:** 1 dia
- **Dependências:** TASK-4.1.2
- **Status:** ✅ Completo

**Total Épico 4.1:** 3.5 dias

---

### EPIC-4.2: Polling Otimizado

#### TASK-4.2.1: Aumentar intervalo de polling
- **Descrição:** Modificar polling de 1s para 5-10s
- **Arquivo:** `merchant-portal/src/core/queue/useOfflineReconciler.ts`
- **Critério de Pronto:**
  - ✅ Polling padrão: 5s
  - ✅ Polling quando offline: 10s
  - ✅ Teste: Polling não é agressivo
- **Estimativa:** 0.5 dias
- **Dependências:** Nenhuma
- **Status:** ✅ Completo

#### TASK-4.2.2: Implementar polling adaptativo
- **Descrição:** Polling mais agressivo quando há itens pendentes, menos quando vazio
- **Arquivo:** `merchant-portal/src/core/queue/useOfflineReconciler.ts`
- **Critério de Pronto:**
  - ✅ Polling adapta-se ao número de itens pendentes
  - ✅ Teste: Polling é eficiente
- **Estimativa:** 0.5 dias
- **Dependências:** TASK-4.2.1
- **Status:** ✅ Completo

**Total Épico 4.2:** 1 dia

**TOTAL ÉPICO 4 (OFFLINE):** 4.5 dias

---

## 📊 RESUMO DO BACKLOG

### Totais por Épico

| Épico | Tarefas | Dias | Status |
|-------|---------|------|--------|
| **Épico 1: Core Engine** | 20 | 14 | 🔴 Não Iniciado |
| **Épico 2: Fiscal e Legal** | 10 | 9 | 🟡 Parcialmente Iniciado |
| **Épico 3: Segurança** | 9 | 9 | 🔴 Não Iniciado |
| **Épico 4: Offline** | 5 | 4.5 | 🔴 Não Iniciado |
| **TOTAL** | **44 tarefas** | **36.5 dias** | |

### Distribuição por Semana

**Semana 1-2 (14 dias):** Épico 1 - Core Engine  
**Semana 3 (9 dias):** Épico 2 - Fiscal e Legal  
**Semana 4 (9 dias):** Épico 3 - Segurança  
**Semana 5 (4.5 dias):** Épico 4 - Offline + Buffer

**Total:** 36.5 dias (margem para 40 dias)

---

## ✅ CRITÉRIOS DE PRONTO (Geral)

### Para Cada Tarefa
- ✅ Código implementado
- ✅ Teste unitário/integração passando
- ✅ Critério de pronto específico atendido
- ✅ Code review aprovado

### Para Cada Épico
- ✅ Todas as tarefas completas
- ✅ Testes de integração passando
- ✅ Documentação atualizada

### Para Sprint 0 Completo
- ✅ Todos os 15 itens obrigatórios completos
- ✅ Testes de carga passaram (100 pedidos simultâneos)
- ✅ Testes de offline passaram (50 pedidos pendentes)
- ✅ Testes de fiscal passaram (retry automático)
- ✅ Zero problemas P0 pendentes

---

## 🎯 PRÓXIMOS PASSOS

### Esta Semana (Dias 1-7)
1. **Iniciar:** Épico 1 - Core Engine
2. **Focar:** TASK-1.1.1 até TASK-1.1.8 (Transações Atômicas)
3. **Validar:** Teste de falha parcial (rollback) funciona

### Próximas 2 Semanas (Dias 8-21)
4. **Completar:** Épico 1 (Core Engine)
5. **Iniciar:** Épico 2 (Fiscal e Legal)
6. **Validar:** Fiscal nunca é emitido no browser

### Próximo Mês (Dias 22-40)
7. **Completar:** Épicos 2, 3 e 4
8. **Validar:** Todos os testes de integração passam
9. **Decidir:** Pronto para piloto controlado?

---

**Documento Criado:** 2026-01-20  
**Status:** ✅ **BACKLOG EXECUTÁVEL** - 44 tarefas, 36.5 dias, zero glamour  
**Próximo Review:** Após completar Semana 1-2 (Core Engine)
