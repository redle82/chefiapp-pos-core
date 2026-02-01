# 🐛 DEBUG: ONBOARDING PERSISTÊNCIA NÃO FUNCIONA

**Data:** 27/01/2026  
**Status:** 🔍 **DEBUGGING**

---

## 🔍 POSSÍVEIS PROBLEMAS

### 1. **Restaurant ID não disponível**
- `useRestaurantIdentity()` pode não ter carregado ainda durante o onboarding
- O `restaurantId` pode não estar no localStorage

**Solução:** Adicionar fallback para `localStorage.getItem('chefiapp_restaurant_id')`

### 2. **Tabelas não existem no banco**
- A migration SQL pode não ter sido executada
- Colunas podem não existir em `gm_restaurants`

**Solução:** Verificar se a migration foi executada

### 3. **Erros de permissão RLS (Row Level Security)**
- Supabase pode estar bloqueando updates
- Políticas RLS podem não permitir updates

**Solução:** Verificar políticas RLS ou usar service role key temporariamente

### 4. **Erros de validação SQL**
- Colunas podem ter constraints que estão falhando
- Tipos de dados podem estar incorretos

**Solução:** Verificar logs do banco

---

## 🔧 CHECKLIST DE DEBUG

### 1. Verificar Console do Navegador
Abra o console (F12) e procure por:
- `[IdentitySection]` logs
- Erros do Supabase
- Warnings sobre `restaurantId`

### 2. Verificar Restaurant ID
```javascript
// No console do navegador
localStorage.getItem('chefiapp_restaurant_id')
```

### 3. Verificar se Migration foi Executada
```sql
-- No banco de dados
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'gm_restaurants' 
AND column_name IN ('type', 'country', 'timezone', 'currency', 'locale', 'address', 'city', 'postal_code', 'capacity');
```

### 4. Testar Update Manual
```sql
-- No banco de dados
UPDATE gm_restaurants 
SET name = 'Teste', type = 'RESTAURANT', country = 'BR'
WHERE id = 'SEU_RESTAURANT_ID';
```

### 5. Verificar Políticas RLS
```sql
-- No banco de dados
SELECT * FROM pg_policies WHERE tablename = 'gm_restaurants';
```

---

## 🚀 SOLUÇÕES IMPLEMENTADAS

### 1. Fallback para Restaurant ID
Agora usa `identity.id || localStorage.getItem('chefiapp_restaurant_id')`

### 2. Logs Melhorados
Adicionados logs detalhados para debug:
- `[IdentitySection] Salvando no banco...`
- `[IdentitySection] ✅ Identidade salva no banco`
- `[IdentitySection] Erro ao salvar identidade:`

### 3. Alertas de Erro
Agora mostra `alert()` quando há erro (para debug)

---

## 📋 PRÓXIMOS PASSOS

1. **Verificar Console:**
   - Abra o console do navegador
   - Preencha a seção Identity
   - Veja os logs e erros

2. **Verificar Banco:**
   - Execute a migration SQL se não executou ainda
   - Verifique se as colunas existem

3. **Testar Manualmente:**
   - Tente fazer um update manual no banco
   - Verifique se há políticas RLS bloqueando

4. **Reportar Erro Específico:**
   - Copie o erro exato do console
   - Informe qual seção está falhando
   - Informe se o `restaurantId` está disponível

---

**Documento criado em:** 27/01/2026  
**Status:** 🔍 **AGUARDANDO INFORMAÇÕES DE DEBUG**
