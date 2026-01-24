# ✅ VALIDAR OFFLINE MODE - GUIA PRÁTICO

**Status:** Offline Mode 90% completo, pronto para validação  
**Tempo:** 2-3 dias  
**Objetivo:** Confirmar que funciona no cenário real

---

## 🎯 CENÁRIO DE TESTE PRINCIPAL

**"Desligar roteador e continuar operando"**

1. ✅ Desligar roteador (ou Network → Offline)
2. ✅ Criar pedidos offline
3. ✅ Adicionar itens aos pedidos
4. ⚠️ Fechar contas offline (limitação conhecida)
5. ✅ Religar roteador
6. ✅ Verificar sincronização automática

---

## 🧪 TESTE RÁPIDO (30 minutos)

### Passo 1: Preparar Ambiente
1. Abrir TPV no navegador
2. Abrir DevTools (F12)
3. Ir para aba "Network"
4. Marcar checkbox "Offline"

### Passo 2: Criar Pedido Offline
1. No TPV, criar um novo pedido
2. Selecionar mesa
3. Adicionar 2-3 itens
4. Confirmar criação

**O que verificar:**
- ✅ Pedido aparece na UI imediatamente
- ✅ Indicador mostra "OFFLINE" ou "X Pending"
- ✅ Console mostra: `[OrderContext] ⚠️ Offline Mode detected`

### Passo 3: Verificar IndexedDB
1. DevTools → Application → IndexedDB
2. Abrir: `chefiapp_offline_queue` → `queue`
3. Verificar que há 1 item com:
   - `type: 'ORDER_CREATE'`
   - `status: 'queued'`
   - `payload: { restaurant_id, items, ... }`

### Passo 4: Sincronização Automática
1. DevTools → Network → Desmarcar "Offline"
2. Aguardar 5-10 segundos
3. Verificar console:
   - `[OfflineOrderContext] Network online detected`
   - `[OfflineOrderContext] Processing offline queue...`
   - `[OfflineReconciler] Success: [id]`

### Passo 5: Verificar Supabase
1. Abrir Dashboard: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/editor
2. Verificar tabela `gm_orders`
3. Pedido deve aparecer lá

---

## ✅ RESULTADO ESPERADO

**Se tudo funcionar:**
- ✅ Pedido criado offline aparece na UI
- ✅ Pedido salvo no IndexedDB
- ✅ Sincronização automática quando volta online
- ✅ Pedido aparece no banco de dados

**Se algo falhar:**
- ⚠️ Documentar o erro
- ⚠️ Verificar logs do console
- ⚠️ Verificar `OFFLINE_MODE_LIMITACOES.md`

---

## 📋 TESTES COMPLETOS (2-3 dias)

Para validação completa, executar todos os 7 testes:

1. **TESTE 1:** Detecção de offline
2. **TESTE 2:** Criar pedido offline
3. **TESTE 3:** Múltiplos pedidos offline
4. **TESTE 4:** Fechar conta offline (documentar limitação)
5. **TESTE 5:** Sincronização automática
6. **TESTE 6:** Retry e backoff
7. **TESTE 7:** Cenário real completo

**Guia completo:** `VALIDAR_OFFLINE_MODE.md`

---

## 🐛 TROUBLESHOOTING

### Problema: Pedido não aparece na UI
**Solução:** Verificar console para erros

### Problema: Sincronização não inicia
**Solução:** Verificar se `window.addEventListener('online')` está funcionando

### Problema: Pedidos duplicados
**Solução:** Verificar idempotência no `OrderEngine`

**Mais detalhes:** `OFFLINE_MODE_LIMITACOES.md`

---

## 📊 CHECKLIST DE VALIDAÇÃO

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

Se validação passar:
- ✅ Marcar Offline Mode como 100% completo
- ✅ FASE 1 avança para 70%
- ✅ Próximo: Finalizar Glovo ou Fiscal

Se validação falhar:
- ⚠️ Documentar problemas
- ⚠️ Corrigir bugs encontrados
- ⚠️ Revalidar

---

**Última atualização:** 2026-01-16
