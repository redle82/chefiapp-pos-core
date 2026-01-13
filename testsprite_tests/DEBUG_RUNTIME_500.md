# 🔍 Debug: Erro 500 em Runtime
**Data:** 2026-01-13  
**Status:** Health OK, Orders 500 - Problema de Runtime

---

## 🎯 Diagnóstico Cirúrgico

**Situação:**
- ✅ Health endpoint: PASSA
- ❌ Orders endpoint: 500
- ✅ Migration: Aplicada
- ✅ Código: Corrigido
- ✅ Contrato: Respeitado

**Conclusão:** Não é schema, não é TestSprite, não é migration. **É runtime + contexto de execução.**

---

## 🔥 Hipótese Mais Forte (90%)

### Servidor NÃO foi reiniciado

**Problema:**
- Servidor rodando código antigo (antes das correções)
- Health funciona porque código antigo também tinha
- Orders falha porque assinatura RPC nova não bate com código antigo

**Solução:**

```bash
# 1. Parar TUDO
# Ctrl + C no terminal onde servidor está rodando

# 2. Verificar se porta está livre
lsof -i :4320
# Se houver processo, matar: kill -9 <PID>

# 3. Subir novamente, limpo
npm run dev

# 4. Aguardar logs de startup
# Procurar por:
# - build completo
# - carregamento das routes
# - mensagens novas ([API] /api/orders POST failed:)
```

---

## ✅ Ação Obrigatória (Nessa Ordem)

### 1️⃣ Parar TUDO

```bash
# Encerrar qualquer processo na porta 4320
lsof -i :4320
# Se houver processo:
kill -9 <PID>

# Verificar novamente
lsof -i :4320
# Deve retornar vazio
```

---

### 2️⃣ Subir Novamente, Limpo

```bash
npm run dev
```

**Aguardar logs de startup:**
- Build completo
- Carregamento das routes
- Mensagens novas que você adicionou

---

### 3️⃣ Teste MANUALMENTE (Chave)

**Antes do TestSprite, execute:**

```bash
./scripts/test-order-creation-manual.sh
```

**Ou manualmente:**

```bash
# 1. Autenticar
curl -X POST http://localhost:4320/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@chefiapp.test"}'

# 2. Extrair dev_token da resposta
# 3. Verificar magic link
curl "http://localhost:4320/api/auth/verify-magic-link?token={dev_token}"

# 4. Extrair session_token da resposta
# 5. Criar pedido
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

**Se der 500, o erro aparecerá claramente no log do servidor.**

---

## 🔍 O Que Procurar no Log (Importante)

**Procure algo como:**

```
[API] /api/orders POST failed: <erro específico>
```

**Erros comuns:**
- `Cannot read property 'xxx' of undefined`
- `RPC create_order_atomic not found`
- `function public.create_order_atomic(unknown, jsonb, unknown) does not exist`
- `restaurantId is undefined`
- `WEB_MODULE_RESTAURANT_ID is not defined`
- `product_id does not exist`
- `constraint violation`

**💡 Qualquer dessas mensagens resolve o mistério em 5 minutos.**

---

## 🧨 Segunda Hipótese (Caso Reinício Não Resolva)

### WEB_MODULE_RESTAURANT_ID não resolvido em runtime

**Problema:**
Mesmo com produto criado, se `WEB_MODULE_RESTAURANT_ID` estiver undefined:

```typescript
const restaurantId = process.env.WEB_MODULE_RESTAURANT_ID;
// Se undefined → OrderEngine explode silenciosamente → 500
```

**Verificação:**

```bash
echo $WEB_MODULE_RESTAURANT_ID
```

**Ou logue no startup:**

```typescript
console.log('[BOOT] RESTAURANT_ID:', process.env.WEB_MODULE_RESTAURANT_ID);
```

**Solução:**

```bash
# Verificar restaurante existente
psql $DATABASE_URL -c "SELECT id FROM gm_restaurants LIMIT 1;"

# Configurar no .env
echo "WEB_MODULE_RESTAURANT_ID=<restaurant_id>" >> .env

# Reiniciar servidor
npm run dev
```

---

## 🧠 Terceira Hipótese (Mais Rara)

### RPC com assinatura diferente da migration aplicada

**Problema:**
- Migration alterou parâmetros
- Código chama versão antiga
- Supabase retorna erro
- API traduz como 500

**O log mostrará algo como:**

```
function public.create_order_atomic(uuid, jsonb, text) does not exist
```

**Solução:**
- Verificar assinatura da função no banco
- Ajustar chamada no código ou reaplicar migration

---

## 📋 Checklist de Debugging

- [ ] Servidor foi reiniciado após mudanças no código?
- [ ] Porta 4320 está livre (nenhum processo antigo)?
- [ ] Logs de startup mostram código novo?
- [ ] `WEB_MODULE_RESTAURANT_ID` está configurado?
- [ ] Teste manual executado?
- [ ] Logs do servidor verificados para erro específico?
- [ ] RPC testada manualmente no banco?

---

## 🎯 Próximo Comando (Decisivo)

**Cole aqui o log exato do servidor após o POST /api/orders**
(3–10 linhas já bastam)

**Com isso, eu te digo:**
- A causa exata
- O patch exato
- E se isso fecha o TestSprite definitivamente

---

## 📊 Resumo Executivo

| Situação | Leitura Correta |
|----------|----------------|
| Health OK | Backend ativo |
| Orders 500 | Runtime bug |
| Migration OK | DB consistente |
| Produto existe | Domínio coerente |
| TestSprite falha | Correto (sistema se defendendo) |

**👉 Agora só falta ler o log certo.**

---

**Status:** Aguardando log do servidor para diagnóstico final
