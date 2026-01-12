# 🚀 PLANO DE EXECUÇÃO - OPÇÃO A (REVISADO)

**Data:** 17 Janeiro 2026  
**Decisão Estratégica:** Pausar Tab Isolation → Focar em Offline Mode (diferencial #1)

---

## 🎯 DECISÃO TOMADA

**Tab Isolation:** ⏸️ PAUSADO (1/71 completo)  
**Razão:** Não é bloqueador crítico. Pode ser completado depois.  
**Offline Mode:** 🚀 PRIORIDADE #1 (diferencial competitivo)

---

## 📅 ROADMAP REVISADO - 3 SEMANAS (120H)

### **SEMANA 1: Offline Mode (40h)** 🎯 FOCO ATUAL

#### **Dias 1-3 (24h): Integração useOfflineQueue no OrderEngine**
- [ ] Analisar `OrderEngine.ts` atual
- [ ] Integrar `useOfflineQueue` no fluxo de criação de pedidos
- [ ] Garantir que `OrderEngine.createOrder()` funciona offline
- [ ] Testar sincronização automática quando volta online
- [ ] Validar idempotência (não criar pedidos duplicados)

#### **Dias 4-5 (16h): UI Indicator + Testes**
- [ ] Criar componente `OfflineStatusBadge` (badge "Offline - sincronizando...")
- [ ] Integrar no TPV (header/footer)
- [ ] Testes manuais: desligar WiFi, criar 20 pedidos
- [ ] Validar que pedidos aparecem quando volta online
- [ ] Documentar comportamento esperado

**Status:** 🟢 **INICIANDO AGORA**

---

### **SEMANA 2: Fiscal + Delivery (40h)**

#### **Dias 1-3 (24h): Fiscal Printing Real**
- [ ] Pesquisar APIs: InvoiceXpress vs Moloni
- [ ] Implementar adapter para API escolhida
- [ ] Gerar XML SAF-T real (não simulação)
- [ ] Integrar no fluxo de pagamento
- [ ] Testar impressão fiscal real

#### **Dias 4-5 (16h): Glovo Integration (Início)**
- [ ] Pesquisar API Glovo (documentação)
- [ ] Implementar OAuth 2.0
- [ ] Criar webhook handler (Supabase Edge Function)
- [ ] Receber pedidos básicos do Glovo
- [ ] Mapear dados Glovo → OrderEngine

---

### **SEMANA 3: Delivery + Quality (40h)**

#### **Dias 1-3 (24h): Glovo Integration (Conclusão)**
- [ ] Status sync (pedido → Glovo)
- [ ] Error handling robusto
- [ ] Testes completos (receber, processar, confirmar)
- [ ] UI para configurar Glovo (Settings)

#### **Dia 4 (8h): Error Boundaries + Audit Logs**
- [ ] Criar `ErrorBoundary` component
- [ ] Integrar em TPV, KDS, Caixa
- [ ] Criar tabela `gm_audit_logs` (se não existir)
- [ ] Log ações críticas (abrir caixa, pagar, fiscal)

#### **Dia 5 (8h): Testes E2E Críticos**
- [ ] Caixa flow (abrir → vender → fechar)
- [ ] Fiscal export (SAF-T XML)
- [ ] Offline sync (20 pedidos offline → online)
- [ ] Documentar resultados

---

## 🎯 TAREFA ATUAL: OFFLINE MODE INTEGRATION

### **Objetivo**
Garantir que `OrderEngine.createOrder()` funciona completamente offline, usando a fila IndexedDB e sincronizando automaticamente quando volta online.

### **Estado Atual**
- ✅ `OfflineDB` implementado (IndexedDB wrapper)
- ✅ `OfflineSync` implementado (retry + backoff)
- ✅ `OfflineOrderContext` implementado (React context)
- ⚠️ `OrderEngine` ainda não usa `useOfflineQueue` diretamente
- ⚠️ `OrderContextReal` tem lógica offline, mas pode ser melhorada

### **Plano de Integração**

#### **Passo 1: Analisar OrderEngine atual**
- [ ] Ler `merchant-portal/src/core/tpv/OrderEngine.ts`
- [ ] Identificar onde `createOrder()` faz chamadas Supabase
- [ ] Mapear fluxo: input → validação → RPC → resposta

#### **Passo 2: Criar wrapper offline-aware**
- [ ] Criar `OrderEngineOffline.ts` (wrapper)
- [ ] Detectar se está offline (`navigator.onLine`)
- [ ] Se offline: adicionar à fila IndexedDB
- [ ] Se online: chamar `OrderEngine.createOrder()` diretamente

#### **Passo 3: Integrar no OrderContextReal**
- [ ] Substituir chamadas diretas por wrapper offline-aware
- [ ] Garantir que UI mostra estado "offline" corretamente
- [ ] Testar: criar pedido offline → ver na fila → voltar online → sincronizar

#### **Passo 4: UI Indicator**
- [ ] Criar `OfflineStatusBadge` component
- [ ] Mostrar: "Offline - X pedidos pendentes"
- [ ] Integrar no header do TPV

---

## 📊 PROGRESSO GERAL

| Tarefa | Status | Progresso | Tempo Gasto | Tempo Restante |
|--------|--------|-----------|-------------|----------------|
| Tab Isolation | ⏸️ Pausado | 1/71 (1%) | 10min | 15h (depois) |
| **Offline Mode** | 🟢 **Em Progresso** | 0% | 0h | **40h** |
| Fiscal Printing | 🔴 Não iniciado | 0% | 0h | 24h |
| Glovo Integration | 🔴 Não iniciado | 0% | 0h | 60h |
| Error Boundaries | 🔴 Não iniciado | 0% | 0h | 8h |
| Audit Logs | 🔴 Não iniciado | 0% | 0h | 8h |
| Testes E2E | 🔴 Não iniciado | 0% | 0h | 8h |

**Total:** 0h / 120h (0% completo)

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **AGORA:** Analisar `OrderEngine.ts` e `OrderContextReal.tsx`
2. **HOJE:** Criar wrapper offline-aware para `OrderEngine`
3. **HOJE:** Integrar no `OrderContextReal`
4. **AMANHÃ:** Criar UI indicator
5. **AMANHÃ:** Testes manuais (desligar WiFi)

---

**Status:** 🟢 **EXECUTANDO OFFLINE MODE AGORA**
