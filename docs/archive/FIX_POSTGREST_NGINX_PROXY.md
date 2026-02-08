**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# Fix: PostgREST com Nginx Proxy para /rest/v1/

**Data:** 2026-01-25
**Status:** ✅ Implementado

---

## 🎯 Problema

O PostgREST serve diretamente na raiz (`/`), mas o cliente Supabase automaticamente adiciona `/rest/v1/` a todas as requisições. Isso causava:

- ✅ `/gm_products` funcionava
- ❌ `/rest/v1/gm_products` retornava 404
- ❌ `dockerCoreClient.rpc()` e `supabase.rpc()` falhavam com 404/401

---

## ✅ Solução

### Nginx Proxy Reverso

Adicionado um proxy reverso Nginx que mapeia `/rest/v1/*` para `/*` no PostgREST.

**Arquivos criados/modificados:**

1. **`docker-core/nginx.conf`** (novo)
   - Configuração do Nginx para fazer proxy de `/rest/v1/` para `/`
   - Mantém compatibilidade com URLs diretas (sem `/rest/v1/`)

2. **`docker-core/docker-compose.core.yml`** (modificado)
   - Adicionado serviço `nginx` na porta 3001
   - PostgREST agora expõe apenas internamente (porta 3000)
   - Nginx faz proxy de 3001 para postgrest:3000

3. **Código atualizado para usar `/rest/v1/`**
   - `TPVMinimal.tsx`: Usa `/rest/v1/gm_products`
   - `OrderWriter.ts`: Usa `/rest/v1/rpc/create_order_atomic`

---

## 🔧 Configuração

### Nginx Config (`nginx.conf`)

```nginx
location /rest/v1/ {
    rewrite ^/rest/v1/(.*) /$1 break;
    proxy_pass http://postgrest;
    # Headers necessários
}
```

### Docker Compose

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "3001:3001"  # Porta pública
  depends_on:
    - postgrest

postgrest:
  expose:
    - "3000"  # Apenas interno
```

---

## ✅ Validação

```bash
# Testar produtos via /rest/v1/
curl "http://localhost:3001/rest/v1/gm_products?select=id,name&limit=1" \
  -H "apikey: chefiapp-core-secret-key-min-32-chars-long"

# Testar RPC via /rest/v1/
curl "http://localhost:3001/rest/v1/rpc/create_order_atomic" \
  -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
  -X POST -H "Content-Type: application/json" \
  -d '{"p_restaurant_id":"...","p_items":[...]}'
```

---

## 📊 URLs Suportadas

Agora ambas as formas funcionam:

- ✅ `http://localhost:3001/rest/v1/gm_products` (via proxy)
- ✅ `http://localhost:3001/gm_products` (via proxy direto)
- ✅ `http://localhost:3001/rest/v1/rpc/create_order_atomic` (via proxy)
- ✅ `dockerCoreClient.rpc()` funciona (usa `/rest/v1/` automaticamente)

---

## 🎯 Benefícios

1. **Compatibilidade total com Supabase client**
   - `dockerCoreClient.rpc()` funciona
   - `dockerCoreClient.from()` funciona
   - Sem necessidade de mudar código existente

2. **Flexibilidade**
   - URLs diretas ainda funcionam
   - URLs com `/rest/v1/` também funcionam

3. **Simplicidade**
   - Nginx faz o trabalho pesado
   - PostgREST não precisa ser modificado

---

**Última atualização:** 2026-01-25
