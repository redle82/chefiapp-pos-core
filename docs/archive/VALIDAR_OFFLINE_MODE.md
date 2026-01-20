# ✅ VALIDAÇÃO OFFLINE MODE - GUIA COMPLETO

**Objetivo:** Validar que o sistema funciona completamente offline  
**Cenário de Teste:** "Desligar roteador e continuar operando"  
**Status:** 90% implementado, precisa validação

---

## 🎯 CRITÉRIO DE SUCESSO

**Cenário Completo:**
1. ✅ Desligar o roteador do restaurante
2. ✅ Criar pedidos offline
3. ✅ Adicionar itens aos pedidos
4. ✅ Fechar contas offline
5. ✅ Imprimir na cozinha (se possível offline)
6. ✅ Religar o roteador
7. ✅ Tudo sincroniza automaticamente sem intervenção

**Resultado Esperado:** "Você pode vender sem medo."

---

## 🧪 TESTES DETALHADOS

### TESTE 1: Detecção de Offline

**Passos:**
1. Abrir TPV no navegador
2. Abrir DevTools (F12) → Network tab
3. Marcar "Offline" checkbox
4. Observar UI

**Resultado Esperado:**
- ✅ Indicador mostra "OFFLINE" (vermelho)
- ✅ `SyncStatusIndicator` mostra status offline
- ✅ Título da aba pode mudar para "⚠️ OFFLINE"
- ✅ Console mostra: `[OfflineOrderContext] Network offline detected`

**Arquivos Relacionados:**
- `merchant-portal/src/pages/TPV/context/OfflineOrderContext.tsx`
- `merchant-portal/src/components/SyncStatusIndicator.tsx`

---

### TESTE 2: Criar Pedido Offline

**Passos:**
1. Garantir que está offline (Network → Offline)
2. No TPV, criar um novo pedido
3. Selecionar mesa
4. Adicionar alguns itens
5. Confirmar criação do pedido

**Resultado Esperado:**
- ✅ Pedido aparece na UI imediatamente (otimistic update)
- ✅ Console mostra: `[OrderContext] ⚠️ Offline Mode detected. Creating local order.`
- ✅ Console mostra: `[OfflineOrderContext] Order added to offline queue`
- ✅ Pedido é salvo no IndexedDB
- ✅ Indicador mostra "X Pending" (onde X = número de pedidos)

**Verificação Técnica:**
```javascript
// No DevTools Console:
// 1. Abrir IndexedDB
// 2. Verificar: chefiapp_offline_queue → queue
// 3. Deve ter 1 item com:
//    - type: 'ORDER_CREATE'
//    - status: 'queued'
//    - payload: { restaurant_id, table_number, items, ... }
```

**Arquivos Relacionados:**
- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` (linha ~307)
- `merchant-portal/src/core/queue/db.ts`

---

### TESTE 3: Múltiplos Pedidos Offline

**Passos:**
1. Manter offline
2. Criar 3-5 pedidos diferentes
3. Adicionar itens em cada um
4. Verificar fila

**Resultado Esperado:**
- ✅ Todos os pedidos aparecem na UI
- ✅ Todos estão na fila IndexedDB
- ✅ Indicador mostra "5 Pending"
- ✅ Pedidos mantêm ordem (FIFO)

**Verificação:**
```javascript
// DevTools → Application → IndexedDB → chefiapp_offline_queue → queue
// Deve ter 5 itens, todos com status: 'queued'
```

---

### TESTE 4: Fechar Conta Offline

**Passos:**
1. Manter offline
2. Selecionar um pedido existente
3. Tentar fechar a conta (processar pagamento)
4. Verificar comportamento

**Resultado Esperado:**
- ❌ **LIMITAÇÃO CONHECIDA:** Fechar conta NÃO funciona offline
- ⚠️ Sistema deve mostrar mensagem clara: "Pagamento requer conexão"
- ⚠️ Pedido fica pendente até voltar online
- ✅ Após voltar online, pagamento pode ser processado

**Nota Técnica:**
- `ORDER_CLOSE` não é suportado offline (intencional - segurança)
- Código: `merchant-portal/src/core/queue/OfflineSync.ts` (linha 99-104)
- **Melhoria Futura:** Implementar pagamento offline com reconciliação

---

### TESTE 5: Sincronização Automática

**Passos:**
1. Ter 3-5 pedidos na fila offline
2. Verificar que está offline
3. **Religar internet** (Network → Online)
4. Observar comportamento

**Resultado Esperado:**
- ✅ Console mostra: `[OfflineOrderContext] Network online detected`
- ✅ Console mostra: `[OfflineOrderContext] Processing offline queue...`
- ✅ Pedidos são processados um por vez (FIFO)
- ✅ Console mostra sucesso para cada pedido: `[OfflineReconciler] Success: [id]`
- ✅ Pedidos aparecem no banco de dados (Supabase)
- ✅ Indicador muda para "ONLINE" (verde)
- ✅ Fila IndexedDB é limpa após sincronização

**Verificação:**
```javascript
// 1. Verificar Supabase Dashboard:
//    - Pedidos devem aparecer em gm_orders
//    - Itens devem aparecer em gm_order_items

// 2. Verificar IndexedDB:
//    - Fila deve estar vazia (ou apenas itens 'synced')
```

**Arquivos Relacionados:**
- `merchant-portal/src/pages/TPV/context/OfflineOrderContext.tsx` (linha ~84)
- `merchant-portal/src/core/queue/useOfflineReconciler.ts`

---

### TESTE 6: Retry e Backoff

**Passos:**
1. Criar pedido offline
2. Religar internet
3. **Simular falha** (bloquear API temporariamente)
4. Observar retry

**Como Simular Falha:**
- Usar Network tab → Throttling → "Slow 3G"
- Ou bloquear domínio da API no DevTools

**Resultado Esperado:**
- ✅ Sistema tenta sincronizar
- ✅ Se falhar, incrementa `attempts`
- ✅ Calcula `nextRetryAt` com backoff exponencial
- ✅ Tenta novamente após delay
- ✅ Máximo 5 tentativas antes de marcar como `failed`

**Verificação:**
```javascript
// IndexedDB → queue
// Item deve ter:
// - attempts: 1, 2, 3... (incrementando)
// - nextRetryAt: timestamp futuro
// - lastError: mensagem de erro
```

---

### TESTE 7: Cenário Real Completo

**Passos:**
1. **Setup:** Abrir TPV, garantir online
2. **Desligar roteador** (ou Network → Offline)
3. **Criar 3 pedidos** diferentes
4. **Adicionar itens** em cada pedido
5. **Aguardar 30 segundos** (simular operação real)
6. **Religar roteador** (ou Network → Online)
7. **Aguardar sincronização** (pode levar 10-30 segundos)
8. **Verificar Supabase Dashboard**

**Resultado Esperado:**
- ✅ Todos os pedidos aparecem no banco
- ✅ Todos os itens estão corretos
- ✅ Timestamps são preservados
- ✅ Nenhum dado foi perdido
- ✅ Sistema volta ao normal automaticamente

---

## 🐛 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema 1: Sincronização não inicia automaticamente
**Sintoma:** Pedidos ficam na fila mesmo após voltar online

**Solução:**
- Verificar se `window.addEventListener('online')` está funcionando
- Verificar se `processQueue()` é chamado
- Forçar sincronização manual: `forceSync()` no `SyncStatusIndicator`

### Problema 2: Pedidos duplicados
**Sintoma:** Mesmo pedido aparece múltiplas vezes

**Solução:**
- Verificar idempotência no `OrderEngine.createOrder()`
- Verificar se fila está sendo limpa após sucesso

### Problema 3: IndexedDB não persiste
**Sintoma:** Pedidos desaparecem após refresh

**Solução:**
- Verificar se IndexedDB está sendo usado (não localStorage)
- Verificar permissões do navegador
- Verificar se `OfflineDB.put()` está funcionando

---

## 📊 CHECKLIST DE VALIDAÇÃO

Marque cada item após testar:

- [ ] TESTE 1: Detecção de offline funciona
- [ ] TESTE 2: Criar pedido offline funciona
- [ ] TESTE 3: Múltiplos pedidos offline funcionam
- [ ] TESTE 4: Fechar conta offline (❌ LIMITAÇÃO: não funciona - documentar)
- [ ] TESTE 5: Sincronização automática funciona
- [ ] TESTE 6: Retry e backoff funcionam
- [ ] TESTE 7: Cenário real completo funciona (exceto pagamento)

**Status Esperado:**
- ✅ Testes 1, 2, 3, 5, 6, 7 devem passar
- ⚠️ Teste 4 deve documentar limitação conhecida

**Se todos marcados:** ✅ Offline Mode validado (com limitações documentadas)!

---

## 📝 DOCUMENTAÇÃO A CRIAR

Após validação bem-sucedida:

- [ ] Guia de uso para restaurantes
- [ ] Troubleshooting comum
- [ ] Limitações conhecidas
- [ ] Melhorias futuras

---

**Última atualização:** 2026-01-16
