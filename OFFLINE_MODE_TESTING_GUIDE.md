# 🧪 GUIA DE TESTES - OFFLINE MODE

**Data:** 17 Janeiro 2026  
**Status:** ✅ Implementação completa, aguardando testes

---

## 🎯 OBJETIVO

Validar que o sistema funciona completamente offline:
- Criar pedidos offline
- Ver pedidos na UI (otimista)
- Sincronizar automaticamente quando volta online
- Não criar pedidos duplicados (idempotência)

---

## 📋 CHECKLIST DE TESTES

### Teste 1: Criar Pedido Offline (Básico)

**Passos:**
1. Abrir TPV no navegador
2. Abrir caixa (se necessário)
3. **Desligar WiFi** (ou usar DevTools → Network → Offline)
4. Criar pedido (adicionar item do menu)
5. Verificar que pedido aparece na UI
6. Verificar que `OfflineStatusBadge` mostra "Offline - 1 pedido pendente"
7. Verificar IndexedDB (DevTools → Application → IndexedDB → `chefiapp_offline_queue`)

**Resultado Esperado:**
- ✅ Pedido aparece na UI imediatamente
- ✅ Badge mostra "Offline - 1 pedido pendente"
- ✅ Item aparece na fila IndexedDB com status "queued"

---

### Teste 2: Múltiplos Pedidos Offline

**Passos:**
1. Continuar offline
2. Criar 20 pedidos diferentes
3. Verificar que todos aparecem na UI
4. Verificar que badge mostra "Offline - 20 pedidos pendentes"
5. Verificar IndexedDB (deve ter 20 itens)

**Resultado Esperado:**
- ✅ Todos os 20 pedidos aparecem na UI
- ✅ Badge mostra "Offline - 20 pedidos pendentes"
- ✅ 20 itens na fila IndexedDB

---

### Teste 3: Sincronização Automática

**Passos:**
1. Continuar offline (20 pedidos criados)
2. **Ligar WiFi** (ou usar DevTools → Network → Online)
3. Aguardar sincronização (badge deve mostrar "Sincronizando...")
4. Verificar que pedidos aparecem no banco (Supabase Dashboard)
5. Verificar que badge volta para "Online" (ou desaparece)

**Resultado Esperado:**
- ✅ Badge mostra "Sincronizando..." durante sync
- ✅ Todos os 20 pedidos aparecem no banco
- ✅ Badge desaparece ou mostra "Online"
- ✅ Fila IndexedDB fica vazia (ou itens marcados como "synced")

---

### Teste 4: Idempotência (Não Duplicar)

**Passos:**
1. Criar pedido offline (pedido A)
2. Ligar WiFi (sincronizar)
3. Desligar WiFi novamente
4. Tentar criar pedido A novamente (mesma mesa, mesmos itens)
5. Ligar WiFi (sincronizar)
6. Verificar que não há pedidos duplicados no banco

**Resultado Esperado:**
- ✅ Sistema detecta pedido duplicado
- ✅ Não cria pedido duplicado no banco
- ✅ Apenas 1 pedido A no banco

---

### Teste 5: Falha de Sincronização

**Passos:**
1. Criar pedido offline
2. Ligar WiFi
3. Simular erro (desligar Supabase temporariamente)
4. Verificar que pedido fica como "failed" na fila
5. Verificar que badge mostra "X pedidos pendentes" (não "Offline")
6. Ligar Supabase novamente
7. Verificar que sincroniza automaticamente

**Resultado Esperado:**
- ✅ Pedido marcado como "failed" após 5 tentativas
- ✅ Badge mostra pedidos pendentes (não "Offline")
- ✅ Sincroniza automaticamente quando Supabase volta

---

## 🔧 COMO EXECUTAR TESTES

### Método 1: DevTools (Recomendado)

1. Abrir Chrome DevTools (F12)
2. Ir em **Network** tab
3. Marcar checkbox **"Offline"**
4. Executar testes
5. Desmarcar **"Offline"** para voltar online

### Método 2: Desligar WiFi Real

1. Desligar WiFi do computador
2. Executar testes
3. Ligar WiFi novamente

### Método 3: Throttling (Simular Conexão Lenta)

1. DevTools → Network
2. Throttling → "Slow 3G"
3. Executar testes (simula conexão instável)

---

## 📊 VALIDAÇÃO NO BANCO

### Verificar Pedidos no Supabase

```sql
-- Ver pedidos criados offline (devem ter notes contendo "[Offline]")
SELECT 
    id,
    restaurant_id,
    table_number,
    status,
    notes,
    created_at
FROM gm_orders
WHERE notes LIKE '%[Offline]%'
ORDER BY created_at DESC
LIMIT 20;
```

### Verificar Fila IndexedDB

1. DevTools → Application → IndexedDB
2. `chefiapp_offline_queue` → `queue`
3. Verificar itens:
   - `status`: "queued" | "syncing" | "failed" | "synced"
   - `attempts`: número de tentativas
   - `nextRetryAt`: próxima tentativa (se failed)

---

## 🐛 PROBLEMAS COMUNS

### Problema: Pedidos não aparecem na UI offline

**Causa:** `createOrderOffline` não está retornando pedido otimista  
**Solução:** Verificar que `OrderEngineOffline.ts` retorna pedido com todos os campos

### Problema: Sincronização não acontece automaticamente

**Causa:** `OfflineOrderContext` não está escutando evento "online"  
**Solução:** Verificar que `useEffect` em `OfflineOrderContext.tsx` tem listener

### Problema: Pedidos duplicados no banco

**Causa:** Idempotência não está funcionando  
**Solução:** Verificar que `checkOrderSynced` está sendo chamado antes de criar

---

## ✅ CRITÉRIOS DE SUCESSO

- [ ] Criar 20 pedidos offline → todos aparecem na UI
- [ ] Ligar WiFi → todos sincronizam automaticamente
- [ ] Verificar banco → 20 pedidos criados (sem duplicados)
- [ ] Badge mostra status correto em cada etapa
- [ ] Fila IndexedDB limpa após sincronização

---

**Próxima ação:** Executar Teste 1 (criar pedido offline básico)
