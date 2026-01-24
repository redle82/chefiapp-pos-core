# 🚀 APLICAR MIGRATIONS VIA SUPABASE MCP

**Data:** 2026-01-16  
**Método:** Supabase Management API / CLI

---

## 📋 MIGRATIONS PRONTAS

1. ✅ `DEPLOY_MIGRATIONS_CONSOLIDADO.sql` — SQL consolidado (403 linhas)
2. ✅ `VALIDAR_DEPLOY.sql` — Scripts de validação

---

## 🎯 OPÇÕES DE APLICAÇÃO

### Opção 1: Via Supabase Dashboard (Mais Rápido - 5 min)

1. **Abrir SQL Editor:**
   - URL: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new

2. **Aplicar Migration:**
   - Abrir arquivo: `DEPLOY_MIGRATIONS_CONSOLIDADO.sql`
   - Copiar TODO o conteúdo (Cmd+A, Cmd+C)
   - Colar no SQL Editor (Cmd+V)
   - Executar (Cmd+Enter ou botão Run)

3. **Validar:**
   - Executar `VALIDAR_DEPLOY.sql` no mesmo SQL Editor
   - Verificar que todos os testes retornam ✅ OK

---

### Opção 2: Via Supabase CLI (Se Autenticado)

```bash
# 1. Autenticar (se necessário)
supabase login

# 2. Linkar projeto
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase link --project-ref qonfbtwsxeggxbkhqnxl

# 3. Aplicar migrations
supabase db push

# 4. Verificar
supabase migration list
```

---

### Opção 3: Via Management API (Avançado)

Se você tiver acesso à Management API do Supabase:

```typescript
// Usar @supabase/supabase-js com Service Role Key
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qonfbtwsxeggxbkhqnxl.supabase.co',
  'SERVICE_ROLE_KEY' // Obter em: Settings → API → service_role key
);

// Executar SQL via RPC (se função criada)
// Ou usar Management API diretamente
```

**Nota:** A API pública do Supabase não permite execução direta de SQL por segurança.

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

Após aplicar, execute `VALIDAR_DEPLOY.sql` e verifique:

1. ✅ RLS ativo em 5 tabelas
2. ✅ Policies criadas (20+ policies)
3. ✅ Unique indexes criados (3 indexes)
4. ✅ Helper function criada
5. ✅ Performance indexes criados (4+ indexes)

---

## 🚨 IMPORTÂNCIA CRÍTICA

**Estas migrations são CRÍTICAS:**
- ✅ **RLS** previne vazamento de dados entre restaurantes
- ✅ **Race Conditions** previne pedidos duplicados
- ✅ **Unique Indexes** garantem integridade de dados

**SEM ESTAS MIGRATIONS:**
- ❌ Sistema vulnerável a vazamento de dados
- ❌ Possibilidade de pedidos duplicados
- ❌ Violação de isolamento multi-tenant

---

**AÇÃO OBRIGATÓRIA:** Aplicar migrations AGORA via Dashboard ou CLI

**Construído com 💛 pelo Goldmonkey Empire**  
**Data:** 2026-01-16
