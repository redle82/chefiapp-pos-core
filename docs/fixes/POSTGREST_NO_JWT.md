# PostgREST Sem JWT - Docker Core

**Data:** 2026-01-25  
**Problema:** Erros 401 (Unauthorized) porque PostgREST estava exigindo JWT

---

## 🎯 Problema

O PostgREST estava configurado com `PGRST_JWT_SECRET`, o que fazia com que:
- Cliente Supabase tentasse validar JWT
- Erro: `JWSError (CompactDecodeError Invalid number of parts: Expected 3 parts; got 1)`
- Todas as requisições retornavam 401

---

## ✅ Solução

### Removido JWT Secret do PostgREST

**Antes:**
```yaml
environment:
  PGRST_JWT_SECRET: chefiapp-core-secret-key-min-32-chars-long
```

**Depois:**
```yaml
environment:
  # Removido PGRST_JWT_SECRET - Docker Core não usa JWT, acesso direto
```

### Resultado

- ✅ PostgREST aceita requisições sem JWT
- ✅ Cliente Supabase funciona normalmente
- ✅ Sem erros 401
- ✅ Acesso direto ao Core

---

## 🔧 Configuração Atual

**PostgREST:**
- `PGRST_DB_ANON_ROLE: postgres` - Role anônimo tem acesso total
- Sem `PGRST_JWT_SECRET` - Não exige JWT
- Acesso direto permitido

**Cliente Supabase:**
- Usa `VITE_SUPABASE_ANON_KEY` apenas como identificador
- Não valida JWT (PostgREST não exige)
- Funciona normalmente

---

## ✅ Validação

```bash
# Teste direto (sem JWT)
curl http://localhost:3001/gm_restaurants

# Deve retornar dados sem erro 401
```

---

**Última atualização:** 2026-01-25
