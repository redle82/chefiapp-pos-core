# ✅ SPRINT 0: CHECKLIST DE CONCLUSÃO
## Critérios Objetivos para "Sprint 0 Completo"

**Data:** 2026-01-20  
**Objetivo:** Definir critérios binários e testáveis para conclusão do Sprint 0  
**Filosofia:** "Não depende de opinião, nem de confiança cega"

---

## 🎯 VEREDITO FINAL: SPRINT 0 COMPLETO

### Critério Único e Objetivo

**Sprint 0 está completo quando:**
- ✅ Todos os 15 itens obrigatórios do `PLANO_HARDENING_PRODUCAO_2026_01_20.md` estão implementados
- ✅ Todos os 44 testes do backlog passam
- ✅ Testes de integração críticos passam (carga, offline, fiscal)
- ✅ Zero problemas P0 pendentes

**Não está completo se:**
- ❌ Qualquer P0 do checklist obrigatório está pendente
- ❌ Testes de integração falham
- ❌ Qualquer teste do backlog falha

---

## 📋 CHECKLIST POR ÉPICO

### ✅ ÉPICO 1: CORE ENGINE (14 dias, 20 tarefas)

#### Transações Atômicas
- [ ] **TASK-1.1.1 até TASK-1.1.8:** Todas completas
- [ ] **Teste de Rollback:** Passa (falha parcial não deixa estado inconsistente)
- [ ] **Critério:** `lockItems` sucesso + `applyPaymentToOrder` falha → rollback completo

#### Isolamento Transacional
- [ ] **TASK-1.2.1 até TASK-1.2.7:** Todas completas
- [ ] **Teste de Isolamento:** Passa (modificação fora de transação não afeta estado interno)
- [ ] **Critério:** `getOrder` retorna clone, modificação não afeta original

#### Verificação de Versão
- [ ] **TASK-1.3.1 até TASK-1.3.4:** Todas completas
- [ ] **Teste de Concorrência:** Passa (duas gravações simultâneas detectam conflito)
- [ ] **Critério:** Lost update não ocorre, conflito é detectado

#### Locking Multi-Entity
- [ ] **TASK-1.4.1 até TASK-1.4.3:** Todas completas
- [ ] **Teste de Race Condition:** Passa (PAYMENT:CONFIRMED + ORDER:CANCEL não causam race)
- [ ] **Critério:** Estado final consistente (não order paid + cancelled)

**✅ Épico 1 Completo Quando:**
- ✅ 20 tarefas completas
- ✅ 4 testes de integração passando
- ✅ Zero race conditions detectadas

---

### ✅ ÉPICO 2: FISCAL E LEGAL (9 dias, 10 tarefas)

#### Fiscal Server-Side
- [ ] **TASK-2.1.1 até TASK-2.1.3:** Todas completas
- [ ] **Teste E2E:** Passa (fiscal nunca é emitido no browser)
- [ ] **Critério:** Worker processa fila, frontend apenas adiciona à fila

#### Retry Automático
- [ ] **TASK-2.2.1 até TASK-2.2.3:** Todas completas
- [ ] **Teste de Retry:** Passa (API falha → retry automático → sucesso)
- [ ] **Critério:** Exponential backoff funciona, máximo 10 tentativas

#### Cálculo de IVA
- [ ] **TASK-2.3.1 até TASK-2.3.3:** Todas completas
- [ ] **Teste de Cálculo:** Passa (IVA calculado corretamente)
- [ ] **Critério:** Produto €10.00 + IVA 23% = €12.30 total, base tributável €10.00

#### Validação de Pagamento
- [ ] **TASK-2.4.1 até TASK-2.4.2:** Todas completas
- [ ] **Teste de Validação:** Passa (fiscal não emite se pagamento parcial)
- [ ] **Critério:** Endpoint valida `payment_status = 'paid'` e `total_amount`

**✅ Épico 2 Completo Quando:**
- ✅ 10 tarefas completas
- ✅ 4 testes de integração passando
- ✅ Zero faturas emitidas no browser
- ✅ Zero faturas perdidas (retry funciona)

---

### ✅ ÉPICO 3: SEGURANÇA (9 dias, 9 tarefas)

#### OAuth Seguro
- [ ] **TASK-3.1.1 até TASK-3.1.3:** Todas completas
- [ ] **Teste de Segurança:** Passa (client_secret nunca exposto no frontend)
- [ ] **Critério:** Tokens criptografados no DB, frontend não vê client_secret

#### Bypass Restrito
- [ ] **TASK-3.2.1 até TASK-3.2.2:** Todas completas
- [ ] **Teste de Bypass:** Passa (bypass não funciona em produção)
- [ ] **Critério:** `skip_activation` só funciona se `NODE_ENV === 'development'`

#### DB como Fonte de Verdade
- [ ] **TASK-3.3.1 até TASK-3.3.3:** Todas completas
- [ ] **Teste de Manipulação:** Passa (localStorage manipulado não burla guards)
- [ ] **Critério:** Estado crítico sempre vem do DB, localStorage apenas cache

#### Webhooks Assinados
- [ ] **TASK-3.4.1 até TASK-3.4.2:** Todas completas
- [ ] **Teste de Assinatura:** Passa (webhook falso é rejeitado)
- [ ] **Critério:** Webhooks Glovo/UberEats validam assinatura HMAC

**✅ Épico 3 Completo Quando:**
- ✅ 9 tarefas completas
- ✅ 4 testes de segurança passando
- ✅ Zero vulnerabilidades críticas

---

### ✅ ÉPICO 4: OFFLINE (4.5 dias, 5 tarefas)

#### Idempotência
- [ ] **TASK-4.1.1 até TASK-4.1.3:** Todas completas
- [ ] **Teste de Duplicação:** Passa (operação enviada duas vezes não duplica)
- [ ] **Critério:** `idempotency_key` previne duplicação, retry não duplica

#### Polling Otimizado
- [ ] **TASK-4.2.1 até TASK-4.2.2:** Todas completas
- [ ] **Teste de Performance:** Passa (polling não é agressivo)
- [ ] **Critério:** Polling padrão 5s, adaptativo baseado em itens pendentes

**✅ Épico 4 Completo Quando:**
- ✅ 5 tarefas completas
- ✅ 2 testes de integração passando
- ✅ Zero pedidos duplicados em retry

---

## 🧪 TESTES DE INTEGRAÇÃO CRÍTICOS

### Teste 1: Carga e Concorrência
- [ ] **100 pedidos simultâneos:** Passa
- [ ] **Critério:** Zero estados inconsistentes, zero lost updates
- [ ] **Tempo máximo:** 30 segundos

### Teste 2: Offline → Online
- [ ] **50 pedidos pendentes:** Passa
- [ ] **Critério:** Zero duplicações, 100% reconciliação
- [ ] **Tempo máximo:** 5 minutos

### Teste 3: Fiscal com Falhas
- [ ] **Simular falha de API:** Passa
- [ ] **Critério:** Retry automático funciona, 100% das faturas emitidas
- [ ] **Tempo máximo:** 10 minutos (com backoff)

### Teste 4: Segurança
- [ ] **Tentativa de bypass:** Passa
- [ ] **Critério:** Bypass não funciona em produção
- [ ] **Tempo máximo:** 1 minuto

### Teste 5: Race Conditions
- [ ] **PAYMENT:CONFIRMED + ORDER:CANCEL simultâneos:** Passa
- [ ] **Critério:** Estado final consistente (não order paid + cancelled)
- **Tempo máximo:** 5 segundos

---

## 📊 MÉTRICAS FINAIS

### Métricas Técnicas (Obrigatórias)

| Métrica | Meta | Status |
|---------|------|--------|
| **Transações Atômicas** | 100% | [ ] |
| **Detecção de Conflito** | 100% | [ ] |
| **Fiscal Server-Side** | 100% | [ ] |
| **Retry Fiscal Automático** | 100% | [ ] |
| **OAuth Seguro** | 100% | [ ] |
| **Idempotência Offline** | 100% | [ ] |

### Métricas de Negócio (Obrigatórias)

| Métrica | Meta | Status |
|---------|------|--------|
| **Pedidos Duplicados** | 0% | [ ] |
| **Faturas Perdidas** | 0% | [ ] |
| **Estados Inconsistentes** | 0% | [ ] |
| **Vulnerabilidades Críticas** | 0 | [ ] |

---

## ✅ CRITÉRIO FINAL DE CONCLUSÃO

### Sprint 0 está completo quando:

1. ✅ **Todos os 4 épicos completos:**
   - Épico 1: Core Engine (20 tarefas, 4 testes)
   - Épico 2: Fiscal e Legal (10 tarefas, 4 testes)
   - Épico 3: Segurança (9 tarefas, 4 testes)
   - Épico 4: Offline (5 tarefas, 2 testes)

2. ✅ **Todos os 5 testes de integração críticos passam:**
   - Carga e Concorrência
   - Offline → Online
   - Fiscal com Falhas
   - Segurança
   - Race Conditions

3. ✅ **Todas as métricas técnicas = 100%:**
   - Transações Atômicas
   - Detecção de Conflito
   - Fiscal Server-Side
   - Retry Fiscal Automático
   - OAuth Seguro
   - Idempotência Offline

4. ✅ **Todas as métricas de negócio = 0:**
   - Pedidos Duplicados
   - Faturas Perdidas
   - Estados Inconsistentes
   - Vulnerabilidades Críticas

5. ✅ **Zero problemas P0 pendentes**

---

## 🚫 NÃO ESTÁ COMPLETO SE:

- ❌ Qualquer tarefa do backlog está pendente
- ❌ Qualquer teste de integração falha
- ❌ Qualquer métrica técnica < 100%
- ❌ Qualquer métrica de negócio > 0
- ❌ Qualquer problema P0 está pendente
- ❌ Qualquer teste do backlog falha

---

## 🎯 PRÓXIMO PASSO APÓS CONCLUSÃO

### Quando Sprint 0 estiver completo:

1. ✅ **Piloto Controlado (7 dias):**
   - 1 restaurante real
   - Monitorar erros, divergências, performance
   - Critério: Zero problemas críticos

2. ✅ **Decisão de Produção:**
   - Se piloto passa → Pronto para produção
   - Se piloto falha → Corrigir e repetir

---

**Documento Criado:** 2026-01-20  
**Status:** ✅ **CHECKLIST FINAL** - Critérios binários e testáveis  
**Uso:** Revisar semanalmente, marcar conforme progresso
