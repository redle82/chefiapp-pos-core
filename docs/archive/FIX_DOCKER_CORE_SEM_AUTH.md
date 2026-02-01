**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# 🔧 FIX: Docker Core Sem Autenticação

**Data:** 27/01/2026  
**Problema:** `AuthSessionMissingError` ao tentar criar restaurante no Docker Core

---

## 🔍 PROBLEMA IDENTIFICADO

O Docker Core **não usa autenticação JWT**. Ele está configurado com:
- `PGRST_DB_ANON_ROLE: postgres` - Role anônimo tem acesso total
- Sem RLS (Row Level Security) ativo
- `owner_id` em `gm_restaurants` é opcional (pode ser NULL)

Mas o código estava tentando usar `supabase.auth.getUser()`, que requer autenticação.

---

## ✅ SOLUÇÃO IMPLEMENTADA

Agora o código detecta se está usando Docker Core e:
1. **Docker Core** (`localhost:3001`):
   - Cria restaurante **sem autenticação**
   - `owner_id` pode ser `NULL`
   - Funciona imediatamente

2. **Supabase Cloud**:
   - Requer autenticação
   - Redireciona para `/bootstrap` se não autenticado

---

## 🧪 COMO TESTAR

1. **Certifique-se que Docker Core está rodando:**
   ```bash
   cd docker-core
   docker compose -f docker-compose.core.yml ps
   ```

2. **Acesse `/onboarding` diretamente**

3. **Preencha a seção Identity:**
   - Nome: "Sofia Gastrobar"
   - Tipo: Restaurante
   - País: Brasil
   - Fuso: America/Sao_Paulo
   - Moeda: BRL
   - Idioma: pt-BR

4. **Observe o console:**
   - Deve aparecer: `[IdentitySection] Docker Core detectado. Criando restaurante sem autenticação...`
   - Depois: `[IdentitySection] ✅ Restaurante criado: [id]`
   - Depois: `[IdentitySection] ✅ Identidade salva no banco`

---

## 📋 DETALHES TÉCNICOS

### Docker Core Configuration
```yaml
PGRST_DB_ANON_ROLE: postgres  # Acesso total sem autenticação
# Sem RLS policies
# owner_id pode ser NULL
```

### Código Ajustado
```typescript
const isDockerCore = CONFIG.SUPABASE_URL.includes('localhost:3001');
if (isDockerCore && !userId) {
  // Criar sem owner_id (NULL permitido)
  userId = null;
}
```

---

**Status:** ✅ **IMPLEMENTADO - FUNCIONA SEM AUTENTICAÇÃO NO DOCKER CORE**
