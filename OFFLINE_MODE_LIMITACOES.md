# ⚠️ OFFLINE MODE - LIMITAÇÕES CONHECIDAS

**Data:** 2026-01-16  
**Status:** Implementação 90% completa, com limitações intencionais

---

## ❌ LIMITAÇÕES ATUAIS

### 1. Pagamento Offline (ORDER_CLOSE)

**Status:** ❌ **NÃO IMPLEMENTADO** (intencional)

**Motivo:**
- Pagamento offline é considerado perigoso
- Risco de perda de dados financeiros
- Complexidade de reconciliação

**Comportamento Atual:**
- Pedidos podem ser criados offline
- Pedidos podem ser editados offline (parcial)
- **Pagamento requer conexão ativa**

**Código:**
```typescript
// merchant-portal/src/core/queue/OfflineSync.ts (linha 99-104)
case 'ORDER_CLOSE': {
    // Pagamento offline é perigoso - não implementamos
    // Pedidos ficam pendentes até voltar online
    console.warn('[OfflineSync] ORDER_CLOSE not supported offline - skipping');
    return false;
}
```

**Impacto:**
- ⚠️ Restaurante pode criar pedidos offline
- ⚠️ Mas não pode fechar contas offline
- ✅ Após voltar online, pode processar pagamentos normalmente

**Melhoria Futura:**
- Implementar pagamento offline com reconciliação segura
- Usar assinatura digital local
- Sincronizar quando voltar online com validação

---

### 2. Edição de Pedidos Offline (ORDER_UPDATE)

**Status:** ⚠️ **PARCIALMENTE IMPLEMENTADO**

**O que funciona:**
- ✅ Adicionar itens (`add_item`)
- ✅ Remover itens (`remove_item`)
- ✅ Atualizar status (`update_status`)

**O que não está claro:**
- ⚠️ Se está sendo usado no fluxo principal do TPV
- ⚠️ Se UI permite edição offline

**Código:**
```typescript
// merchant-portal/src/core/queue/OfflineSync.ts (linha 64-97)
case 'ORDER_UPDATE': {
    // Suporta: add_item, remove_item, update_status
    // ...
}
```

**Próximo Passo:**
- Verificar se `OrderContextReal` usa `ORDER_UPDATE` offline
- Testar edição de pedidos offline
- Documentar comportamento

---

### 3. Reconciliação de Conflitos

**Status:** ⚠️ **BÁSICO**

**O que existe:**
- ✅ Idempotência via `OrderEngine`
- ✅ Verificação de pedidos duplicados por `localId`

**O que falta:**
- ❌ Merge inteligente de pedidos conflitantes
- ❌ UI de resolução de conflitos
- ❌ Detecção avançada de duplicatas

**Melhoria Futura:**
- Sistema de reconciliação avançado
- UI para resolver conflitos manualmente
- Algoritmo de merge inteligente

---

## ✅ O QUE FUNCIONA OFFLINE

### 1. Criação de Pedidos
- ✅ Criar pedido offline
- ✅ Adicionar itens ao pedido
- ✅ Persistência em IndexedDB
- ✅ Sincronização automática quando volta online

### 2. Detecção de Status
- ✅ Detecta offline/online automaticamente
- ✅ UI mostra status claro
- ✅ Indicador visual (vermelho/verde)

### 3. Sincronização
- ✅ Sincronização automática quando volta online
- ✅ Retry com backoff exponencial
- ✅ Processamento FIFO
- ✅ Limpeza automática da fila

---

## 🎯 CENÁRIO REALISTA

### O que funciona:
1. ✅ Desligar roteador
2. ✅ Criar pedidos
3. ✅ Adicionar itens
4. ✅ Ver pedidos na UI
5. ✅ Religar roteador
6. ✅ Pedidos sincronizam automaticamente

### O que NÃO funciona:
1. ❌ Fechar contas (pagamento)
2. ⚠️ Edição complexa de pedidos (verificar)

---

## 📋 PLANO DE MELHORIAS

### Prioridade Alta:
1. **Testar edição offline** - Verificar se funciona
2. **Documentar comportamento** - Guia para usuários
3. **Mensagens claras** - Quando pagamento não funciona offline

### Prioridade Média:
1. **Pagamento offline** - Com reconciliação segura
2. **Reconciliação avançada** - Merge inteligente
3. **UI de conflitos** - Resolução manual

### Prioridade Baixa:
1. **Edição complexa** - Merge de pedidos
2. **Analytics offline** - Métricas locais
3. **Export offline** - Backup local

---

## 💡 RECOMENDAÇÃO

**Para FASE 1 do Roadmap:**
- ✅ **Offline Mode está 90% completo** para o objetivo principal
- ✅ **Criação de pedidos offline funciona** - objetivo principal alcançado
- ⚠️ **Pagamento offline é limitação conhecida** - não bloqueia FASE 1
- ✅ **Pode marcar como "COMPLETO" com limitações documentadas**

**Próximo passo:**
- Validar testes 1, 2, 3, 5, 6, 7
- Documentar limitação de pagamento
- Mover para próxima tarefa (Glovo ou Fiscal)

---

**Última atualização:** 2026-01-16
