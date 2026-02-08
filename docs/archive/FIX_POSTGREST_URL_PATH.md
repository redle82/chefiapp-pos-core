**Status:** ARCHIVED  
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)  
**Arquivado em:** 2026-01-28

---

# Fix: PostgREST URL Path - Remover /rest/v1/

**Data:** 2026-01-25
**Status:** ✅ Corrigido

---

## 🔴 Problema

PostgREST estava retornando `404 Not Found` para requisições em `/rest/v1/gm_products`, mas funcionava quando acessado diretamente em `/gm_products`.

**Erro:**
```
GET http://localhost:3001/rest/v1/gm_products → 404 Not Found
GET http://localhost:3001/gm_products → 200 OK (funciona!)
```

---

## ✅ Solução

### PostgREST está servindo na raiz, não em /rest/v1/

O PostgREST do Docker Core está configurado para servir diretamente na raiz (`/`), não no prefixo padrão `/rest/v1/`.

**Mudanças realizadas:**

1. **TPVMinimal.tsx:**
   ```typescript
   // ANTES
   const url = `${DOCKER_CORE_URL}/rest/v1/gm_products?...`;

   // DEPOIS
   const url = `${DOCKER_CORE_URL}/gm_products?...`;
   ```

2. **OrderWriter.ts:**
   - Já estava usando `/rpc/create_order_atomic` (sem `/rest/v1/`)
   - Adicionado comentário explicativo

---

## 🔧 Configuração do PostgREST

O PostgREST está configurado sem `PGRST_ROOT_SPEC` ou `PGRST_OPENAPI_SERVER_PROXY_URI`, então serve diretamente na raiz.

**URLs corretas:**
- ✅ `http://localhost:3001/gm_products`
- ✅ `http://localhost:3001/gm_orders`
- ✅ `http://localhost:3001/rpc/create_order_atomic`
- ❌ `http://localhost:3001/rest/v1/gm_products` (não funciona)

---

## ✅ Validação

```bash
# Testar produtos
curl "http://localhost:3001/gm_products?select=id,name&limit=1" \
  -H "apikey: chefiapp-core-secret-key-min-32-chars-long"

# Deve retornar: [{"id":"...","name":"..."}]
```

---

## 📝 Notas

- O PostgREST pode ser configurado para usar `/rest/v1/` com `PGRST_ROOT_SPEC`, mas por padrão serve na raiz
- O Docker Core está usando a configuração padrão (raiz)
- Todos os acessos devem usar URLs sem `/rest/v1/`

---

**Última atualização:** 2026-01-25
