# Debug: OAuth Callback não redireciona

## Como testar:

1. **Abrir Console do Navegador** (F12 → Console)
2. **Fazer login com Google**
3. **Observar os logs**

## O que procurar:

```
[Bootstrap] Starting authentication check...
[Bootstrap] Session check result: { hasSession: true/false, error: ... }
```

Se você ver:
- ✅ `hasSession: true` → Sessão OK, verificar membership
- ❌ `hasSession: false` → OAuth não completou

Se hasSession=true:
```
[Bootstrap] Checking membership for user: [user-id]
[Bootstrap] Membership query result: { members: [...], error: ... }
```

Se members existe:
```
[Bootstrap] Existing member found: { restaurant_id, role }
→ Deve redirecionar para /dashboard ou /onboarding/quick
```

Se members NÃO existe (novo usuário):
```
[Bootstrap] New user detected - creating first restaurant
[Bootstrap] Restaurant created successfully, redirecting to onboarding
→ Deve redirecionar para /onboarding/quick
```

## Possíveis problemas:

### 1. OAuth não completa (hasSession=false)
**Causa:** Supabase OAuth mal configurado
**Solução:** Verificar redirect URL no Supabase dashboard

### 2. Session existe mas sem redirect
**Causa:** Código do BootstrapPage não executa navigate()
**Solução:** Verificar se os console.logs aparecem

### 3. Erro de permissão RLS
**Causa:** restaurant_members ou gm_restaurants sem permissão
**Solução:** Ver erro no console

## URL do callback esperada:

```
http://localhost:5173/bootstrap#access_token=...&token_type=bearer&...
```

Se não receber essa URL após login Google → problema no Supabase OAuth config.
