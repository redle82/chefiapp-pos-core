# 🔧 PLANO DE HARDENING PARA PRODUÇÃO
## Da Visão Arquitetural à Execução Real

**Data:** 2026-01-20  
**Contexto:** Auditorias revelaram falhas estruturais de fundação  
**Objetivo:** Definir escopo mínimo de hardening para produção real  
**Filosofia:** "A visão está certa, mas a execução ainda não fecha o ciclo de verdade"

---

## 🎯 PREMISSA FUNDAMENTAL

### O Que As Auditorias Revelaram

**Não é código "quebrado".**  
**É arquitetura ambiciosa que ainda não foi totalmente concretizada.**

**Linha do Tempo Real:**
- **10 Jan (88/100):** Avaliou organização, arquitetura conceitual, features "no papel"
- **13 Jan (70/100):** Entrou em concorrência, locks, fiscal retry, idempotência
- **20 Jan (40/100):** Comparou código vs schema real, intenção vs execução, simulou produção hostil

**Conclusão:** As falhas sempre estiveram lá. O que mudou foi o nível de lupa.

---

## 🔴 PROBLEMAS DE FUNDAÇÃO (Não São Dívida Técnica Normal)

### Categoria 1: Core Engine - Transações e Concorrência

| Problema | Severidade | Impacto Real | Tempo Estimado |
|----------|------------|--------------|----------------|
| Transações não atômicas | P0 | Estado parcial, rollback impossível | 3-5 dias |
| Mutação por referência | P0 | Mudanças "vazam" fora da transação | 2-3 dias |
| Lock otimista ilusório | P0 | Lost updates silenciosos | 2-3 dias |
| Locking incompleto (cross-entity) | P0 | Race conditions | 2-3 dias |

**Total:** 9-14 dias

### Categoria 2: Fiscal e Legal

| Problema | Severidade | Impacto Real | Tempo Estimado |
|----------|------------|--------------|----------------|
| Emissão fiscal no browser | P0 | Não auditável, perda de documentos | 3-4 dias |
| Fiscal sem retry em background | P0 | Perda de faturas obrigatórias | 2-3 dias |
| IVA calculado errado | P0 | Risco fiscal real, multas | 1-2 dias |
| Emissão sem validar pagamento total | P0 | Fiscal parcial incorreto | 1 dia |

**Total:** 7-10 dias

### Categoria 3: Segurança e Integrações

| Problema | Severidade | Impacto Real | Tempo Estimado |
|----------|------------|--------------|----------------|
| OAuth client_secret no frontend | P0 | Tokens expostos, revogação | 3-4 dias |
| Bypass de dev em produção | P0 | Segurança comprometida | 1 dia |
| LocalStorage como fonte de verdade | P0 | Estado inconsistente | 2-3 dias |
| Webhook sem assinatura | P1 | Fraude possível | 2-3 dias |

**Total:** 8-12 dias

### Categoria 4: Offline e Idempotência

| Problema | Severidade | Impacto Real | Tempo Estimado |
|----------|------------|--------------|----------------|
| Sem idempotência na fila offline | P0 | Pedidos duplicados | 2-3 dias |
| Polling agressivo (1s) | P1 | Performance, bateria | 1-2 dias |

**Total:** 3-5 dias

---

## 📅 PLANO 30-60-90 DIAS

### FASE 1: HARDENING CRÍTICO (30 dias)
**Objetivo:** Corrigir todos os P0s que impedem produção segura

#### Semana 1-2: Core Engine (9-14 dias)
- [ ] **Dia 1-3:** Tornar efeitos 100% transacionais
  - Passar `txId` para todos os `save*` methods
  - Garantir rollback em caso de falha
  - **Critério de sucesso:** Teste de falha parcial não deixa estado inconsistente

- [ ] **Dia 4-5:** Implementar snapshot/clone para isolamento
  - `getOrder/getSession/getPayment` retornam cópias
  - Snapshot dentro de transação
  - **Critério de sucesso:** Modificação fora de transação não afeta estado interno

- [ ] **Dia 6-7:** Verificação de versão e detecção de conflito
  - Comparar versão no commit
  - Rejeitar se versão divergiu
  - **Critério de sucesso:** Duas gravações concorrentes detectam conflito

- [ ] **Dia 8-9:** Locking multi-entity
  - Lock de Order + Payment em transições cruzadas
  - Deadlock detection
  - **Critério de sucesso:** Race condition em PAYMENT:CONFIRMED não ocorre

#### Semana 3: Fiscal e Legal (7-10 dias)
- [ ] **Dia 10-12:** Mover emissão fiscal para backend
  - Worker de fila fiscal (já iniciado em Sprint 1)
  - Completar lógica de processamento
  - **Critério de sucesso:** Fiscal nunca é emitido no browser

- [ ] **Dia 13:** Retry fiscal em background
  - Job que processa `gm_fiscal_queue` com retry
  - Exponential backoff
  - **Critério de sucesso:** Faturas `PENDING` são retentadas automaticamente

- [ ] **Dia 14:** Corrigir cálculo de IVA
  - Separar `vatRate` de `vatAmount`
  - Corrigir `InvoiceXpressAdapter`
  - **Critério de sucesso:** Base tributável calculada corretamente

- [ ] **Dia 15:** Validar pagamento total antes de emitir
  - Verificar `payment_status = PAID` e `total_amount`
  - **Critério de sucesso:** Fiscal só emite se pedido totalmente pago

#### Semana 4: Segurança (8-12 dias)
- [ ] **Dia 16-18:** Remover OAuth client_secret do frontend
  - Mover token exchange para backend
  - Criptografar tokens no DB
  - **Critério de sucesso:** Frontend nunca vê client_secret

- [ ] **Dia 19:** Restringir bypass de dev a produção
  - Verificar `NODE_ENV === 'development'`
  - Remover ou proteger bypass
  - **Critério de sucesso:** Bypass não funciona em produção

- [ ] **Dia 20-21:** Sempre verificar DB antes de localStorage
  - DB é fonte de verdade
  - localStorage apenas cache
  - **Critério de sucesso:** Estado crítico sempre vem do DB

- [ ] **Dia 22-23:** Assinatura de webhooks
  - Validar assinatura Glovo/UberEats
  - Rejeitar webhooks não assinados
  - **Critério de sucesso:** Webhooks falsos são rejeitados

#### Semana 4 (continuação): Offline (3-5 dias)
- [ ] **Dia 24-25:** Idempotência na fila offline
  - Adicionar `idempotency_key` a todas as operações
  - Verificar antes de aplicar
  - **Critério de sucesso:** Pedidos não são duplicados em retry

- [ ] **Dia 26:** Otimizar polling
  - Aumentar intervalo para 5-10s
  - Polling adaptativo (mais agressivo quando offline)
  - **Critério de sucesso:** Performance melhorada, bateria preservada

**Total Fase 1:** 26 dias (com margem para 30)

---

### FASE 2: VALIDAÇÃO E TESTES (30 dias)
**Objetivo:** Validar que hardening funcionou, testar em condições reais

#### Semana 5-6: Testes de Carga e Concorrência
- [ ] **Teste 1:** 100 pedidos simultâneos
  - Verificar locks, transações, rollbacks
  - **Critério:** Zero estados inconsistentes

- [ ] **Teste 2:** Offline → Online com 50 pedidos pendentes
  - Verificar idempotência, reconciliação
  - **Critério:** Zero duplicações

- [ ] **Teste 3:** Fiscal com falhas simuladas
  - Simular falha de API, retry automático
  - **Critério:** 100% das faturas emitidas

#### Semana 7-8: Testes de Segurança
- [ ] **Teste 4:** Tentativa de bypass de guards
  - Verificar que bypass não funciona em produção
  - **Critério:** Acesso negado

- [ ] **Teste 5:** Manipulação de localStorage
  - Tentar burlar guards via localStorage
  - **Critério:** Sistema sempre verifica DB

#### Semana 9-10: Piloto Controlado
- [ ] **Piloto:** 1 restaurante real, 7 dias
  - Monitorar erros, divergências, performance
  - **Critério:** Zero problemas críticos

---

### FASE 3: REFINAMENTO E DOCUMENTAÇÃO (30 dias)
**Objetivo:** Polir, documentar, preparar para escala

#### Semana 11-12: Refinamento
- [ ] Otimizações de performance
- [ ] Melhorias de UX baseadas em feedback
- [ ] Correção de bugs menores

#### Semana 13-14: Documentação
- [ ] Documentar contratos semânticos
- [ ] Guia de troubleshooting
- [ ] Runbook de operação

---

## 🎯 ESCOPO MÍNIMO DE HARDENING (Para Dizer "Pode Rodar com Dinheiro Real")

### Checklist Obrigatório (P0s)

#### Core Engine
- [x] ✅ Transações atômicas (rollback funcional)
- [x] ✅ Isolamento transacional (snapshot/clone)
- [x] ✅ Verificação de versão (detecção de conflito)
- [x] ✅ Locking multi-entity (sem race conditions)

#### Fiscal
- [x] ✅ Emissão 100% server-side
- [x] ✅ Retry automático em background
- [x] ✅ Cálculo de IVA correto
- [x] ✅ Validação de pagamento total

#### Segurança
- [x] ✅ OAuth seguro (sem client_secret no frontend)
- [x] ✅ Bypass de dev restrito a desenvolvimento
- [x] ✅ DB como fonte de verdade (não localStorage)
- [x] ✅ Webhooks assinados

#### Offline
- [x] ✅ Idempotência na fila offline
- [x] ✅ Polling otimizado

**Total:** 15 itens obrigatórios

### Critérios de "Pronto para Produção"

#### ✅ Pode Rodar com Dinheiro Real Se:
1. ✅ Todos os 15 itens do checklist obrigatório estão completos
2. ✅ Testes de carga passaram (100 pedidos simultâneos)
3. ✅ Testes de offline passaram (50 pedidos pendentes)
4. ✅ Testes de fiscal passaram (retry automático)
5. ✅ Piloto controlado (7 dias) sem problemas críticos

#### ❌ NÃO Pode Rodar Se:
- ❌ Qualquer P0 do checklist está pendente
- ❌ Testes de carga falharam
- ❌ Fiscal não tem retry automático
- ❌ OAuth ainda expõe client_secret

---

## 📊 MÉTRICAS DE SUCESSO

### Métricas Técnicas

| Métrica | Meta | Status Atual | Status Esperado (30 dias) |
|---------|------|--------------|---------------------------|
| **Transações Atômicas** | 100% | 0% | 100% |
| **Detecção de Conflito** | 100% | 0% | 100% |
| **Fiscal Server-Side** | 100% | 0% | 100% |
| **Retry Fiscal Automático** | 100% | 0% | 100% |
| **OAuth Seguro** | 100% | 0% | 100% |
| **Idempotência Offline** | 100% | 0% | 100% |

### Métricas de Negócio

| Métrica | Meta | Status Atual | Status Esperado (30 dias) |
|---------|------|--------------|---------------------------|
| **Pedidos Duplicados** | 0% | ? | 0% |
| **Faturas Perdidas** | 0% | ? | 0% |
| **Estados Inconsistentes** | 0% | ? | 0% |
| **Vulnerabilidades Críticas** | 0 | 5 | 0 |

---

## 🚀 CAMINHOS ESTRATÉGICOS

### Caminho A: Produto Real (Recomendado)
**Duração:** 30-60 dias de hardening + 30 dias de validação  
**Resultado:** Sistema que poucos no mercado têm

**Vantagens:**
- ✅ Arquitetura explícita de regras (raro)
- ✅ Trilha legal clara
- ✅ Separação Core/Legal/Effects (auditável)
- ✅ Pode competir com last.app em robustez

**Desvantagens:**
- ⚠️ Requer 2-3 meses de foco
- ⚠️ Não pode "empurrar para produção" antes

### Caminho B: Demo/Piloto Eterno (Não Recomendado)
**Duração:** Contínuo  
**Resultado:** Funciona até dar problema sério

**Vantagens:**
- ✅ Pode "vender" mais cedo
- ✅ Menos trabalho imediato

**Desvantagens:**
- ❌ Risco fiscal e legal
- ❌ Confiança comprometida quando quebrar
- ❌ Dívida técnica crescente

---

## 💡 RECOMENDAÇÃO FINAL

### A Decisão Estratégica

**Agora existem duas estradas, e não dá para fingir que são a mesma:**

1. **Hardening Real (30-60 dias):** Corrigir fundações, ter produto real
2. **Demo Eterno:** Manter narrativa "quase pronto", aceitar risco

### A Boa Notícia

**A maior vantagem estratégica continua intacta:**

🔥 **A arquitetura explícita de regras + intenção auditável é rara.**

A maioria dos concorrentes:
- ❌ Não consegue explicar por que algo aconteceu
- ❌ Não tem trilha legal clara
- ❌ Não separa regras de execução

**Vocês têm isso no desenho.**  
**Agora precisam fechar o circuito na execução.**

---

## 📋 PRÓXIMOS PASSOS IMEDIATOS

### Esta Semana (Dias 1-7)
1. **Priorizar:** Core Engine (transações atômicas)
2. **Começar:** Implementar `txId` em todos os efeitos
3. **Validar:** Teste de falha parcial não deixa estado inconsistente

### Próximas 2 Semanas (Dias 8-21)
4. **Completar:** Core Engine (snapshot, versão, locking)
5. **Iniciar:** Fiscal server-side (completar worker)
6. **Iniciar:** Segurança (OAuth, bypass, DB-first)

### Próximo Mês (Dias 22-30)
7. **Completar:** Todos os P0s do checklist
8. **Validar:** Testes de carga e concorrência
9. **Decidir:** Pronto para piloto controlado?

---

## 🎯 EM UMA FRASE

> **"A visão está certa, mas a execução ainda não fecha o ciclo de verdade. Com 30-60 dias de hardening focado, vocês têm algo que poucos no mercado têm."**

---

**Documento Criado:** 2026-01-20  
**Status:** ✅ **PLANO REALISTA** - Baseado em auditorias e análise honesta  
**Próximo Review:** Após completar Fase 1 (30 dias)
