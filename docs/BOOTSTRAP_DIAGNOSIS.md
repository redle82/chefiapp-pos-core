# 🔍 Diagnóstico: Bootstrap Pós-Login

**Data**: 2025-01-27  
**Status**: 🔴 **QUERY FALHANDO**

---

## ✅ Confirmação: Login Funcionou

**Teste 3: Login com Google** → ✅ **PASSOU**

- OAuth completado com sucesso
- Sessão criada no Supabase
- Redirect para `/app/bootstrap` funcionou

---

## 🔴 Problema: Bootstrap Falhando

**Sintoma**: Tela "A verificar sistema" não completa

**Causa provável**: Uma das queries do bootstrap está falhando

---

## 📋 Queries que o Bootstrap Executa

### 1. Verificar Sessão (linha 59)
```typescript
const { data: { session }, error: authError } = await supabase.auth.getSession()
```
**Status**: ✅ Provavelmente OK (senão não chegaria aqui)

---

### 2. Verificar Membership (linha 82-85)
```typescript
const { data: members, error: memberError } = await supabase
  .from('restaurant_members')
  .select('restaurant_id, role')
  .eq('user_id', user.id)
```
**Possível problema**: 
- RLS bloqueando leitura
- Tabela `restaurant_members` não existe
- User não tem permissão

---

### 3. Criar Restaurante (linha 109-121) - Se novo usuário
```typescript
const { data: restData, error: restError } = await supabase
  .from('gm_restaurants')
  .insert({
    name: name,
    slug: slug,
    owner_id: user.id,
    status: 'active',
    country: 'ES',
    plan: 'trial',
    type: 'Restaurante'
  })
```
**Possível problema**:
- RLS bloqueando inserção
- Campos obrigatórios faltando
- Constraint violation

---

### 4. Criar Membership (linha 126-133) - Se novo usuário
```typescript
const { error: linkError } = await supabase
  .from('restaurant_members')
  .insert({
    user_id: user.id,
    restaurant_id: restData.id,
    role: 'owner'
  })
```
**Possível problema**:
- RLS bloqueando inserção
- Foreign key violation

---

## 🧪 Scripts de Diagnóstico

### Script 1: Verificar Sessão
```javascript
// No console do navegador (na tela /app/bootstrap)
const { data: { session }, error } = await supabase.auth.getSession()
console.log('✅ Sessão:', session ? 'VÁLIDA' : 'INVÁLIDA')
console.log('👤 User ID:', session?.user?.id)
console.log('📧 Email:', session?.user?.email)
```

### Script 2: Verificar Membership
```javascript
// Verificar se user tem membership
const { data: members, error } = await supabase
  .from('restaurant_members')
  .select('restaurant_id, role')
  .eq('user_id', session.user.id)

console.log('🔍 Membership:', members)
console.log('❌ Erro:', error)
```

### Script 3: Verificar Tabelas
```javascript
// Verificar se tabelas existem e são acessíveis
const { data: restaurants, error: rError } = await supabase
  .from('gm_restaurants')
  .select('id')
  .limit(1)

const { data: members, error: mError } = await supabase
  .from('restaurant_members')
  .select('id')
  .limit(1)

console.log('🏢 gm_restaurants:', rError ? '❌ ERRO' : '✅ OK', rError)
console.log('👥 restaurant_members:', mError ? '❌ ERRO' : '✅ OK', mError)
```

### Script 4: Tentar Criar Restaurante (Teste)
```javascript
// Testar criação de restaurante
const { data: restData, error: restError } = await supabase
  .from('gm_restaurants')
  .insert({
    name: 'Teste Restaurante',
    slug: `teste-${Date.now()}`,
    owner_id: session.user.id,
    status: 'active',
    country: 'ES',
    plan: 'trial',
    type: 'Restaurante'
  })
  .select()
  .single()

console.log('🏢 Criar restaurante:', restError ? '❌ ERRO' : '✅ OK')
console.log('Erro:', restError)
```

---

## 🔧 Próximo Passo

**Execute os scripts acima no console** (na ordem: 1 → 2 → 3 → 4) e me informe:

1. Qual script falhou?
2. Qual erro apareceu? (copie exato)
3. Qual query específica está quebrando?

**Com uma mensagem de erro, eu te devolvo**:
- SQL exato (ver `docs/BOOTSTRAP_RLS_FIXES.sql`)
- Política RLS exata
- Ou ajuste de código exato

---

## 📋 Fixes Prontos

Já preparei os fixes possíveis em:
- `docs/BOOTSTRAP_FIX_PLAN.md` - Plano completo
- `docs/BOOTSTRAP_RLS_FIXES.sql` - SQL pronto para aplicar

**Aguardando resultado dos scripts para aplicar o fix correto.**

---

## 📌 Observação

O erro "Sistema indisponível" aparece quando:
- Qualquer query do bootstrap falha
- Timeout de 15s é atingido
- RLS bloqueia acesso

**Não é problema de autenticação** - é problema de **inicialização de dados**.

