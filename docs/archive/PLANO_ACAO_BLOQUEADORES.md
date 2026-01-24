# 🎯 PLANO DE AÇÃO — BLOQUEADORES CRÍTICOS
**Data:** 2026-01-16  
**Baseado em:** AUDITORIA_BRUTAL_2026_01_16.md  
**Objetivo:** Eliminar bloqueadores para operação real em Ibiza

---

## 📊 PRIORIZAÇÃO

### 🔴 BLOQUEADOR 1: Divisão de Conta (Consumption Groups)
**Tempo:** 16 horas  
**Impacto:** ALTO — Feature essencial em restaurantes europeus  
**Status:** Schema existe (`disabled/060_consumption_groups.sql`), UI não implementada  
**Prioridade:** 🔴 CRÍTICA

### 🔴 BLOQUEADOR 2: Impressão Fiscal
**Tempo:** 24 horas  
**Impacto:** ALTO — Compliance legal obrigatório  
**Status:** Não existe (apenas arquitetura conceitual)  
**Prioridade:** 🔴 CRÍTICA (mas pode ser feita em paralelo)

### 🔴 BLOQUEADOR 3: Offline Mode Integrado
**Tempo:** 8 horas  
**Impacto:** MÉDIO-ALTO — Restaurantes precisam operar sem internet  
**Status:** IndexedDB existe (`merchant-portal/src/core/queue/db.ts`), não integrado  
**Prioridade:** 🟡 ALTA (mais rápido de resolver)

---

## 🚀 ESTRATÉGIA DE EXECUÇÃO

### FASE 1: Quick Win (1 dia)
**Objetivo:** Resolver o mais rápido primeiro para ganhar momentum

1. **Offline Mode Integrado (8h)**
   - Integrar `OfflineOrderContext` no fluxo principal do TPV
   - Testes de sincronização
   - UI de status offline

**Resultado:** Sistema funciona mesmo com internet instável

---

### FASE 2: Feature Crítica (2 dias)
**Objetivo:** Implementar divisão de conta (mais solicitada)

2. **Divisão de Conta - Parte 1: Backend (4h)**
   - Habilitar migration `060_consumption_groups.sql`
   - Criar/atualizar RPC functions
   - Testes de schema

3. **Divisão de Conta - Parte 2: UI Core (8h)**
   - Criar componentes de grupo no TPV
   - Integrar com `OrderEngine`
   - Testes de criação/edição de grupos

4. **Divisão de Conta - Parte 3: UI Payment (4h)**
   - Integrar grupos no `PaymentModal`
   - Permitir pagamento por grupo
   - Testes E2E

**Resultado:** Clientes podem dividir conta durante o consumo

---

### FASE 3: Compliance (3 dias)
**Objetivo:** Implementar impressão fiscal (legal requirement)

5. **Impressão Fiscal - Parte 1: Arquitetura (8h)**
   - Integrar `FiscalObserver` pattern
   - Criar adapters para Portugal/Espanha
   - Testes de geração de documentos

6. **Impressão Fiscal - Parte 2: Integração Hardware (8h)**
   - Driver de impressora fiscal
   - Testes com hardware real
   - Fallbacks

7. **Impressão Fiscal - Parte 3: UI & Testes (8h)**
   - Botão de impressão no TPV
   - Testes de compliance
   - Documentação

**Resultado:** Sistema em compliance legal

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1 (Dias 1-2)
- ✅ Dia 1: Offline Mode Integrado (8h)
- ✅ Dia 2: Divisão de Conta - Backend + UI Core (12h)

### Semana 2 (Dias 3-5)
- ✅ Dia 3: Divisão de Conta - UI Payment + Testes (4h)
- ✅ Dia 4-5: Impressão Fiscal - Arquitetura (16h)

### Semana 3 (Dias 6-7)
- ✅ Dia 6: Impressão Fiscal - Hardware (8h)
- ✅ Dia 7: Impressão Fiscal - UI & Testes (8h)

**TOTAL: 7 dias úteis (56 horas)**

---

## 🎯 DECISÃO: POR ONDE COMEÇAR?

### Opção A: Quick Win First (Recomendado)
**Começar por:** Offline Mode Integrado (8h)  
**Vantagem:** Resultado rápido, ganha momentum  
**Risco:** Baixo

### Opção B: Feature First
**Começar por:** Divisão de Conta (16h)  
**Vantagem:** Resolve o bloqueador mais visível  
**Risco:** Médio (mais complexo)

### Opção C: Compliance First
**Começar por:** Impressão Fiscal (24h)  
**Vantagem:** Resolve problema legal  
**Risco:** Alto (depende de hardware)

---

## ✅ PRÓXIMO PASSO

**Aguardando decisão do usuário sobre qual bloqueador atacar primeiro.**

**Recomendação:** Começar por **Offline Mode Integrado** (Quick Win) para ganhar momentum, depois partir para **Divisão de Conta** (Feature Crítica).

---

**Construído com 💛 pelo Goldmonkey Empire**
