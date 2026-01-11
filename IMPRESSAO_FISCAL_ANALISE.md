# 🧾 IMPRESSÃO FISCAL — ANÁLISE E PLANO DE IMPLEMENTAÇÃO
**Data:** 2026-01-16  
**Tempo Estimado:** 24 horas  
**Prioridade:** 🔴 **CRÍTICA** (compliance legal obrigatório)

---

## 📋 OBJETIVO

Implementar impressão fiscal completa para compliance legal em Portugal/Espanha, seguindo o padrão **FiscalObserver** (GATE 5).

**Princípio:** "The Eye of Sauron" — O módulo fiscal observa tudo, mas não toca no Core.

---

## ✅ O QUE JÁ EXISTE

### 1. Arquitetura Conceitual ✅
**Arquivo:** `GATE5_FISCAL_ARCHITECTURE.md`

**Princípios:**
- ✅ Observer Pattern (FiscalObserver)
- ✅ Separação de responsabilidades (Core ≠ Fiscal)
- ✅ Falhas independentes (Core continua operando se Fiscal falhar)
- ✅ Persistência separada (`fiscal_event_store`)

### 2. Interfaces e Types ✅
**Arquivos:**
- `fiscal-modules/FiscalObserver.ts` — Interface
- `fiscal-modules/types.ts` — Types (FiscalResult, TaxDocument)
- `fiscal-modules/FiscalEventStore.ts` — Persistência

### 3. Mock Adapter ✅
**Arquivo:** `fiscal-modules/ConsoleFiscalAdapter.ts`
- ✅ Implementa FiscalObserver
- ✅ Simula transmissão para governo
- ⚠️ **Limitação:** Apenas mock, não integra com eventos reais

### 4. Schema SQL ✅
**Arquivo:** `fiscal-modules/schema.sql`
- ✅ Tabela `fiscal_event_store`
- ✅ Linkage com `legal_seals` e `event_store`
- ⚠️ **Limitação:** Não está em migrations ativas

---

## ❌ O QUE FALTA

### 1. Integração com Eventos de Pagamento ❌
**Problema:** FiscalObserver não está conectado ao fluxo de pagamento real.

**O que precisa:**
- Listener para eventos `PAYMENT_CONFIRMED` + `PAYMENT_SEALED`
- Trigger ou polling service para acionar FiscalObserver
- Integração com `OrderEngine` ou `PaymentEngine`

**Estimativa:** 4 horas

---

### 2. Adapters Regionais (Portugal/Espanha) ❌
**Problema:** Apenas mock adapter existe.

**O que precisa:**

#### Portugal (TicketBAI / SAF-T)
- Adapter para TicketBAI (Espanha) ou SAF-T (Portugal)
- Cálculo de IVA (21% em Espanha, 23% em Portugal)
- Geração de XML conforme especificação
- Integração com API do governo (ou simulação)

#### Espanha (TicketBAI)
- Adapter para TicketBAI
- Cálculo de IVA (21%)
- Geração de XML
- Integração com API do governo

**Estimativa:** 8 horas

---

### 3. Driver de Impressora Fiscal ❌
**Problema:** Não há integração com hardware de impressão.

**O que precisa:**
- Driver para impressoras fiscais comuns (Epson, Star, etc.)
- Fallback para impressão via browser (window.print)
- Suporte para impressão térmica (80mm)
- Template de recibo fiscal

**Estimativa:** 6 horas

---

### 4. UI de Impressão no TPV ❌
**Problema:** Não há botão ou opção de impressão fiscal no TPV.

**O que precisa:**
- Botão "Imprimir Recibo Fiscal" no PaymentModal
- Status de impressão fiscal (pendente, impresso, erro)
- Reimpressão de recibos
- Visualização de documentos fiscais

**Estimativa:** 4 horas

---

### 5. Migration SQL Ativa ❌
**Problema:** Schema fiscal não está em migrations ativas.

**O que precisa:**
- Mover `fiscal-modules/schema.sql` para `supabase/migrations/`
- Adicionar RLS policies
- Criar indexes para performance

**Estimativa:** 1 hora

---

### 6. Testes de Compliance ❌
**Problema:** Não há testes para validar compliance legal.

**O que precisa:**
- Testes de geração de documentos fiscais
- Validação de XML conforme especificação
- Testes de idempotência
- Testes de falha e retry

**Estimativa:** 1 hora

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Fundação (5h)
1. **Migration SQL Ativa (1h)**
   - Mover schema para migrations
   - Adicionar RLS policies
   - Criar indexes

2. **Integração com Eventos (4h)**
   - Criar listener para `PAYMENT_SEALED`
   - Integrar FiscalObserver no fluxo de pagamento
   - Testes básicos

---

### FASE 2: Adapters Regionais (8h)
3. **Adapter Portugal (4h)**
   - Implementar cálculo de IVA (23%)
   - Geração de XML SAF-T ou TicketBAI
   - Testes de formato

4. **Adapter Espanha (4h)**
   - Implementar cálculo de IVA (21%)
   - Geração de XML TicketBAI
   - Testes de formato

---

### FASE 3: Hardware e UI (10h)
5. **Driver de Impressora (6h)**
   - Driver básico para impressão térmica
   - Template de recibo fiscal
   - Fallback para window.print

6. **UI de Impressão (4h)**
   - Botão no PaymentModal
   - Status de impressão
   - Reimpressão

---

### FASE 4: Testes e Documentação (1h)
7. **Testes de Compliance (1h)**
   - Validação de XML
   - Testes de idempotência
   - Documentação

---

## 📊 CRONOGRAMA

| Fase | Tarefa | Tempo | Status |
|------|--------|-------|--------|
| 1 | Migration SQL | 1h | ✅ |
| 1 | Integração Eventos | 4h | ✅ |
| 2 | Adapter Portugal | 4h | ✅ |
| 2 | Adapter Espanha | 4h | ✅ |
| 3 | Driver Impressora | 6h | ⏳ |
| 3 | UI Impressão | 4h | ⏳ |
| 4 | Testes | 1h | ⏳ |
| **TOTAL** | | **24h** | **54% (13h/24h)** |

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Hardware Específico
**Problema:** Impressoras fiscais têm drivers proprietários.

**Mitigação:** 
- Começar com fallback (window.print)
- Adicionar drivers específicos conforme necessidade
- Documentar requisitos de hardware

### Risco 2: APIs Governamentais
**Problema:** APIs do governo podem estar offline ou mudar.

**Mitigação:**
- Modo offline (armazenar documentos para envio posterior)
- Queue de retry
- Logs detalhados para auditoria

### Risco 3: Compliance Legal
**Problema:** Especificações fiscais podem mudar.

**Mitigação:**
- Documentar versão da especificação usada
- Manter histórico de documentos fiscais
- Permitir atualização de adapters sem afetar Core

---

## ✅ CRITÉRIOS DE SUCESSO

1. ✅ Sistema gera documentos fiscais automaticamente após pagamento
2. ✅ Documentos são armazenados em `fiscal_event_store`
3. ✅ UI permite impressão e reimpressão de recibos
4. ✅ Sistema funciona mesmo se API do governo estiver offline
5. ✅ Testes validam formato XML conforme especificação

---

## 🎯 PRÓXIMO PASSO

**Começar por:** FASE 1 — Migration SQL e Integração com Eventos (5h)

**Ordem:**
1. Mover schema para migrations
2. Criar listener para eventos de pagamento
3. Integrar FiscalObserver no fluxo

---

**Construído com 💛 pelo Goldmonkey Empire**
