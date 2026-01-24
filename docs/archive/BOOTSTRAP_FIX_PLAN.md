# 🔧 Plano de Correção: Bootstrap Pós-Login

**Data**: 2025-01-27  
**Status**: 🔴 **AGUARDANDO DIAGNÓSTICO**

---

## ✅ Status Confirmado

### Autenticação: 100% RESOLVIDA ✅

- OAuth Google → ✅
- Supabase Auth → ✅
- Sessão criada → ✅
- Redirect `/app/bootstrap` → ✅
- Nenhum token legacy → ✅
- Hook `useSupabaseAuth` → ✅

**Conclusão**: Não existe problema de autenticação.

---

## 🔴 Problema Real: Bootstrap / Onboarding de Dados

**Sintoma**: Tela "A verificar sistema" não completa

**Causa**: Usuário existe no Auth, mas "mundo" dele ainda não está consistente no banco.

**Isso é 100% esperado no primeiro login real.**

---

## 🎯 Candidatos de Falha (3 possíveis)

### 🧨 Candidato #1: `restaurant_members` (SELECT)
**Mais provável**
- RLS bloqueando leitura
- Tabela sem política para SELECT
- Nenhum registro para esse user (código não trata bem)

### 🧨 Candidato #2: `gm_restaurants.insert()`
- RLS não permite INSERT
- Campo obrigatório faltando
- Constraint (slug unique, FK, etc.)

### 🧨 Candidato #3: `restaurant_members.insert()`
- FK quebrando
- RLS bloqueando INSERT
- Ordem errada (membership antes do restaurant existir)

---

## 🧪 Scripts de Diagnóstico (Ordem Exata)

Execute na tela `/app/bootstrap`, no console do navegador:

---

### 1️⃣ Confirmar Sessão (Sanidade)

```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('✅ Sessão:', session ? 'VÁLIDA' : 'INVÁLIDA')
console.log('👤 User ID:', session?.user?.id)
console.log('📧 Email:', session?.user?.email)
```

**Se isso falhar** → Problema grave (improvável)  
**Se passar** → Seguimos

---

### 2️⃣ Testar Leitura de Membership (Ponto Crítico)

```javascript
const { data, error } = await supabase
  .from('restaurant_members')
  .select('*')
  .eq('user_id', session.user.id)

console.log('🔍 Membership Data:', data)
console.log('❌ Membership Error:', error)
```

**👉 Se `error` existir, copie exatamente o erro.**

---

### 3️⃣ Testar Leitura de Restaurantes

```javascript
const { data, error } = await supabase
  .from('gm_restaurants')
  .select('*')
  .limit(1)

console.log('🏢 Restaurants Data:', data)
console.log('❌ Restaurants Error:', error)
```

**👉 Se isso falhar** → RLS ou schema

---

### 4️⃣ Testar Insert Manual (Confirmação Final)

```javascript
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
```

**👉 Este teste confirma se o problema é INSERT ou SELECT**

---

## 🔧 Fixes Possíveis (Prontos para Aplicar)

### Fix A — Política RLS Faltando (SELECT)

**Problema**: `restaurant_members` bloqueado para leitura

**Solução**:
```sql
-- Permitir que usuários leiam suas próprias memberships
CREATE POLICY "Users can read own memberships"
ON restaurant_members
FOR SELECT
USING (user_id = auth.uid());
```

---

### Fix B — Política RLS Faltando (INSERT em gm_restaurants)

**Problema**: `gm_restaurants` bloqueado para inserção

**Solução**:
```sql
-- Permitir que usuários criem seus próprios restaurantes
CREATE POLICY "Users can create own restaurant"
ON gm_restaurants
FOR INSERT
WITH CHECK (owner_id = auth.uid());
```

---

### Fix C — Política RLS Faltando (INSERT em restaurant_members)

**Problema**: `restaurant_members` bloqueado para inserção

**Solução**:
```sql
-- Permitir que usuários criem memberships para seus restaurantes
CREATE POLICY "Users can create own membership"
ON restaurant_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM gm_restaurants 
    WHERE id = restaurant_id 
    AND owner_id = auth.uid()
  )
);
```

---

### Fix D — Ordem Errada no Bootstrap

**Problema**: Tentando criar membership antes do restaurant existir

**Solução**: Ajustar código do `BootstrapPage.tsx` para garantir ordem:
1. Criar restaurante
2. Aguardar confirmação
3. Criar membership
4. Só depois seguir para dashboard

---

## 📋 Checklist de Aplicação

Após identificar o erro:

- [ ] Executar script de diagnóstico
- [ ] Identificar qual query falha
- [ ] Aplicar fix correspondente (A, B, C ou D)
- [ ] Testar novamente
- [ ] Confirmar que bootstrap completa

---

## 🎯 Próximo Passo

**Execute os scripts acima** (especialmente Script 2 e 4) e me informe:

1. Qual script falhou?
2. Qual erro apareceu? (copie exato)
3. Qual query específica está quebrando?

**Com uma mensagem de erro, eu te devolvo**:
- SQL exato
- Política RLS exata
- Ou ajuste de código exato

---

## 🟢 Conclusão

Você está exatamente onde um produto sério chega após resolver auth:

- 🔐 Identidade resolvida ✅
- 🧠 Sessão resolvida ✅
- 🧱 Agora falta alinhar dados iniciais + RLS ⏳

**Isso não é bug grave. Isso é onboarding de sistema multi-tenant.**

---

**Status**: 🟡 **AGUARDANDO RESULTADO DOS SCRIPTS**

**Você está no último portão antes do dashboard abrir.**

