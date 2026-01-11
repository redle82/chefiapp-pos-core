# ⚡ Fix Bootstrap - Ação Direta

**Status**: 🔴 **EXECUTAR AGORA**

---

## ✅ Autenticação: 100% RESOLVIDA ✅

**Caso encerrado. Não voltar mais nesse tema.**

---

## 🔴 Problema: Bootstrap RLS

**Sintoma**: Tela "A verificar sistema" não completa

**Causa**: `restaurant_members` SELECT bloqueado por RLS

---

## ⚡ AÇÃO DIRETA (3 Passos)

---

### Passo 1: Diagnóstico (Console)

**Na tela `/app/bootstrap`, no console do navegador:**

```javascript
const { data, error } = await supabase
  .from('restaurant_members')
  .select('*')
  .eq('user_id', (await supabase.auth.getSession()).data.session.user.id)

console.log('🔍 Data:', data)
console.log('❌ Error:', error)
```

**Resultado esperado**:
- ❌ Se `error` não for `null` → **JÁ ACHAMOS O PROBLEMA**
- ❌ Se aparecer "permission denied" → **CONFIRMADO**

---

### Passo 2: Aplicar Fix (SQL Editor Supabase)

**Copie e cole no SQL Editor do Supabase:**

```sql
-- 1. Habilitar RLS
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- 2. Remover política antiga (se existir com nome diferente)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.restaurant_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.restaurant_members;

-- 3. Criar política correta
CREATE POLICY "Users can read own memberships"
ON public.restaurant_members
FOR SELECT
USING (user_id = auth.uid());
```

**Execute o SQL acima.**

---

### Passo 3: Recarregar

1. Recarregue `/app/bootstrap` (F5)
2. A tela deve avançar
3. Ou criar restaurante automaticamente
4. Ou ir direto ao dashboard

---

## 🔧 Se Ainda Travar (Plano B)

**Execute no console:**

```javascript
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

console.log('🏢 Insert:', data, error)
```

**Se der erro, execute no SQL Editor:**

```sql
ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create restaurants" ON public.gm_restaurants;
DROP POLICY IF EXISTS "Users can create own restaurant" ON public.gm_restaurants;

CREATE POLICY "Users can create own restaurant"
ON public.gm_restaurants
FOR INSERT
WITH CHECK (owner_id = auth.uid());
```

---

## 📋 Checklist

- [ ] Execute Passo 1 (diagnóstico)
- [ ] Copie erro exato (se houver)
- [ ] Execute Passo 2 (fix SQL)
- [ ] Recarregue `/app/bootstrap`
- [ ] Se ainda falhar → Execute Plano B

---

## 🎯 Resultado Esperado

Após Passo 2:
- ✅ Bootstrap completa
- ✅ Redireciona para dashboard ou setup
- ✅ Tela "A verificar sistema" desaparece

---

**Status**: 🟡 **AGUARDANDO EXECUÇÃO DO PASSO 2**

**Você está a um policy SQL de destravar tudo.**

