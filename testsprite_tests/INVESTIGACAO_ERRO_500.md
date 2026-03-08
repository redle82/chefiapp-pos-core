# 🔍 Investigação: Erro 500 Após Migration Aplicada
**Data:** 2026-01-13  
**Status:** Migration aplicada, mas testes ainda falham

---

## 📊 Situação Atual

- ✅ **Migration aplicada:** Função RPC `create_order_atomic` com 4 parâmetros verificada
- ✅ **Código corrigido:** Assinatura RPC corrigida (4 parâmetros)
- ✅ **Health endpoint:** TC001 passa (20% de sucesso)
- ❌ **TC002-TC005:** Ainda falham com erro 500

---

## 🔍 Possíveis Causas

### 1. Servidor Não Reiniciado (Mais Provável)

**Problema:** O servidor pode não ter carregado as mudanças no código.

**Solução:**
```bash
# Parar servidor atual
# Reiniciar servidor
npm run dev
# ou
node server/web-module-api-server.ts
```

**Verificação:**
- Verificar se o código atualizado está sendo executado
- Verificar logs do servidor ao iniciar

---

### 2. Produto de Teste Não Existe no Banco

**Problema:** O produto `00000000-0000-0000-0000-000000000001` pode não existir.

**Verificação:**
```sql
SELECT id, name, price_cents, restaurant_id, is_active
FROM gm_products
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;
```

**Solução:**
```bash
# Executar script de criação
psql $DATABASE_URL -f scripts/create-test-product.sql
```

---

### 3. Restaurant ID Não Configurado

**Problema:** `WEB_MODULE_RESTAURANT_ID` pode não estar configurado.

**Verificação:**
```bash
echo $WEB_MODULE_RESTAURANT_ID
```

**Solução:**
```bash
# Verificar restaurante existente
psql $DATABASE_URL -c "SELECT id FROM gm_restaurants LIMIT 1;"

# Configurar no .env
echo "WEB_MODULE_RESTAURANT_ID=<restaurant_id>" >> .env
```

---

### 4. Erro Específico na RPC

**Problema:** A RPC pode estar falhando por constraint violation ou outro erro.

**Verificação:**
- **Logs do servidor:** Procurar por `[API] /api/orders POST failed:`
- **Teste manual da RPC:**
  ```sql
  SELECT public.create_order_atomic(
    '{{RESTAURANT_ID}}'::UUID,
    '[{"product_id": "00000000-0000-0000-0000-000000000001", "name": "Test", "quantity": 1, "unit_price": 1000}]'::JSONB,
    'cash',
    NULL::JSONB
  );
  ```

---

## 📋 Checklist de Debugging

- [ ] Servidor foi reiniciado após mudanças no código?
- [ ] Produto de teste existe no banco?
- [ ] Restaurant ID está configurado?
- [ ] Logs do servidor verificados para erro específico?
- [ ] RPC testada manualmente no banco?
- [ ] Migration realmente aplicada (verificar função no banco)?

---

## 🔧 Passos de Debugging

### Passo 1: Verificar Logs do Servidor

**O código agora loga erros detalhadamente:**
```
[API] /api/orders POST failed: <erro específico>
```

**O que procurar:**
- Mensagem de erro específica
- Stack trace (em desenvolvimento)
- Código de erro PostgreSQL (se aplicável)

---

### Passo 2: Testar RPC Manualmente

**No Supabase SQL Editor ou psql:**
```sql
-- 1. Verificar restaurante
SELECT id FROM gm_restaurants LIMIT 1;

-- 2. Verificar produto
SELECT id, name, price_cents 
FROM gm_products 
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- 3. Testar RPC
SELECT public.create_order_atomic(
  (SELECT id FROM gm_restaurants LIMIT 1)::UUID,
  '[{"product_id": "00000000-0000-0000-0000-000000000001", "name": "Test Product", "quantity": 1, "unit_price": 1000}]'::JSONB,
  'cash',
  NULL::JSONB
);
```

**Se a RPC falhar:**
- Ver mensagem de erro específica
- Verificar constraints
- Verificar se produto existe

---

### Passo 3: Testar Endpoint Manualmente

**Com curl:**
```bash
# 1. Autenticar
curl -X POST http://localhost:4320/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@chefiapp.test"}'

# 2. Verificar token (extrair dev_token)
# 3. Verificar magic link
curl "http://localhost:4320/api/auth/verify-magic-link?token={dev_token}"

# 4. Criar pedido (extrair session_token)
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

**Verificar:**
- Status code da resposta
- Mensagem de erro (se houver)
- Logs do servidor

---

## 🎯 Próximos Passos

1. **Verificar logs do servidor** (prioridade máxima)
2. **Reiniciar servidor** (se não foi reiniciado)
3. **Verificar produto de teste** no banco
4. **Testar RPC manualmente** no banco
5. **Testar endpoint manualmente** com curl

---

**Status:** Investigação em andamento - Precisa verificar logs do servidor
