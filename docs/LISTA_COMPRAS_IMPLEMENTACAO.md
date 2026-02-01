# Lista de Compras — Implementação ✅

**Data:** 2026-01-26  
**Status:** ✅ COMPLETO

---

## 🎯 Objetivo

Criar lista de compras automática baseada em estoque abaixo do mínimo, conectando o sistema de estoque (`gm_stock_levels`) com uma interface prática para gestão de compras.

---

## ✅ O que foi implementado

### 1. RPC Backend

**Arquivo:** `docker-core/schema/migrations/20260126_generate_shopping_list_rpc.sql`

**Função:** `generate_shopping_list(p_restaurant_id UUID)`

**Lógica:**
- Identifica ingredientes com `qty <= min_qty`
- Agrupa por ingrediente (soma de todos os locais)
- Calcula quantidade sugerida:
  - **Crítico** (qty = 0): `min_qty * 3`
  - **Muito baixo** (qty < min_qty * 0.5): `min_qty * 2`
  - **Normal** (qty < min_qty): `min_qty * 2 - qty`
- Ordena por urgência (CRITICAL → HIGH → MEDIUM)

**Retorno:**
```json
[
  {
    "ingredient_id": "...",
    "ingredient_name": "Limão",
    "unit": "unit",
    "current_qty": 5,
    "min_qty": 10,
    "suggested_qty": 15,
    "urgency": "HIGH",
    "deficit": 5
  }
]
```

### 2. Reader Frontend

**Arquivo:** `merchant-portal/src/core-boundary/readers/ShoppingListReader.ts`

**Função:** `generateShoppingList(restaurantId: string)`

- Chama RPC `generate_shopping_list`
- Retorna array tipado de `ShoppingListItem`

### 3. UI Mínima

**Arquivo:** `merchant-portal/src/pages/ShoppingList/ShoppingListMinimal.tsx`

**Funcionalidades:**
- ✅ Lista de ingredientes abaixo do mínimo
- ✅ Indicadores de urgência (Crítico, Alto, Médio)
- ✅ Estatísticas (críticos, altos, total)
- ✅ Informações detalhadas:
  - Quantidade atual
  - Quantidade mínima
  - Déficit
  - Sugestão de compra
- ✅ Atualização automática (30s)
- ✅ Botão de atualização manual

**Rota:** `/shopping-list`

---

## 📊 Fluxo de Dados

```
gm_stock_levels (qty, min_qty)
    ↓
generate_shopping_list RPC
    ↓
ShoppingListReader
    ↓
ShoppingListMinimal UI
```

---

## 🧪 Validação

### Teste Manual

1. **Acessar:** `http://localhost:5173/shopping-list`
2. **Verificar:**
   - ✅ Lista carrega automaticamente
   - ✅ Ingredientes abaixo do mínimo aparecem
   - ✅ Urgência calculada corretamente
   - ✅ Quantidade sugerida faz sentido
   - ✅ Atualização automática funciona

### Teste com Dados Reais

O Teste Massivo Nível 3 já valida:
- ✅ Estoque abaixo do mínimo detectado
- ✅ Tarefas de `ESTOQUE_CRITICO` geradas
- ✅ Agora a lista de compras complementa isso

---

## 📝 Exemplo de Uso

### Cenário 1: Estoque Crítico

**Dados:**
- Limão: `qty = 0`, `min_qty = 10`

**Resultado:**
- Urgência: `CRITICAL`
- Sugestão: `30 unit` (3x o mínimo)

### Cenário 2: Estoque Baixo

**Dados:**
- Carne: `qty = 2000g`, `min_qty = 4000g`

**Resultado:**
- Urgência: `HIGH`
- Sugestão: `6000g` (2x o mínimo - atual)

### Cenário 3: Estoque Normal (mas abaixo do mínimo)

**Dados:**
- Queijo: `qty = 5000g`, `min_qty = 6000g`

**Resultado:**
- Urgência: `MEDIUM`
- Sugestão: `7000g` (2x o mínimo - atual)

---

## 🔧 Próximos Passos (Opcionais)

1. **Exportar Lista:**
   - Botão para exportar como PDF/CSV
   - Compartilhar via WhatsApp/Email

2. **Histórico:**
   - Salvar listas geradas
   - Comparar com compras realizadas

3. **Integração com Fornecedores:**
   - Enviar lista diretamente para fornecedor
   - Preços estimados

4. **Ajustes Manuais:**
   - Permitir editar quantidade sugerida
   - Adicionar itens manualmente

---

## 📊 Status Atual

| Componente | Status | Notas |
|------------|--------|-------|
| RPC Backend | ✅ | `generate_shopping_list` funcionando |
| Reader | ✅ | `ShoppingListReader` implementado |
| UI | ✅ | `ShoppingListMinimal` completa |
| Rota | ✅ | `/shopping-list` configurada |

---

**Conclusão:** Lista de Compras está **100% operacional** e conectada ao sistema de estoque.
