# 🔍 COMO DEBUGAR ONBOARDING - GUIA RÁPIDO

**Data:** 27/01/2026

---

## 🚨 PROBLEMA: "Não está funcionando"

Para identificar o problema específico, siga estes passos:

---

## 1️⃣ VERIFICAR CONSOLE DO NAVEGADOR

1. Abra o console (F12 ou Cmd+Option+I)
2. Vá para a aba "Console"
3. Preencha a seção **Identity**
4. Procure por estas mensagens:

### ✅ Se aparecer:
```
[IdentitySection] Salvando no banco... { restaurantId: "...", formData: {...} }
[IdentitySection] ✅ Identidade salva no banco
```
**→ Está funcionando!** Os dados foram salvos.

### ❌ Se aparecer:
```
[IdentitySection] Dados válidos mas sem restaurantId. Aguardando...
```
**→ Problema:** Restaurant ID não está disponível

### ❌ Se aparecer:
```
[IdentitySection] Erro ao salvar identidade: { code: "...", message: "..." }
```
**→ Problema:** Erro do banco de dados (veja a mensagem de erro)

---

## 2️⃣ VERIFICAR RESTAURANT ID

No console do navegador, execute:

```javascript
// Verificar localStorage
localStorage.getItem('chefiapp_restaurant_id')

// Verificar se existe
localStorage.getItem('chefiapp_restaurant_id') ? '✅ Existe' : '❌ Não existe'
```

**Se retornar `null`:**
- O restaurante ainda não foi criado
- Vá para `/bootstrap` primeiro para criar o restaurante

---

## 3️⃣ VERIFICAR SE MIGRATION FOI EXECUTADA

A migration SQL precisa ser executada no banco. Verifique:

```sql
-- No banco de dados (psql ou pgAdmin)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'gm_restaurants' 
AND column_name IN ('type', 'country', 'timezone', 'currency', 'locale', 'address', 'city', 'postal_code', 'capacity');
```

**Se retornar vazio:**
- A migration não foi executada
- Execute: `docker-core/schema/migrations/20260127_onboarding_persistence.sql`

---

## 4️⃣ VERIFICAR ERROS ESPECÍFICOS

### Erro: "column does not exist"
**Solução:** Execute a migration SQL

### Erro: "permission denied" ou "new row violates row-level security"
**Solução:** Verificar políticas RLS ou usar service role key

### Erro: "relation does not exist"
**Solução:** Tabela não existe, execute a migration

### Erro: "restaurant_id" não encontrado
**Solução:** Criar restaurante primeiro via `/bootstrap`

---

## 5️⃣ TESTAR MANUALMENTE

No console do navegador:

```javascript
// 1. Obter restaurant ID
const restaurantId = localStorage.getItem('chefiapp_restaurant_id');

// 2. Testar update manual
const { data, error } = await supabase
  .from('gm_restaurants')
  .update({ name: 'Teste' })
  .eq('id', restaurantId)
  .select();

console.log('Resultado:', { data, error });
```

**Se funcionar:** O problema está no código do componente  
**Se não funcionar:** O problema está no banco/permissões

---

## 📋 CHECKLIST RÁPIDO

- [ ] Console mostra logs `[IdentitySection]`?
- [ ] `restaurantId` existe no localStorage?
- [ ] Migration SQL foi executada?
- [ ] Colunas existem em `gm_restaurants`?
- [ ] Há erros no console?
- [ ] Teste manual funcionou?

---

## 🆘 REPORTAR PROBLEMA

Quando reportar, inclua:

1. **Mensagem de erro exata** do console
2. **Restaurant ID** (se disponível)
3. **Seção que está falhando** (Identity, Location, etc.)
4. **Screenshot do console** (se possível)
5. **Resultado do teste manual** (se fez)

---

**Documento criado em:** 27/01/2026
