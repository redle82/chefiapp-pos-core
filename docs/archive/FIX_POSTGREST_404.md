**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# Fix: PostgREST retornando 404 para todas as tabelas

**Data:** 2026-01-25
**Status:** 🔴 Em investigação

---

## 🔴 Problema

PostgREST está retornando `404 Not Found` para todas as tabelas, mesmo que:
- ✅ Tabelas existem no banco (`gm_products`, `gm_restaurants`, etc.)
- ✅ PostgREST está rodando e conectado
- ✅ Permissões foram concedidas

**Erro:**
```
GET http://localhost:3001/rest/v1/gm_products → 404 Not Found
GET http://localhost:3001/rest/v1/gm_restaurants → 404 Not Found
```

---

## 🔍 Diagnóstico

### Verificações Realizadas

1. **Tabelas existem no banco:**
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'gm_%';
   -- Resultado: gm_products, gm_restaurants, gm_orders, etc.
   ```

2. **Permissões concedidas:**
   ```sql
   GRANT USAGE ON SCHEMA public TO postgres;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres;
   ```

3. **PostgREST está rodando:**
   ```
   Connection successful
   Listening on port 3000
   Schema cache loaded
   ```

4. **Configuração do PostgREST:**
   ```yaml
   PGRST_DB_URI: postgres://postgres:postgres@postgres:5432/chefiapp_core
   PGRST_DB_SCHEMA: public
   PGRST_DB_ANON_ROLE: postgres
   ```

---

## 🔧 Possíveis Causas

1. **Schema não está sendo exposto corretamente**
   - PostgREST pode precisar de `PGRST_DB_SCHEMAS: public` explicitamente

2. **Cache do schema não atualizado**
   - PostgREST pode ter cacheado schema vazio antes das tabelas serem criadas

3. **Problema com a URL**
   - PostgREST pode estar esperando `/rest/v1/` mas retornando 404

4. **Problema com permissões do role `postgres`**
   - Mesmo sendo o owner, pode haver algum problema de permissão

---

## ✅ Soluções Tentadas

1. ✅ Conceder permissões explícitas
2. ✅ Reiniciar PostgREST
3. ✅ Verificar logs (sem erros)
4. ✅ Testar com diferentes tabelas (todas retornam 404)

---

## 🔄 Próximos Passos

1. Verificar se PostgREST precisa de `PGRST_DB_SCHEMAS: public` explicitamente
2. Verificar se há algum problema com a versão do PostgREST
3. Verificar se o schema `public` está sendo reconhecido corretamente
4. Testar com uma query SQL direta via PostgREST (se suportado)

---

**Última atualização:** 2026-01-25
