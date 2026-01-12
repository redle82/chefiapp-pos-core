# 🧪 GUIA DE TESTES - OFFLINE MODE

**Data:** 12 Janeiro 2026  
**Objetivo:** Validar que Offline Mode funciona corretamente em todos os cenários

---

## 📋 PRÉ-REQUISITOS

1. ✅ Servidor local rodando (`npm run dev`)
2. ✅ Banco de dados Supabase acessível
3. ✅ Usuário logado no sistema
4. ✅ Caixa aberto
5. ✅ Menu configurado (pelo menos 1 item)

---

## 🧪 TESTE 1: Criar Pedido Offline

### **Objetivo:** Validar que pedidos são criados localmente quando offline

### **Passos:**
1. Abrir TPV no navegador
2. Verificar que `OfflineStatusBadge` mostra "Online" (ou está oculto)
3. **Desligar WiFi** (ou usar DevTools → Network → Offline)
4. Criar um pedido:
   - Selecionar mesa
   - Adicionar item ao pedido
   - Confirmar criação
5. Verificar que pedido aparece na UI imediatamente
6. Verificar que `OfflineStatusBadge` mostra "Offline - 1 pedido pendente"
7. Abrir DevTools → Application → IndexedDB → `chefiapp_offline_queue`
8. Verificar que há 1 item na fila com `type: 'ORDER_CREATE'`

### **Resultado Esperado:**
- ✅ Pedido aparece na UI imediatamente
- ✅ Badge mostra "Offline - 1 pedido pendente"
- ✅ Item está na fila IndexedDB

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 🧪 TESTE 2: Sincronização Automática

### **Objetivo:** Validar que pedidos são sincronizados automaticamente quando volta online

### **Passos:**
1. **Criar 3 pedidos offline** (seguir Teste 1, repetir 3x)
2. Verificar que `OfflineStatusBadge` mostra "Offline - 3 pedidos pendentes"
3. Verificar que há 3 itens na fila IndexedDB
4. **Ligar WiFi** (ou desabilitar "Offline" no DevTools)
5. Observar `OfflineStatusBadge` mudar para "Sincronizando..."
6. Aguardar sincronização (pode levar alguns segundos)
7. Verificar que `OfflineStatusBadge` muda para "Online" (ou oculta)
8. Verificar que fila IndexedDB está vazia (ou itens marcados como `applied`)
9. Abrir Supabase Dashboard → `gm_orders`
10. Verificar que há 3 pedidos novos no banco

### **Resultado Esperado:**
- ✅ Badge muda para "Sincronizando..." durante sync
- ✅ Todos os 3 pedidos aparecem no banco
- ✅ Fila IndexedDB está vazia após sync
- ✅ Badge mostra "Online" quando termina

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 🧪 TESTE 3: Adicionar Item Offline

### **Objetivo:** Validar que itens podem ser adicionados a pedidos offline

### **Passos:**
1. **Criar pedido offline** (seguir Teste 1)
2. Verificar que pedido aparece na UI
3. **Adicionar item ao pedido** (clicar no pedido, adicionar item)
4. Verificar que item aparece na UI imediatamente
5. Verificar que há 2 itens na fila IndexedDB:
   - 1x `ORDER_CREATE` (criação do pedido)
   - 1x `ORDER_ADD_ITEM` (adição do item)
6. **Ligar WiFi**
7. Aguardar sincronização
8. Verificar que pedido no banco tem 2 itens

### **Resultado Esperado:**
- ✅ Item aparece na UI imediatamente
- ✅ Ação `ORDER_ADD_ITEM` está na fila
- ✅ Após sync, pedido no banco tem 2 itens

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 🧪 TESTE 4: Retry com Falha

### **Objetivo:** Validar que sistema tenta novamente quando há falha

### **Passos:**
1. **Criar pedido offline** (seguir Teste 1)
2. **Ligar WiFi** (mas Supabase está down ou lento)
3. Verificar que `OfflineStatusBadge` mostra "1 pedido pendente"
4. Verificar que item na fila tem `status: 'failed'` ou `status: 'queued'`
5. Verificar que item tem `attempts: 1` (ou mais)
6. **Corrigir Supabase** (ou aguardar timeout)
7. Aguardar retry automático (pode levar alguns segundos devido ao backoff)
8. Verificar que pedido sincroniza

### **Resultado Esperado:**
- ✅ Sistema tenta novamente automaticamente
- ✅ Backoff exponencial funciona (delay aumenta entre tentativas)
- ✅ Pedido sincroniza quando Supabase volta

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 🧪 TESTE 5: Múltiplos Pedidos (20 pedidos)

### **Objetivo:** Validar que sistema lida com muitos pedidos offline

### **Passos:**
1. **Desligar WiFi**
2. **Criar 20 pedidos rapidamente** (repetir Teste 1, 20x)
3. Verificar que todos os 20 pedidos aparecem na UI
4. Verificar que `OfflineStatusBadge` mostra "Offline - 20 pedidos pendentes"
5. Verificar que há 20 itens na fila IndexedDB
6. **Ligar WiFi**
7. Observar sincronização (pode levar 1-2 minutos)
8. Verificar que `OfflineStatusBadge` mostra "Sincronizando..." durante sync
9. Aguardar sincronização completa
10. Verificar que todos os 20 pedidos estão no banco
11. Verificar que fila IndexedDB está vazia

### **Resultado Esperado:**
- ✅ Todos os 20 pedidos aparecem na UI
- ✅ Sincronização processa todos os pedidos
- ✅ Todos os 20 pedidos estão no banco após sync
- ✅ Fila está vazia

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 🧪 TESTE 6: Atualizar Quantidade Offline

### **Objetivo:** Validar que quantidades podem ser atualizadas offline

### **Passos:**
1. **Criar pedido offline com 2 itens** (seguir Teste 1, adicionar 2 itens)
2. **Atualizar quantidade** de um item (aumentar de 1 para 3)
3. Verificar que quantidade atualiza na UI
4. Verificar que há ação `ORDER_UPDATE_ITEM_QTY` na fila
5. **Ligar WiFi**
6. Aguardar sincronização
7. Verificar que quantidade está correta no banco

### **Resultado Esperado:**
- ✅ Quantidade atualiza na UI imediatamente
- ✅ Ação está na fila
- ✅ Quantidade está correta no banco após sync

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 🧪 TESTE 7: Remover Item Offline

### **Objetivo:** Validar que itens podem ser removidos offline

### **Passos:**
1. **Criar pedido offline com 2 itens** (seguir Teste 1, adicionar 2 itens)
2. **Remover um item** do pedido
3. Verificar que item desaparece da UI
4. Verificar que há ação `ORDER_REMOVE_ITEM` na fila
5. **Ligar WiFi**
6. Aguardar sincronização
7. Verificar que pedido no banco tem apenas 1 item

### **Resultado Esperado:**
- ✅ Item desaparece da UI imediatamente
- ✅ Ação está na fila
- ✅ Pedido no banco tem apenas 1 item após sync

### **Resultado Real:**
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever erro)

---

## 📊 RESUMO DOS TESTES

| Teste | Status | Observações |
|-------|--------|-------------|
| Teste 1: Criar Pedido Offline | [ ] | |
| Teste 2: Sincronização Automática | [ ] | |
| Teste 3: Adicionar Item Offline | [ ] | |
| Teste 4: Retry com Falha | [ ] | |
| Teste 5: Múltiplos Pedidos (20) | [ ] | |
| Teste 6: Atualizar Quantidade Offline | [ ] | |
| Teste 7: Remover Item Offline | [ ] | |

---

## 🐛 BUGS ENCONTRADOS

### **Bug 1:**
- **Descrição:**
- **Passos para reproduzir:**
- **Resultado esperado:**
- **Resultado real:**
- **Severidade:** [ ] Crítica [ ] Alta [ ] Média [ ] Baixa

---

## ✅ CONCLUSÃO

**Status Geral:** [ ] ✅ Todos os testes passaram [ ] ⚠️ Alguns testes falharam [ ] ❌ Muitos testes falharam

**Próximos Passos:**
- [ ] Corrigir bugs encontrados
- [ ] Re-executar testes
- [ ] Considerar completo quando todos passarem
