# 🧪 TESTE OFFLINE MODE - PASSO A PASSO

**Data:** 16 Janeiro 2026  
**Objetivo:** Validar que Offline Mode funciona corretamente

---

## 🎯 TESTE RÁPIDO (30 minutos)

### Passo 1: Preparar Ambiente

1. **Abrir TPV no navegador**
   - URL: `http://localhost:5175` (ou URL de produção)
   - Fazer login como restaurante

2. **Abrir DevTools**
   - Pressionar `F12` ou `Cmd+Option+I` (Mac)
   - Ir para aba **"Network"**
   - Marcar checkbox **"Offline"** (simula sem internet)

3. **Abrir Console**
   - Ir para aba **"Console"**
   - Filtrar por: `[OrderContext]`, `[OfflineOrderContext]`, `[OfflineSync]`

---

### Passo 2: Criar Pedido Offline

1. **No TPV:**
   - Selecionar uma mesa
   - Adicionar 2-3 itens ao pedido
   - Clicar em "Criar Pedido" ou "Confirmar"

2. **O que verificar no Console:**
   ```
   [OrderContext] ⚠️ Offline Mode detected. Creating local order.
   [OfflineOrderContext] Order added to offline queue
   ```

3. **O que verificar na UI:**
   - ✅ Pedido aparece na lista de pedidos
   - ✅ Indicador mostra "OFFLINE" ou "X Pending"
   - ✅ Status visual diferente (ex: cor laranja/vermelha)

---

### Passo 3: Verificar IndexedDB

1. **DevTools → Application → IndexedDB**
2. **Abrir:** `chefiapp_offline_queue` → `queue`
3. **Verificar que há 1 item com:**
   ```json
   {
     "id": "uuid-gerado",
     "type": "ORDER_CREATE",
     "status": "queued",
     "payload": {
       "restaurant_id": "...",
       "table_number": "...",
       "items": [...]
     },
     "createdAt": 1234567890,
     "attempts": 0
   }
   ```

---

### Passo 4: Sincronização Automática

1. **DevTools → Network → Desmarcar "Offline"**
2. **Aguardar 5-10 segundos**
3. **Verificar Console:**
   ```
   [OfflineOrderContext] Network online detected
   [OfflineOrderContext] Processing offline queue...
   [OfflineSync] Processing item [id] (ORDER_CREATE)
   [OfflineSync] Success: [id]
   ```

4. **Verificar IndexedDB:**
   - Item deve ter `status: "synced"` ou ser removido

5. **Verificar UI:**
   - Indicador deve mudar para "ONLINE" (verde)
   - Pedido deve aparecer como sincronizado

---

### Passo 5: Verificar Supabase

1. **Abrir Dashboard:**
   - https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/editor
   - Tabela: `gm_orders`

2. **Verificar:**
   - Pedido criado offline deve aparecer na tabela
   - `created_at` deve ser recente
   - `status` deve ser `pending` ou `active`

---

## ✅ RESULTADO ESPERADO

**Se tudo funcionar:**
- ✅ Pedido criado offline aparece na UI
- ✅ Pedido salvo no IndexedDB
- ✅ Sincronização automática quando volta online
- ✅ Pedido aparece no banco de dados Supabase
- ✅ Console mostra logs corretos

**Se algo falhar:**
- ⚠️ Documentar o erro específico
- ⚠️ Verificar logs do console
- ⚠️ Verificar `OFFLINE_MODE_LIMITACOES.md`

---

## 🐛 TROUBLESHOOTING COMUM

### Problema: Pedido não aparece na UI
**Verificar:**
- Console para erros JavaScript
- Se `OrderContextReal` está detectando offline
- Se `addToQueue` foi chamado

**Solução:** Verificar se `isOffline` está sendo detectado corretamente

---

### Problema: Sincronização não inicia
**Verificar:**
- Se `window.addEventListener('online')` está funcionando
- Se `processQueue()` está sendo chamado
- Console para erros de rede

**Solução:** Verificar se eventos `online`/`offline` estão sendo disparados

---

### Problema: Pedidos duplicados
**Verificar:**
- Se idempotência está funcionando
- Se `checkExistingOrder` está sendo chamado
- Logs de `OfflineSync`

**Solução:** Verificar lógica de idempotência no `OrderEngine`

---

## 📋 CHECKLIST DE VALIDAÇÃO

- [ ] TESTE RÁPIDO: Criar pedido offline → Sincronizar
- [ ] TESTE 1: Detecção de offline funciona
- [ ] TESTE 2: Criar pedido offline funciona
- [ ] TESTE 3: Múltiplos pedidos offline funcionam
- [ ] TESTE 4: Fechar conta offline (documentar limitação)
- [ ] TESTE 5: Sincronização automática funciona
- [ ] TESTE 6: Retry e backoff funcionam
- [ ] TESTE 7: Cenário real completo funciona

**Se todos marcados:** ✅ Offline Mode 100% validado!

---

## 🎯 PRÓXIMO PASSO APÓS VALIDAÇÃO

**Se validação passar:**
- ✅ Marcar Offline Mode como 100% completo
- ✅ FASE 1 avança para 70%
- ✅ Próximo: Finalizar Glovo ou Fiscal

**Se validação falhar:**
- ⚠️ Documentar problemas encontrados
- ⚠️ Corrigir bugs
- ⚠️ Revalidar

---

**Última atualização:** 2026-01-16
