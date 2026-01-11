# 🔍 Diagnóstico Arquitetural: Autenticação

**Data**: 2025-01-27  
**Status**: ⚠️ **DUPLICAÇÃO IDENTIFICADA**

---

## 🎯 Resumo Executivo

**Problema confirmado**: Existem DOIS sistemas de autenticação rodando em paralelo, criando confusão arquitetural e risco de bugs.

---

## 📊 Situação Atual

### ✅ Sistema CORRETO (Supabase Auth)

**Localização**: `RequireAuth.tsx`, `AuthPage.tsx`

**Como funciona**:
```typescript
// Fonte única de verdade
supabase.auth.getSession()
supabase.auth.onAuthStateChange()
supabase.auth.signInWithOAuth()
```

**Características**:
- ✅ Única fonte de verdade
- ✅ Integrado com RLS (Row Level Security)
- ✅ Gerencia tokens automaticamente
- ✅ Suporta Google, Facebook, Email
- ✅ Renovação automática de sessão

**Onde é usado**:
- `RequireAuth` - Guarda de rotas protegidas
- `AuthPage` - Login com Google/Email
- `BootstrapPage` - Verificação de sessão após OAuth

---

### ❌ Sistema LEGACY (useAuthStateMachine)

**Localização**: `core/auth/useAuthStateMachine.ts`, `core/auth/AuthBoundary.tsx`

**Como funciona**:
```typescript
// Sistema paralelo
localStorage.getItem('x-chefiapp-token')
setState('AUTHED')
login(newToken) // Manual
```

**Características**:
- ❌ Token customizado em localStorage
- ❌ Validação manual (apenas formato)
- ❌ Não integrado com Supabase
- ❌ Não sincroniza com RLS
- ❌ Pode criar conflito de sessão

**Onde é usado**:
- `AuthBoundary` - Componente de proteção (mas não encontrado em uso ativo)
- Vários lugares que leem `x-chefiapp-token` do localStorage

---

## 🚨 Problemas Identificados

### 1. **Conflito de Sessão**

**Cenário**:
```
Usuário faz login via Supabase (Google OAuth)
  ↓
Supabase cria sessão válida
  ↓
App tenta ler `x-chefiapp-token` do localStorage
  ↓
Token não existe → App pensa que usuário não está logado
  ↓
Redireciona para login (mas já está logado!)
```

### 2. **Duplicação de Estado**

Dois sistemas mantendo estado separado:
- Supabase: `session` (JWT, refresh token)
- Legacy: `x-chefiapp-token` (string customizada)

### 3. **Inconsistência de Proteção**

Algumas rotas usam `RequireAuth` (Supabase) ✅  
Outras podem usar `AuthBoundary` (Legacy) ❌

### 4. **Tokens Espalhados**

Encontrados múltiplos lugares lendo/escrevendo tokens:
- `x-chefiapp-token` (useAuthStateMachine)
- `chefiapp_session_token` (CreatingPage)
- `chefiapp_internal_token` (SetupLayout)

---

## 🎯 Arquitetura Correta (Objetivo)

### Princípio Único

> **"Supabase Auth é a única fonte de verdade de identidade"**

### Fluxo Correto

```
Usuário
  ↓
Login via Supabase (Google/Email)
  ↓
Supabase cria sessão (JWT)
  ↓
App apenas:
  - lê sessão: supabase.auth.getSession()
  - escuta mudanças: supabase.auth.onAuthStateChange()
  - mostra UI conforme estado
```

### O que o App NÃO deve fazer

❌ Guardar token manualmente  
❌ Criar "login local"  
❌ Validar token manualmente  
❌ Criar estado de autenticação próprio  
❌ Duplicar lógica de sessão

---

## 📋 Plano de Unificação

### Fase 1: Diagnóstico Completo ✅

- [x] Identificar todos os usos de `useAuthStateMachine`
- [x] Identificar todos os usos de `AuthBoundary`
- [x] Mapear todos os lugares que leem/escrevem tokens customizados
- [x] Documentar conflitos

### Fase 2: Remoção Gradual

1. **Identificar dependências**
   - Onde `AuthBoundary` é usado?
   - Onde `useAuthStateMachine` é usado?
   - Quais rotas dependem de tokens customizados?

2. **Substituir por Supabase**
   - Trocar `AuthBoundary` → `RequireAuth`
   - Remover `useAuthStateMachine` onde não necessário
   - Migrar leituras de token para `supabase.auth.getSession()`

3. **Limpar localStorage**
   - Remover `x-chefiapp-token`
   - Remover `chefiapp_session_token`
   - Remover `chefiapp_internal_token`
   - Manter apenas `chefiapp_demo_mode` (se necessário)

### Fase 3: Validação

- [ ] Testar login Google → Dashboard
- [ ] Testar logout → Login
- [ ] Testar refresh de sessão
- [ ] Testar modo demo (se aplicável)
- [ ] Verificar RLS funcionando

---

## 🔧 Ações Imediatas

### 1. Criar Hook Unificado

```typescript
// core/auth/useSupabaseAuth.ts
export function useSupabaseAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading, user: session?.user }
}
```

### 2. Deprecar useAuthStateMachine

Adicionar aviso claro:
```typescript
// @deprecated Use useSupabaseAuth instead
// This will be removed in next version
export function useAuthStateMachine() { ... }
```

### 3. Unificar Guards

Todas as rotas devem usar `RequireAuth` (baseado em Supabase).

---

## 📌 Notas Técnicas

### Por que isso aconteceu?

Provavelmente:
1. Sistema legacy criado antes da integração Supabase
2. Migração incompleta
3. Falta de documentação clara sobre "única fonte de verdade"

### Impacto

**Alto risco**:
- Bugs de sessão
- Usuários sendo deslogados incorretamente
- Conflitos entre sistemas

**Baixa complexidade de correção**:
- Código já existe (Supabase Auth)
- Apenas remover duplicação
- Testes diretos

---

## ✅ Veredito Final

**Status**: ⚠️ **ARQUITETURA DUPLICADA - REQUER CORREÇÃO**

**Recomendação**: Unificar para Supabase Auth como única fonte de verdade.

**Prioridade**: 🔴 **ALTA** (afeta experiência do usuário e segurança)

---

**Próximo passo**: Executar Fase 2 (Remoção Gradual)

