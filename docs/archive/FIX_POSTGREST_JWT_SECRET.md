**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# Fix: PostgREST "Server lacks JWT secret"

**Data:** 2026-01-25
**Status:** ✅ Corrigido

---

## 🔴 Problema

PostgREST estava retornando erro `500 (Internal Server Error)` com mensagem:
```
Server lacks JWT secret
```

**Erro completo:**
```
GET http://localhost:3001/rest/v1/gm_products → 500
POST http://localhost:3001/rest/v1/rpc/create_order_atomic → 500
```

**Código de erro:** `PGRST300`

---

## ✅ Solução

### Adicionado PGRST_JWT_SECRET na Configuração

**Arquivo:** `docker-core/docker-compose.core.yml`

**Mudança:**
```yaml
# ANTES (removido)
# Removido PGRST_JWT_SECRET - Docker Core não usa JWT, acesso direto

# DEPOIS (adicionado)
PGRST_JWT_SECRET: chefiapp-core-secret-key-min-32-chars-long
```

### Por que é necessário?

O PostgREST **requer** a variável `PGRST_JWT_SECRET` mesmo quando não está usando JWT para autenticação. O secret é usado internamente pelo PostgREST para:

1. Processar requisições (mesmo sem validação de token)
2. Gerar respostas JSON
3. Funcionamento interno do servidor

**Importante:** Ter o JWT secret configurado **não significa** que o PostgREST está validando tokens. O Docker Core continua funcionando sem autenticação JWT, mas o PostgREST precisa do secret para funcionar internamente.

---

## 🔧 Configuração Final

```yaml
postgrest:
  environment:
    PGRST_DB_URI: postgres://postgres:postgres@postgres:5432/chefiapp_core
    PGRST_DB_SCHEMA: public
    PGRST_DB_SCHEMAS: public
    PGRST_DB_ANON_ROLE: postgres
    PGRST_JWT_SECRET: chefiapp-core-secret-key-min-32-chars-long  # ✅ Adicionado
    PGRST_DB_USE_LEGACY_GUCS: "false"
```

---

## ✅ Validação

Após adicionar o JWT secret e reiniciar o PostgREST:

```bash
# Testar acesso a produtos
curl "http://localhost:3001/rest/v1/gm_products?select=id,name&limit=1" \
  -H "apikey: chefiapp-core-secret-key-min-32-chars-long"

# Deve retornar dados JSON, não erro 500
```

---

## 📝 Notas

- O JWT secret é usado apenas internamente pelo PostgREST
- Não há validação de tokens JWT (Docker Core não usa autenticação)
- O `apikey` header ainda é necessário, mas não é validado como JWT
- Em produção, usar um secret mais seguro (gerado com `openssl rand -hex 32`)

---

**Última atualização:** 2026-01-25
