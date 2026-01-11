# ⚡ Fix Rápido: Bootstrap

**Status**: 🔴 **APLICAR AGORA**

> **Nota**: Para ação direta imediata, veja `docs/BOOTSTRAP_FIX_NOW.md`

---

## 🎯 Script de Diagnóstico (Execute Primeiro)

**Na tela `/app/bootstrap`, no console do navegador:**

```javascript
// Script único consolidado
(async () => {
  // 1. Verificar sessão
  const { data: { session } } = await supabase.auth.getSession()
  console.log('✅ Sessão:', session ? 'VÁLIDA' : '❌ INVÁLIDA')
  console.log('👤 User ID:', session?.user?.id)
  
  if (!session) {
    console.error('❌ Sem sessão!')
    return
  }
  
  // 2. Testar SELECT em restaurant_members (PONTO CRÍTICO)
  const { data, error } = await supabase
    .from('restaurant_members')
    .select('*')
    .eq('user_id', session.user.id)
  
  console.log('🔍 Membership Data:', data)
  console.log('❌ Membership Error:', error)
  
  // Se der erro, copie exatamente o erro acima
})()
```

---

## 🔧 Fix A (Mais Provável - 99%)

**Opção 1: Aplicar Migration (Recomendado)**

Execute a migration completa:
```bash
# No diretório do projeto
supabase migration up
```

Ou execute o SQL diretamente no Supabase SQL Editor:
- Arquivo: `supabase/migrations/068_bootstrap_rls_fix.sql`

**Opção 2: Fix Manual Rápido**

Se o script acima der erro de permissão, execute no SQL Editor do Supabase:

```sql
-- 1. Habilitar RLS (se não estiver)
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- 2. Criar política de SELECT
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.restaurant_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.restaurant_members;

CREATE POLICY "Users can read own memberships"
ON public.restaurant_members
FOR SELECT
USING (user_id = auth.uid());
```

**Depois**: Recarregue `/app/bootstrap`

---

## 🔧 Fix B (Se Fix A não resolver)

**Teste INSERT manual:**

```javascript
(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const { data, error } = await supabase
    .from('gm_restaurants')
    .insert({
      name: 'Debug Restaurante',
      slug: `debug-${Date.now()}`,
      owner_id: session.user.id,
      status: 'active',
      country: 'ES',
      plan: 'trial',
      type: 'Restaurante'
    })
    .select()
    .single()
  
  console.log('🏢 Insert Data:', data)
  console.log('❌ Insert Error:', error)
})()
```

**Se der erro, execute no SQL Editor:**

```sql
-- Habilitar RLS
ALTER TABLE gm_restaurants ENABLE ROW LEVEL SECURITY;

-- Criar política de INSERT
DROP POLICY IF EXISTS "Users can create own restaurant" ON gm_restaurants;

CREATE POLICY "Users can create own restaurant"
ON gm_restaurants
FOR INSERT
WITH CHECK (owner_id = auth.uid());
```

---

## 📋 Checklist Rápido

- [ ] Execute script de diagnóstico
- [ ] Copie erro exato (se houver)
- [ ] Aplique Fix A (SQL acima)
- [ ] Recarregue `/app/bootstrap`
- [ ] Se ainda falhar → Execute Fix B

---

## 🎯 Resultado Esperado

Após aplicar Fix A:
- ✅ Bootstrap completa
- ✅ Redireciona para dashboard ou setup
- ✅ Tela "A verificar sistema" desaparece

---

**Status**: 🟡 **AGUARDANDO APLICAÇÃO DO FIX**

