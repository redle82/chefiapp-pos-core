# 🔄 FASE 5: Ciclo Completo de Compras

**Data:** 26/01/2026  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Fechar o ciclo operacional completo do sistema de estoque:

```
Estoque ↓ → Alerta → Task → Lista de Compras → Compra → Reposição → Estoque ↑
```

---

## 📐 Dois Modos de Operação

### 🔴 Modo Cascata (Padrão)
- **Objetivo:** Validar que o sistema **não mente** quando estoque chega a zero
- **Comportamento:** Estoque pode chegar a zero → pedidos bloqueados → FASE marca ❌
- **Resultado esperado:** FAIL CORRETO (sistema respeita limite físico)
- **Uso:** Validação de integridade constitucional

### 🟢 Modo Controlado (`FASE_5_MODE=controlled`)
- **Objetivo:** Validar o **ciclo completo de compras** sob stress
- **Comportamento:** Executa todo o fluxo de compras → estoque nunca zera → FASE passa
- **Resultado esperado:** PASS (sistema se comporta como restaurante real)
- **Uso:** Validação de operação completa

---

## 🔄 Ciclo Completo de Compras (Modo Controlado)

### Passo 1: Redução de Estoque (Simula Consumo Real)
```sql
UPDATE gm_stock_levels
SET qty = GREATEST(min_qty * 0.3, qty * 0.4)
WHERE ... (ingredientes críticos)
```
- Reduz estoque para níveis críticos (mas não zero)
- Simula consumo real de pedidos

### Passo 2: Geração de Lista de Compras (Sistema Real)
```sql
SELECT public.generate_shopping_list($1::UUID) as result
```
- Usa o RPC real do sistema
- Identifica ingredientes abaixo do mínimo
- Calcula quantidade sugerida (com buffer)
- Ordena por urgência (CRITICAL, HIGH, MEDIUM)

### Passo 3: Latência de Fornecedor (Realismo)
- Simula tempo de resposta do fornecedor: **2-5 segundos por item**
- Processa compras em lotes (não tudo instantâneo)
- Simula realidade operacional

### Passo 4: Confirmação de Compra (Sistema Real)
```sql
SELECT public.confirm_purchase(
  $1::UUID,  -- restaurant_id
  $2::UUID,  -- ingredient_id
  $3::UUID,  -- location_id
  $4::NUMERIC,  -- qty_received
  $5::INTEGER,  -- purchase_price_cents
  'PURCHASE'::TEXT
) as result
```
- Usa o RPC real do sistema
- Atualiza `gm_stock_levels.qty` (atomicamente)
- Registra no `gm_stock_ledger` (action: 'IN', reason: 'PURCHASE')
- **Fecha tarefas de ESTOQUE_CRITICO automaticamente**
- Retorna: novo estoque, tarefas fechadas

### Passo 5: Validação do Loop Fechado
- Verifica que estoque foi atualizado
- Verifica que tarefas foram fechadas
- Verifica que ledger foi atualizado
- Valida que sistema pode continuar operando

---

## 📊 Métricas Coletadas

### Modo Controlado
- `shoppingListTotal`: Total de itens na lista de compras
- `autoReplenished`: Compras confirmadas
- `tasksClosedTotal`: Tarefas fechadas automaticamente
- `stockAboveMin`: Estoque acima do mínimo após compras
- `ledgerPurchases`: Compras registradas no ledger

### Modo Cascata
- `criticalIngredientsBroken`: Ingredientes críticos quebrados
- `cascadeBroken`: Ingredientes quebrados em cascata
- `stockBelowMin`: Estoque abaixo do mínimo (validação de limite)

---

## 🎯 Critério de Sucesso

### Modo Controlado
✅ **PASSA** se:
- Lista de compras gerada com sucesso
- Compras confirmadas via RPC real
- Estoque reposto acima do mínimo
- Tarefas fechadas automaticamente
- Sistema pode continuar operando

### Modo Cascata
✅ **FALHA CORRETAMENTE** se:
- Estoque chega a zero
- Pedidos são bloqueados
- Sistema se recusa a continuar
- **Isso é comportamento esperado, não bug**

---

## 🚀 Como Usar

```bash
# Modo Controlado (ciclo completo de compras)
FASE_5_MODE=controlled npx tsx scripts/teste-massivo-nivel-5/index.ts

# Modo Cascata (validação de limite físico)
npx tsx scripts/teste-massivo-nivel-5/index.ts
```

---

## 💡 Por Que Isso Importa

### Antes (Modo Cascata)
- Validava que o Core **não mente** sobre estoque
- Provava integridade constitucional
- Mas não testava o ciclo completo

### Agora (Modo Controlado)
- Valida o **ciclo completo de compras**
- Simula operação real de restaurante
- Testa latência de fornecedor
- Valida fechamento automático de tarefas
- **Nível enterprise real**

---

## 📝 Notas Técnicas

1. **Sistema de Compras Já Existia:**
   - `generate_shopping_list` - RPC já implementado
   - `confirm_purchase` - RPC já implementado
   - UI de compras já funcionando

2. **O Que Mudou:**
   - FASE 5 agora **executa** o ciclo completo
   - Antes apenas **gerava** lista, não confirmava compras
   - Agora simula fornecedor e confirma compras via RPC real

3. **Ordem Correta:**
   - Primeiro: Validar que Core não mente (Modo Cascata)
   - Depois: Validar ciclo completo (Modo Controlado)
   - **A ordem foi correta**

---

*Documentação atualizada em: 26/01/2026*
