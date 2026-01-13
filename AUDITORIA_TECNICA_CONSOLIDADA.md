# 🚨 AUDITORIA TÉCNICA CONSOLIDADA

**Data:** 2026-01-20  
**Tipo:** Técnica Brutal - Sem Anestesia  
**Status:** 🔴 CRÍTICO - Ação Imediata Necessária

---

## 📊 VEREDITO FINAL

- **Nota Técnica:** 4/10
- **Nota Produto:** 5/10
- **Nota Mercado:** 3/10

### **Vendável Hoje?**
❌ **NÃO** - Apenas piloto controlado (1 restaurante, baixa carga)

### **Perigoso Usar Hoje?**
✅ **SIM** - Fiscal e pagamentos têm inconsistências e vulnerabilidades graves

### **Compete com last.app?**
- **Agora:** ❌ Não
- **Em 6 meses:** ⚠️ Só se corrigir fiscal server-side + idempotência offline + OAuth seguro
- **Nunca:** Se não corrigir problemas críticos

---

## ✅ PONTOS FORTES REAIS

1. **State Machine Explícita**
   - Guards/effects no core criam modelo auditável de transições
   - Raro e positivo
   - **MAS:** Execução tem falhas graves (ver abaixo)

2. **Arquitetura com Regras Explícitas**
   - Facilita auditoria e evolução
   - **SE corrigida:** Vira base forte

---

## 🔴 PROBLEMAS CRÍTICOS (CORE ENGINE)

### **1. Transações Não Atômicas** 🔥
**Severidade:** CRÍTICA  
**Risco:** Estado parcialmente aplicado, rollback fictício

**Problema:**
- Efeitos escrevem direto no repositório sem `txId`
- Quebra rollback e permite estado parcialmente aplicado se effect falha
- Exemplo: `calculateTotal`, `lockItems`, `applyPaymentToOrder` chamam `repo.saveOrder(order)` sem `txId`

**Localização:**
- `core-engine/effects/index.ts`

**Impacto:**
- Se `applyPaymentToOrder` falhar após `lockItems`, items ficam locked mas payment não aplicado
- Estado inconsistente e não recuperável

**Tarefa:**
```
Tornar efeitos e mutations 100% transacionais no CoreEngine
```

---

### **2. Mutação por Referência** 🔥
**Severidade:** CRÍTICA  
**Risco:** Mudanças "vazam" fora da transação

**Problema:**
- `getOrder/getSession/getPayment` devolve referência direta do objeto interno
- Objeto é mutado e salvo sem isolamento
- Mudanças podem "vazar" fora da transação
- Não há snapshot/clone para isolamento real

**Localização:**
- `core-engine/repo/InMemoryRepo.ts`

**Impacto:**
- Modificações não intencionais em objetos compartilhados
- Impossível fazer rollback correto
- Estado pode ficar inconsistente

**Tarefa:**
```
Implementar snapshot/clone para isolamento transacional
```

---

### **3. Optimistic Locking Ilusório** 🔥
**Severidade:** CRÍTICA  
**Risco:** Lost updates silenciosos

**Problema:**
- Incrementa `version`, mas nunca compara com versão anterior no commit
- Duas gravações concorrentes sobrescrevem silenciosamente
- Snapshot existe, mas não é usado para checagem de conflito

**Localização:**
- `core-engine/repo/InMemoryRepo.ts`

**Impacto:**
- Lost updates clássicos
- Dados podem ser sobrescritos sem aviso
- Divergência silenciosa de estado

**Tarefa:**
```
Implementar verificação de versão e detecção de conflito no repositório
```

---

### **4. Locking Incompleto em Transições Cruzadas** 🔥
**Severidade:** CRÍTICA  
**Risco:** Race conditions, estado inconsistente

**Problema:**
- `CoreExecutor` trava apenas `entityId` da transição
- Em `PAYMENT:CONFIRMED`, atualiza `ORDER` sem lock do pedido
- Permite corrida com outro fluxo (ex.: fechar/cancelar)

**Localização:**
- `core-engine/executor/CoreExecutor.ts`

**Impacto:**
- Race conditions em operações concorrentes
- Estado inconsistente (ex.: order marcado como paid enquanto está sendo cancelado)

**Tarefa:**
```
Adicionar locking multi-entity para transições que afetam Order + Payment
```

---

### **5. Quebra de Encapsulamento** ⚠️
**Severidade:** ALTA  
**Risco:** Impossível trocar persistência, contorna transações

**Problema:**
- Core faz `for (const orderId of Array.from((this.repo as any).orders.keys()))`
- Acessa internals do repo
- Quebra abstração, inviabiliza trocar persistência
- Contorna transações

**Localização:**
- `core-engine/executor/CoreExecutor.ts`
- `core-engine/effects/index.ts`

**Impacto:**
- Impossível trocar implementação de repo
- Código acoplado a `InMemoryRepo`
- Dificulta testes e evolução

**Tarefa:**
```
Adicionar métodos de consulta ao repositório (sem expor internals)
```

---

## 🔐 PROBLEMAS CRÍTICOS (SEGURANÇA)

### **6. OAuth com client_secret no Browser** 🔥
**Severidade:** CRÍTICA  
**Risco:** Segredos expostos, sequestro de tokens

**Problema:**
- `UberEatsOAuth` executa OAuth no cliente
- Envia `client_secret` direto no front-end
- Tokens gravados em claro no Supabase
- Qualquer pessoa com acesso ao front pode sequestrar tokens

**Localização:**
- `merchant-portal/src/integrations/adapters/ubereats/UberEatsOAuth.ts`
- (Também em Deliveroo, Glovo)

**Impacto:**
- Segredos de parceiros expostos
- Tokens podem ser sequestrados
- Risco de revogação imediata

**Tarefa:**
```
Remover OAuth client_secret do front-end e criptografar tokens
```
**Status:** ⏳ Sprint 1 - Tarefa 1.2

---

## 🧾 PROBLEMAS CRÍTICOS (FISCAL)

### **7. IVA Calculado Errado** 🔥
**Severidade:** CRÍTICA  
**Risco:** Base tributável errada, multas fiscais

**Problema:**
- `FiscalService`: `taxes.vat` recebe valor absoluto do IVA (`vatAmount`)
- `InvoiceXpressAdapter`: trata `taxes.vat` como taxa (percentual)
- `unit_price_without_tax = unit_price / (1 + taxDoc.taxes.vat)` fica matematicamente errado
- Gera base tributável errada

**Localização:**
- `merchant-portal/src/core/fiscal/FiscalService.ts`
- `fiscal-modules/adapters/InvoiceXpressAdapter.ts`

**Impacto:**
- IVA calculado incorretamente
- Base tributável errada
- Risco de multas fiscais

**Tarefa:**
```
Corrigir representação de IVA no TaxDocument e cálculo do subtotal
```
**Status:** ⏳ Sprint 1 - Tarefa 1.3

---

### **8. Fiscal Processado no Front-end** 🔥
**Severidade:** CRÍTICA  
**Risco:** Não auditável, falha em offline

**Problema:**
- `FiscalService` decide adapter e chama `InvoiceXpressAdapter` no browser
- `fetch` direto do browser + `localStorage` para token
- Não é auditável/legalmente defensável
- Se browser cai ou offline, documento fiscal não sai

**Localização:**
- `merchant-portal/src/core/fiscal/FiscalService.ts`
- `fiscal-modules/adapters/InvoiceXpressAdapter.ts`

**Impacto:**
- Fiscal não é auditável
- Falha em offline
- Risco legal

**Tarefa:**
```
Mover emissão fiscal para backend confiável com fila durável
```
**Status:** 🟡 Sprint 1 - Tarefa 1.1 (60% completo)

---

### **9. Único Fiscal por Pedido Bloqueia Correção** ⚠️
**Severidade:** ALTA  
**Risco:** Impossível corrigir fiscal parcial/errado

**Problema:**
- Migration cria `UNIQUE(order_id, doc_type)`
- Se fiscal parcial for emitido e depois corrigido, não consegue reemitir
- Trava correções legais

**Localização:**
- `supabase/migrations/20260116000002_fiscal_event_store.sql`

**Impacto:**
- Impossível corrigir fiscal parcial/errado
- Bloqueia correções legais

**Tarefa:**
```
Permitir reemissão de fiscal (remover UNIQUE ou adicionar versionamento)
```

---

## 🧨 PROBLEMAS CRÍTICOS (OFFLINE)

### **10. Sem Idempotência → Pedidos Duplicados** 🔥
**Severidade:** CRÍTICA  
**Risco:** Duplicação de pedidos, perdas financeiras

**Problema:**
- Fila offline (`useOfflineReconciler`) envia `ORDER_CREATE/UPDATE/CLOSE` sem idempotency key
- Se resposta falha depois de aplicar no backend, reenvia e duplica

**Localização:**
- `merchant-portal/src/core/queue/useOfflineReconciler.ts`

**Impacto:**
- Pedidos duplicados
- Contas duplicadas
- Perdas financeiras

**Tarefa:**
```
Adicionar idempotência a operações da fila offline
```

---

### **11. Polling Agressivo (1s)** ⚠️
**Severidade:** MÉDIA  
**Risco:** Gargalo de performance, drena bateria

**Problema:**
- `useOfflineReconciler` dispara `refresh()` a cada 1s
- Lê tudo do IndexedDB
- Em operação pesada, vira gargalo e drena bateria/performance

**Localização:**
- `merchant-portal/src/core/queue/useOfflineReconciler.ts`

**Impacto:**
- Performance degradada
- Bateria drenada
- UX ruim

**Tarefa:**
```
Otimizar polling (aumentar intervalo, usar eventos em vez de polling)
```

---

## 📊 PRIORIZAÇÃO CONSOLIDADA

### **SPRINT 1: Segurança e Fiscal (10-14 dias)** 🔥
**Status:** 🟡 Em Progresso (Tarefa 1.1: 60%)

1. ✅ **Tarefa 1.1:** Mover Emissão Fiscal para Backend (5-7 dias) - 🟡 60%
2. ⏳ **Tarefa 1.2:** Remover OAuth client_secret (3-4 dias) - ⏳ Pendente
3. ⏳ **Tarefa 1.3:** Corrigir Cálculo Fiscal (1-2 dias) - ⏳ Pendente
4. ✅ **Tarefa 1.4:** Emitir Fiscal Apenas Total (1 dia) - ✅ Integrado

---

### **SPRINT 2: Core Engine - Atomicidade (7-11 dias)** 🔥
**Status:** ⏳ Pendente

5. ⏳ **Tarefa 2.1:** Transações Atômicas (3-5 dias)
6. ⏳ **Tarefa 2.2:** Snapshot/Clone para Isolamento (2-3 dias)
7. ⏳ **Tarefa 2.3:** Optimistic Locking Real (2-3 dias)
8. ⏳ **Tarefa 2.4:** Locking Multi-Entity (2-3 dias)
9. ⏳ **Tarefa 2.5:** Encapsulamento do Repo (1-2 dias)

---

### **SPRINT 3: Offline e Robustez (3-5 dias)** ⚠️
**Status:** ⏳ Pendente

10. ⏳ **Tarefa 3.1:** Idempotência Offline (2-3 dias)
11. ⏳ **Tarefa 3.2:** Otimizar Polling (1-2 dias)
12. ⏳ **Tarefa 3.3:** Permitir Reemissão Fiscal (1 dia)

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### **Fase 1: Completar Sprint 1 (Segurança e Fiscal)**
**Duração:** 7-10 dias restantes  
**Prioridade:** CRÍTICA

**Objetivo:** Corrigir problemas que podem gerar prejuízo financeiro e legal

1. Completar Tarefa 1.1 (2-3 dias)
2. Tarefa 1.2 - OAuth seguro (3-4 dias)
3. Tarefa 1.3 - Cálculo fiscal (1-2 dias)

**Resultado:** Sistema seguro para uso em produção (com restrições)

---

### **Fase 2: Sprint 2 (Core Engine)**
**Duração:** 7-11 dias  
**Prioridade:** CRÍTICA

**Objetivo:** Garantir atomicidade e prevenir race conditions

1. Tarefa 2.1 - Transações atômicas (3-5 dias)
2. Tarefa 2.2 - Snapshot/Clone (2-3 dias)
3. Tarefa 2.3 - Optimistic locking real (2-3 dias)
4. Tarefa 2.4 - Locking multi-entity (2-3 dias)
5. Tarefa 2.5 - Encapsulamento (1-2 dias)

**Resultado:** Sistema robusto para uso concorrente

---

### **Fase 3: Sprint 3 (Offline e Robustez)**
**Duração:** 3-5 dias  
**Prioridade:** ALTA

**Objetivo:** Garantir idempotência e performance

1. Tarefa 3.1 - Idempotência offline (2-3 dias)
2. Tarefa 3.2 - Otimizar polling (1-2 dias)
3. Tarefa 3.3 - Reemissão fiscal (1 dia)

**Resultado:** Sistema confiável para uso offline

---

## 🚨 RISCOS IDENTIFICADOS

### **Maior Risco Oculto:**
Fiscal incorreto + duplicação de pedidos (multas + prejuízo financeiro)

### **Onde Quebra no Primeiro Dia:**
- Fiscal falha ou sai errado (IVA incorreto, emissão no browser)
- Integrações delivery vazam segredos

### **Onde Quebra em Horário de Pico:**
- Fila offline duplicando pedidos (sem idempotência)
- Core com corrida em PAYMENT → ORDER

### **Onde Quebra Offline + Fiscal + Pedidos Simultâneos:**
- Fiscal roda no cliente; offline = fiscal não sai
- Queue faz backoff limitado e pode abandonar itens críticos

---

## 📝 NOTAS

### **Maior Vantagem Estratégica:**
Arquitetura com regras explícitas (guards/effects) — **SE corrigida**, vira base forte

### **Comparação com Mercado:**
- 🟢 **Superior:** State machine explícita
- 🟡 **No mesmo nível:** Modelo offline básico
- 🔴 **Abaixo:** Confiabilidade fiscal, segurança, robustez offline

---

## 🎯 PRÓXIMOS PASSOS

### **Imediato:**
1. Completar Sprint 1 - Tarefa 1.1 (2-3 dias)
2. Iniciar Sprint 1 - Tarefa 1.2 (OAuth seguro)

### **Curto Prazo:**
1. Completar Sprint 1 (7-10 dias)
2. Iniciar Sprint 2 (Core Engine)

### **Médio Prazo:**
1. Completar Sprint 2 (7-11 dias)
2. Completar Sprint 3 (3-5 dias)
3. Validar sistema em ambiente de staging

---

**Status:** 🔴 CRÍTICO - Ação Imediata Necessária  
**Estimativa Total:** 17-30 dias (3 sprints)  
**Última atualização:** 2026-01-20
