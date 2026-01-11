# 🔧 Plano de Unificação: Autenticação

**Objetivo**: Remover sistema legacy e consolidar em Supabase Auth como única fonte de verdade.

---

## ✅ Boa Notícia

**Status atual**: O sistema legacy (`useAuthStateMachine` + `AuthBoundary`) **NÃO está sendo usado** nas rotas principais.

**Evidência**:
- `App.tsx` usa apenas `RequireAuth` (Supabase) ✅
- `AuthBoundary` não aparece em nenhuma rota ativa
- Rotas protegidas já estão usando Supabase corretamente

**Conclusão**: A arquitetura principal está correta. O problema é código morto que pode confundir.

---

## 🧹 Limpeza Necessária

### 1. Código Morto (Remover)

**Arquivos para deprecar/remover**:
- `core/auth/useAuthStateMachine.ts` - Sistema legacy não usado
- `core/auth/AuthBoundary.tsx` - Componente não usado

**Ação**: Marcar como `@deprecated` e remover em próxima versão.

---

### 2. Tokens Customizados (Limpar)

**Locais que ainda escrevem tokens customizados**:

#### a) `Scene6Summary.tsx`
```typescript
localStorage.setItem('x-chefiapp-token', output.contract.session.token);
```
**Ação**: Remover ou substituir por verificação de sessão Supabase.

#### b) `CreatingPage.tsx`
```typescript
localStorage.setItem('chefiapp_session_token', data.session_token || '')
```
**Ação**: Remover. Sessão já é gerenciada pelo Supabase.

#### c) `SetupLayout.tsx`
```typescript
internalToken: localStorage.getItem('chefiapp_internal_token') || 'dev-token',
```
**Ação**: Verificar se ainda é necessário. Se sim, usar `supabase.auth.getSession()`.

#### d) `useOfflineReconciler.ts`
```typescript
'x-chefiapp-token': localStorage.getItem('x-chefiapp-token') || ''
```
**Ação**: Substituir por token do Supabase: `session?.access_token`.

#### e) `PublishPage.tsx`
```typescript
'x-chefiapp-token': localStorage.getItem('x-chefiapp-token') || ''
```
**Ação**: Substituir por token do Supabase.

---

### 3. Hook Unificado (Criar)

**Novo arquivo**: `core/auth/useSupabaseAuth.ts`

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Session, User } from '@supabase/supabase-js'

export interface SupabaseAuthState {
  session: Session | null
  user: User | null
  loading: boolean
  error: Error | null
}

/**
 * Hook unificado para autenticação Supabase.
 * 
 * Esta é a ÚNICA fonte de verdade para estado de autenticação.
 * 
 * @example
 * ```tsx
 * const { session, user, loading } = useSupabaseAuth()
 * 
 * if (loading) return <Loading />
 * if (!session) return <Navigate to="/login" />
 * 
 * return <Dashboard user={user} />
 * ```
 */
export function useSupabaseAuth(): SupabaseAuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error)
        setLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setError(null)

        // Log events for debugging
        if (event === 'SIGNED_IN') {
          console.log('[Auth] User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading, error }
}
```

---

### 4. Migração de RequireAuth (Opcional)

**Atual**: `RequireAuth.tsx` tem lógica inline.

**Melhor**: Usar `useSupabaseAuth`:

```typescript
import { Navigate } from 'react-router-dom'
import { useSupabaseAuth } from '../core/auth/useSupabaseAuth'
import { Skeleton } from '../ui/design-system'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useSupabaseAuth()

  // Demo mode check (se ainda necessário)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('demo') === 'true') {
      localStorage.setItem('chefiapp_demo_mode', 'true')
    }
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Skeleton variant="rectangular" height={20} width={150} />
      </div>
    )
  }

  const isDemo = localStorage.getItem('chefiapp_demo_mode') === 'true'

  if (!session && !isDemo) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

---

## 📋 Checklist de Execução

### Fase 1: Preparação ✅
- [x] Documentar diagnóstico
- [x] Identificar código morto
- [x] Mapear tokens customizados

### Fase 2: Implementação
- [ ] Criar `useSupabaseAuth` hook
- [ ] Atualizar `RequireAuth` para usar hook
- [ ] Substituir leituras de `x-chefiapp-token` por `session?.access_token`
- [ ] Remover escritas de tokens customizados

### Fase 3: Limpeza
- [ ] Marcar `useAuthStateMachine` como `@deprecated`
- [ ] Marcar `AuthBoundary` como `@deprecated`
- [ ] Adicionar avisos de console em código legacy
- [ ] Criar issue para remoção completa na próxima versão

### Fase 4: Validação
- [ ] Testar login Google → Dashboard
- [ ] Testar logout → Login
- [ ] Testar refresh automático de sessão
- [ ] Verificar que RLS funciona corretamente
- [ ] Testar modo demo (se aplicável)

---

## 🎯 Resultado Esperado

### Antes
```
2 sistemas de auth
├── Supabase Auth (ativo) ✅
└── useAuthStateMachine (morto) ❌
```

### Depois
```
1 sistema de auth
└── Supabase Auth (única fonte de verdade) ✅
```

---

## 📌 Notas Importantes

### Tokens para Requisições HTTP

**Problema**: Alguns lugares precisam do token para fazer requisições HTTP.

**Solução**: Usar `session?.access_token` do Supabase:

```typescript
const { session } = useSupabaseAuth()

// Em requisições
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
})
```

### Modo Demo

**Status**: Ainda usa `localStorage.getItem('chefiapp_demo_mode')`.

**Decisão**: Manter por enquanto, mas considerar migrar para feature flag no Supabase.

---

## 🚀 Próximos Passos

1. **Criar hook unificado** (`useSupabaseAuth`)
2. **Migrar RequireAuth** para usar hook
3. **Substituir tokens customizados** por `session?.access_token`
4. **Deprecar código legacy**
5. **Testar fluxo completo**

---

**Prioridade**: 🟡 **MÉDIA** (código morto, mas não quebrado)  
**Complexidade**: 🟢 **BAIXA** (substituição direta)  
**Risco**: 🟢 **BAIXO** (sistema principal já está correto)

