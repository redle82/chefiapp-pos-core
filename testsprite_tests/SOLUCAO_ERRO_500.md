# 🔧 Solução: Erro 500 ao Criar Pedidos
**Data:** 2026-01-13  
**Problema:** TestSprite retorna 500 Internal Server Error ao criar pedidos

---

## 🔍 Diagnóstico

**Progresso Identificado:**
- ✅ Autenticação funcionando (não é mais 401)
- ✅ Contrato respeitado (não é mais 400)
- ❌ Erro 500 Internal Server Error

**Causa Provável (90%):**
Product ID usado nos testes não existe no banco de dados.

---

## ✅ Solução Rápida

### Opção 1: Criar Produto de Teste (Recomendado)

**Execute no Supabase SQL Editor:**

```sql
-- Verificar restaurante existente
SELECT id FROM gm_restaurants LIMIT 1;

-- Criar produto de teste
INSERT INTO gm_products (
    id,
    restaurant_id,
    name,
    description,
    price_cents,
    currency,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM gm_restaurants LIMIT 1),  -- Usa primeiro restaurante
    'Test Product',
    'Produto de teste para TestSprite',
    1000,  -- 10.00 EUR
    'eur',
    true
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents;
```

**Ou use o script:**
```bash
psql $DATABASE_URL -f scripts/create-test-product.sql
```

---

### Opção 2: Usar Produto Real Existente

**1. Buscar produto existente:**
```sql
SELECT id, name, price_cents, restaurant_id
FROM gm_products
WHERE is_active = true
LIMIT 5;
```

**2. Atualizar TEST_FIXTURE_ORDERS.json:**
```json
{
  "items": [
    {
      "productId": "{{PRODUCT_ID_REAL}}",  // Usar ID real do banco
      "name": "{{PRODUCT_NAME_REAL}}",
      "quantity": 1,
      "unitPrice": {{PRICE_CENTS_REAL}}
    }
  ]
}
```

---

### Opção 3: Verificar Logs do Servidor

**Verificar erro específico:**
```bash
# Ver logs do servidor
tail -f logs/server.log

# Ou verificar console onde servidor está rodando
# Procurar por: "[API] /api/orders POST failed:"
```

**Erros comuns:**
- `MENU_ITEM_NOT_FOUND` - Product ID não existe
- `restaurant_id required` - WEB_MODULE_RESTAURANT_ID não configurado
- Constraint violation - Mesa já tem pedido ativo

---

## 📋 Checklist de Verificação

- [ ] Produto de teste existe no banco
- [ ] Restaurant ID válido configurado (WEB_MODULE_RESTAURANT_ID)
- [ ] Produto está ativo (`is_active = true`)
- [ ] Produto pertence ao restaurante correto
- [ ] Logs do servidor verificados para erro específico

---

## 🧪 Teste Manual

**Testar criação de pedido manualmente:**

```bash
# 1. Autenticar
curl -X POST http://localhost:4320/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@chefiapp.test"}'

# 2. Verificar token (extrair dev_token da resposta)
# 3. Verificar magic link
curl "http://localhost:4320/api/auth/verify-magic-link?token={dev_token}"

# 4. Criar pedido (extrair session_token da resposta)
curl -X POST http://localhost:4320/api/orders \
  -H "Content-Type: application/json" \
  -H "x-chefiapp-token: {session_token}" \
  -d '{
    "items": [
      {
        "productId": "00000000-0000-0000-0000-000000000001",
        "name": "Test Product",
        "quantity": 1,
        "unitPrice": 1000
      }
    ]
  }'
```

---

**Status:** Solução documentada, pronto para aplicar
