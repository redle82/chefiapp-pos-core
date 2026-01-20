# 🛡️ Hardening P1 - Plano de Execução

**Data:** 18 Janeiro 2026  
**Status:** 🟡 **PLANEJADO**  
**Após:** Hardening P0 completo e validado

---

## 📊 Contexto

Após completar o **Hardening P0** (5 problemas críticos corrigidos), agora focamos nos **P1s** - problemas de alta prioridade que devem ser corrigidos antes de produção real.

---

## 🎯 P1s Identificados

### P1-1: TPV Actions Hardcoded (Testing Leak) 🔴

**Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx:195`

**Problema:**
```typescript
const actionsEnabled = true // DANGEROUS - bypasses gating
```

**Impacto:**
- Bypassa sistema de health check
- Permite ações quando sistema está degradado
- Risco de operações em estado inconsistente

**Solução:**
```typescript
const actionsEnabled = healthStatus === 'UP' || isDemoData
```

**Esforço:** 15 minutos

---

### P1-2: Public Pages Cart Not Persisted 🟡

**Arquivo:** `merchant-portal/src/pages/Public/PublicPages.tsx:38`

**Problema:**
- Carrinho de compras não persiste ao fechar página
- Usuário perde itens adicionados
- Má experiência do usuário

**Solução:**
- Adicionar localStorage persistence com TTL
- Restaurar carrinho ao reabrir página
- Limpar após 24h de inatividade

**Esforço:** 1-2 horas

---

### P1-3: Queue Reconciler No Rollback 🟡

**Arquivo:** `merchant-portal/src/core/queue/useOfflineReconciler.ts:49`

**Problema:**
- Item pode ficar preso em estado 'syncing' se falha imediata
- Sem rollback, item nunca tenta novamente
- Fila offline pode travar

**Solução:**
- Adicionar try/catch ao redor de status update
- Rollback para 'queued' em caso de falha
- Implementar retry com backoff exponencial

**Esforço:** 2-3 horas

---

### P1-4: TPV Optimistic UI Updates (Violação Truth-First) 🟡

**Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx:326-354`

**Problema:**
- UI mostra mudança de status ANTES do Core confirmar
- Viola doutrina "UI NEVER anticipates the Core"
- Usuário vê estados falsos quando queue falha

**Solução:**
- Remover optimistic updates
- Mostrar status da queue (pending/syncing/applied)
- Atualizar UI apenas quando queue item vira 'applied'

**Esforço:** 4-6 horas

---

## 📋 Plano de Execução

### Dia 1: Correções Rápidas (2-3 horas)

**Manhã:**
- [ ] **P1-1**: Corrigir `actionsEnabled` hardcoded (15 min)
- [ ] **P1-2**: Implementar persistência de carrinho (1-2h)

**Tarde:**
- [ ] **P1-3**: Adicionar rollback no Queue Reconciler (2-3h)

**Total Dia 1:** 3-5 horas

---

### Dia 2: Truth-First Fix (4-6 horas)

**Manhã:**
- [ ] Analisar código atual do TPV
- [ ] Identificar todos os optimistic updates

**Tarde:**
- [ ] Remover optimistic updates
- [ ] Implementar status da queue na UI
- [ ] Atualizar UI apenas quando 'applied'
- [ ] Testar cenários de falha

**Total Dia 2:** 4-6 horas

---

## ✅ Critérios de Aceite

### P1-1: Actions Enabled
- [ ] `actionsEnabled` não é mais hardcoded
- [ ] Respeita `healthStatus === 'UP'`
- [ ] Permite `isDemoData` para testes
- [ ] Testes passam

### P1-2: Cart Persistence
- [ ] Carrinho persiste no localStorage
- [ ] Restaura ao reabrir página
- [ ] Limpa após 24h de inatividade
- [ ] Testes E2E passam

### P1-3: Queue Rollback
- [ ] Try/catch implementado
- [ ] Rollback para 'queued' em falha
- [ ] Retry com backoff exponencial
- [ ] Item não fica preso em 'syncing'

### P1-4: Truth-First UI
- [ ] Nenhum optimistic update
- [ ] UI mostra status da queue
- [ ] Atualização apenas quando 'applied'
- [ ] Testes de falha passam

---

## 🧪 Testes Necessários

### P1-1
- [ ] Testar com `healthStatus = 'DOWN'` → ações bloqueadas
- [ ] Testar com `healthStatus = 'UP'` → ações habilitadas
- [ ] Testar com `isDemoData = true` → ações habilitadas

### P1-2
- [ ] Adicionar itens ao carrinho
- [ ] Fechar página
- [ ] Reabrir página → carrinho restaurado
- [ ] Aguardar 24h → carrinho limpo

### P1-3
- [ ] Criar item offline
- [ ] Simular falha de sync
- [ ] Verificar rollback para 'queued'
- [ ] Verificar retry automático

### P1-4
- [ ] Modificar pedido offline
- [ ] Verificar UI mostra "syncing"
- [ ] Simular falha → UI mostra "pending"
- [ ] Sucesso → UI atualiza apenas quando 'applied'

---

## 📊 Priorização

| P1 | Impacto | Esforço | Prioridade |
|----|---------|---------|------------|
| **P1-1** | 🔴 Alto | 15 min | **1️⃣ PRIMEIRO** |
| **P1-3** | 🟡 Médio | 2-3h | **2️⃣ SEGUNDO** |
| **P1-2** | 🟡 Médio | 1-2h | **3️⃣ TERCEIRO** |
| **P1-4** | 🟡 Médio | 4-6h | **4️⃣ QUARTO** |

**Total:** 7-11 horas (1-2 dias)

---

## 🚀 Próximos Passos

1. **Validar Hardening P0 completo** (se ainda não feito)
2. **Começar por P1-1** (correção rápida de 15 min)
3. **Seguir ordem de prioridade** acima
4. **Testar cada correção** antes de avançar
5. **Documentar resultados** em `HARDENING_P1_STATUS.md`

---

## 📚 Referências

- **Fonte:** `docs/audit/TRUTH_AUDIT_SUMMARY.md`
- **Issues:** `docs/ISSUES_ACTIONABLE_P0_P1_P2.md`
- **Contexto:** Hardening P0 completo

---

**Última atualização:** 18 Janeiro 2026  
**Status:** 🟡 Aguardando início
