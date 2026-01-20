# 🚨 RESPOSTA À AUDITORIA CRÍTICA

**Data:** 2026-01-20  
**Auditoria:** Técnica Brutal - Achados Críticos  
**Status:** 🔴 CRÍTICO - Ação Imediata Necessária

---

## 📊 RESUMO EXECUTIVO

### **Notas da Auditoria:**
- **Técnica:** 4/10
- **Produto:** 5/10
- **Mercado:** 3/10

### **Vendável Hoje?**
❌ **NÃO** - Apenas para piloto controlado (1 restaurante, baixo volume, operação tolerante a falhas)

### **Perigoso Usar Hoje?**
✅ **SIM** - Fiscal e pagamentos não estão protegidos contra corrida, duplicação e adulteração

### **Compete com last.app?**
- **Agora:** ❌ Não
- **Em 6 meses:** ⚠️ Apenas se corrigir fiscal server-side, idempotência offline e segurança OAuth
- **Nunca:** Se não corrigir os problemas críticos

---

## 🔴 PROBLEMAS CRÍTICOS (P0) - CORREÇÃO IMEDIATA

### **1. Transações Não Atômicas** 🔥
**Severidade:** CRÍTICA  
**Risco:** Estado em meio-termo, rollback fictício, perda de dados

**Problema:**
- Efeitos escrevem direto no repositório fora do `txId`
- Objetos são mutados por referência
- Rollback não funciona se guard/effect falhar

**Localização:**
- `core-engine/effects/index.ts` chamando `repo.saveOrder(order)` sem `txId`
- Padrão de mutação direta do objeto retornado por `getOrder`

**Tarefa:**
```
Tornar efeitos e mutations 100% transacionais no CoreEngine
```

**Plano de Correção:**
1. Criar contexto transacional (`TransactionContext`) que encapsula `txId`
2. Modificar `CoreExecutor` para passar `txId` para todos os efeitos
3. Modificar `InMemoryRepo` para aceitar `txId` em todas as operações de escrita
4. Implementar rollback real (desfazer mudanças se transação falhar)
5. Evitar mutação direta (usar cópias imutáveis)

**Estimativa:** 3-5 dias

---

### **2. Locking Otimista Ilusório** 🔥
**Severidade:** CRÍTICA  
**Risco:** Lost updates silenciosos, divergência de dados

**Problema:**
- `InMemoryRepo` incrementa `version`, mas nunca compara `version` anterior
- Não usa snapshot para bloquear writes concorrentes
- Permite lost updates silenciosos

**Localização:**
- `core-engine/repo/InMemoryRepo.ts`

**Tarefa:**
```
Implementar verificação de versão e detecção de conflito no repositório
```

**Plano de Correção:**
1. Modificar `saveOrder` para comparar `version` antes de salvar
2. Lançar `ConcurrentModificationError` se `version` não bater
3. Implementar snapshot do estado anterior antes de modificar
4. Adicionar retry automático com backoff exponencial
5. Testar com múltiplas threads/concorrência simulada

**Estimativa:** 2-3 dias

---

### **3. Locking Cross-Entity Faltando** 🔥
**Severidade:** CRÍTICA  
**Risco:** Race conditions, estado inconsistente

**Problema:**
- `CoreExecutor` bloqueia apenas `entityId` da transição
- Em `PAYMENT:CONFIRM`, código altera `ORDER` sem adquirir lock do pedido
- Abre race conditions com outras ações no mesmo order

**Localização:**
- `core-engine/executor/CoreExecutor.ts`
- Efeitos que modificam múltiplas entidades

**Tarefa:**
```
Adicionar locking multi-entity para transições que afetam Order + Payment
```

**Plano de Correção:**
1. Identificar todas as transições que afetam múltiplas entidades
2. Modificar `CoreExecutor` para adquirir locks de todas as entidades envolvidas
3. Implementar deadlock detection e timeout
4. Adicionar testes de concorrência para validar
5. Documentar regras de locking por transição

**Estimativa:** 2-3 dias

---

### **4. Acesso Direto a Internals do Repo** ⚠️
**Severidade:** ALTA  
**Risco:** Quebra de encapsulamento, impossível trocar persistência

**Problema:**
- Guards/effects/executor iteram `repo.orders` diretamente via `(repo as any).orders`
- Não funciona com outra implementação de repo
- Ignora contexto transacional

**Localização:**
- `core-engine/effects/index.ts`
- Guards que buscam pagamentos

**Tarefa:**
```
Adicionar métodos de consulta de pagamentos ao repositório
```

**Plano de Correção:**
1. Adicionar método `getPaymentsByOrder(orderId, txId?)` ao `IRepository`
2. Implementar em `InMemoryRepo`
3. Substituir todos os acessos diretos por chamadas ao método
4. Remover `(repo as any)` casts
5. Adicionar testes para validar encapsulamento

**Estimativa:** 1-2 dias

---

### **5. Cálculo Fiscal Incorreto** 🔥
**Severidade:** CRÍTICA  
**Risco:** IVA errado, base tributável incorreta, problemas legais

**Problema:**
- `taxes.vat` recebe `vatAmount` (valor), mas `InvoiceXpressAdapter` trata como taxa
- `unit_price_without_tax = unit_price / (1 + vat)` gera IVA errado
- Base tributável incorreta

**Localização:**
- `merchant-portal/src/core/fiscal/FiscalService.ts`
- `fiscal-modules/adapters/InvoiceXpressAdapter.ts`

**Tarefa:**
```
Corrigir representação de IVA no TaxDocument e cálculo do subtotal
```

**Plano de Correção:**
1. Separar `vatRate` (taxa) de `vatAmount` (valor) no `TaxDocument`
2. Corrigir `InvoiceXpressAdapter` para usar `vatRate` no cálculo
3. Validar cálculos com exemplos reais (23% IVA)
4. Adicionar testes unitários para cálculos fiscais
5. Documentar formato esperado de `TaxDocument`

**Estimativa:** 1-2 dias

---

### **6. Emissão Fiscal no Pagamento Parcial** 🔥
**Severidade:** CRÍTICA  
**Risco:** Documento fiscal parcial, bloqueio de emissão definitiva

**Problema:**
- `TPV.tsx` chama `processPaymentConfirmed` imediatamente após `pay`
- Não há verificação de múltiplos pagamentos/partes
- Pode emitir documento fiscal com valor parcial
- Bloqueia emissão definitiva por `UNIQUE(order_id, doc_type)`

**Localização:**
- `merchant-portal/src/pages/TPV/TPV.tsx`
- `merchant-portal/src/core/fiscal/FiscalService.ts`

**Tarefa:**
```
Emitir fiscal apenas quando o pedido estiver totalmente pago
```

**Plano de Correção:**
1. Modificar `processPaymentConfirmed` para verificar se pedido está totalmente pago
2. Adicionar verificação: `totalPaid >= orderTotal`
3. Só emitir fiscal quando `payment_status = 'PAID'` (não `PARTIALLY_PAID`)
4. Adicionar flag `fiscalEmitted` para evitar duplicação
5. Testar com split bill (múltiplos pagamentos)

**Estimativa:** 1 dia

---

### **7. Emissão Fiscal no Cliente (Browser)** 🔥
**Severidade:** CRÍTICA  
**Risco:** Frágil para offline, fácil de adulterar, difícil de auditar legalmente

**Problema:**
- `FiscalService` roda no front-end
- `InvoiceXpressAdapter` usa `localStorage + fetch` direto
- Frágil para offline, fácil de adulterar, difícil de auditar

**Localização:**
- `merchant-portal/src/core/fiscal/FiscalService.ts`
- `fiscal-modules/adapters/InvoiceXpressAdapter.ts`

**Tarefa:**
```
Mover emissão fiscal para backend confiável com fila durável
```

**Plano de Correção:**
1. Criar endpoint `/api/fiscal/emit` no backend
2. Criar fila durável de emissão fiscal (usar PostgreSQL ou Redis)
3. Mover `FiscalService` para backend
4. Implementar worker de retry robusto com backoff exponencial
5. Adicionar auditoria imutável de tentativas de emissão
6. Remover código fiscal do frontend

**Estimativa:** 5-7 dias

---

### **8. OAuth com client_secret no Browser** 🔥
**Severidade:** CRÍTICA  
**Risco:** Expõe segredos, permite hijack, fraude

**Problema:**
- `UberEatsOAuth`, `DeliverooOAuth`, `GlovoOAuth` fazem token exchange no cliente
- Usam `clientSecret` no browser
- Expõe segredos e permite hijack

**Localização:**
- `integrations/adapters/uber-eats/UberEatsOAuth.ts`
- `integrations/adapters/deliveroo/DeliverooOAuth.ts`
- `integrations/adapters/glovo/GlovoOAuth.ts`

**Tarefa:**
```
Remover OAuth client_secret do front-end e criptografar tokens
```

**Plano de Correção:**
1. Criar endpoint `/api/integrations/oauth/exchange` no backend
2. Mover token exchange para backend
3. Criptografar tokens antes de armazenar no Supabase
4. Remover `clientSecret` do frontend
5. Implementar refresh token automático no backend
6. Adicionar auditoria de acessos OAuth

**Estimativa:** 3-4 dias

---

### **9. Fila Offline Sem Idempotência** 🔥
**Severidade:** CRÍTICA  
**Risco:** Duplicação de pedidos, perdas financeiras

**Problema:**
- `useOfflineReconciler` reenvia `ORDER_CREATE/UPDATE/CLOSE` sem idempotency key
- Em perda de resposta, vai duplicar ações
- Gera perdas financeiras

**Localização:**
- `merchant-portal/src/core/queue/useOfflineReconciler.ts`

**Tarefa:**
```
Adicionar idempotência a operações da fila offline
```

**Plano de Correção:**
1. Gerar `idempotencyKey` único para cada operação offline
2. Armazenar `idempotencyKey` na fila offline
3. Enviar `idempotencyKey` em todas as requisições
4. Backend deve validar e rejeitar duplicatas
5. Adicionar deduplicação na fila antes de enviar
6. Testar com simulação de perda de resposta

**Estimativa:** 2-3 dias

---

## 📊 PRIORIZAÇÃO DE CORREÇÕES

### **Fase 1: Críticos de Segurança e Fiscal (1-2 semanas)**
1. **Emissão Fiscal no Cliente** (P0) - 5-7 dias
2. **OAuth com client_secret no Browser** (P0) - 3-4 dias
3. **Cálculo Fiscal Incorreto** (P0) - 1-2 dias
4. **Emissão Fiscal no Pagamento Parcial** (P0) - 1 dia

**Total:** 10-14 dias

### **Fase 2: Concorrência e Atomicidade (1 semana)**
5. **Transações Não Atômicas** (P0) - 3-5 dias
6. **Locking Otimista Ilusório** (P0) - 2-3 dias
7. **Locking Cross-Entity** (P0) - 2-3 dias

**Total:** 7-11 dias

### **Fase 3: Robustez Offline (3-4 dias)**
8. **Fila Offline Sem Idempotência** (P0) - 2-3 dias
9. **Acesso Direto a Internals do Repo** (P1) - 1-2 dias

**Total:** 3-5 dias

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### **Sprint 1 (2 semanas): Segurança e Fiscal**
**Objetivo:** Corrigir problemas que podem gerar prejuízo financeiro e legal

1. Mover emissão fiscal para backend (5-7 dias)
2. Remover OAuth client_secret do frontend (3-4 dias)
3. Corrigir cálculo fiscal (1-2 dias)
4. Emitir fiscal apenas quando totalmente pago (1 dia)

**Resultado:** Sistema seguro para uso em produção (com restrições)

---

### **Sprint 2 (1 semana): Concorrência**
**Objetivo:** Garantir atomicidade e prevenir race conditions

1. Tornar transações atômicas (3-5 dias)
2. Implementar locking otimista real (2-3 dias)
3. Adicionar locking cross-entity (2-3 dias)

**Resultado:** Sistema robusto para uso concorrente

---

### **Sprint 3 (3-4 dias): Offline**
**Objetivo:** Garantir idempotência e encapsulamento

1. Adicionar idempotência à fila offline (2-3 dias)
2. Corrigir acesso direto a internals (1-2 dias)

**Resultado:** Sistema confiável para uso offline

---

## 🚨 RISCOS E MITIGAÇÕES

### **Risco 1: Quebrar Funcionalidade Existente**
**Mitigação:**
- Testes unitários antes de cada correção
- Testes de integração após cada sprint
- Deploy incremental (não tudo de uma vez)

### **Risco 2: Tempo de Correção Subestimado**
**Mitigação:**
- Adicionar 20% de buffer em cada estimativa
- Priorizar correções críticas primeiro
- Aceitar que algumas correções podem ser incrementais

### **Risco 3: Regressões em Produção**
**Mitigação:**
- Feature flags para novas implementações
- Rollback plan para cada correção
- Monitoramento intensivo após cada deploy

---

## ✅ CRITÉRIOS DE SUCESSO

### **Após Sprint 1:**
- ✅ Fiscal emitido apenas no backend
- ✅ OAuth seguro (sem client_secret no browser)
- ✅ Cálculos fiscais corretos
- ✅ Fiscal emitido apenas quando totalmente pago

### **Após Sprint 2:**
- ✅ Transações 100% atômicas
- ✅ Locking otimista funcional
- ✅ Locking cross-entity implementado
- ✅ Sem race conditions em testes de concorrência

### **Após Sprint 3:**
- ✅ Fila offline com idempotência
- ✅ Repositório encapsulado (sem acesso direto)
- ✅ Testes de offline passando

---

## 📝 NOTAS

### **Pontos Fortes Identificados:**
- ✅ Uso consistente de centavos (evita erros de ponto flutuante)
- ✅ Guards/effects separados com máquina de estados explícita
- ✅ FiscalEventStore com RLS e índices
- ✅ Retry com backoff no adapter fiscal

### **Maior Risco Oculto:**
Emissão fiscal parcial/incorreta por falhas de transação e cálculo tributário.

### **Maior Vantagem Estratégica:**
Arquitetura explícita de regras (guards/effects/state machine), que facilita auditoria e evolução — **se corrigirem a execução**.

---

## 🎯 PRÓXIMOS PASSOS

### **Imediato:**
1. Revisar e aprovar este plano de ação
2. Priorizar correções baseado em risco de negócio
3. Alocar recursos para Sprint 1 (Segurança e Fiscal)

### **Curto Prazo:**
1. Iniciar Sprint 1 (correções críticas)
2. Criar testes para validar correções
3. Documentar mudanças arquiteturais

### **Médio Prazo:**
1. Completar Sprints 2 e 3
2. Validar sistema em ambiente de staging
3. Preparar para produção com todas as correções

---

**Status:** 🔴 CRÍTICO - Ação Imediata Necessária  
**Prioridade:** P0 - Todos os problemas críticos  
**Estimativa Total:** 20-30 dias (3-4 sprints)  
**Última atualização:** 2026-01-20
