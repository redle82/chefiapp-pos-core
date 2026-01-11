# 🚀 APLICAR MIGRATIONS VIA SUPABASE CLI (MCP)

**Data:** 2026-01-16  
**Método:** Supabase CLI  
**Status:** Migration criada e pronta para aplicar

---

## ✅ PREPARAÇÃO COMPLETA

- ✅ Migration criada: `supabase/migrations/[TIMESTAMP]_deploy_rls_race_conditions.sql`
- ✅ Script automatizado: `aplicar_migration_mcp.sh`
- ✅ Arquivo consolidado: `DEPLOY_MIGRATIONS_CONSOLIDADO.sql`

---

## 🚀 APLICAR AGORA (3 comandos)

### Passo 1: Autenticar
```bash
supabase login
```
- Abrirá o navegador para autenticação
- Autorize o acesso

### Passo 2: Linkar Projeto
```bash
supabase link --project-ref qonfbtwsxeggxbkhqnxl
```
- Conecta o CLI ao seu projeto Supabase

### Passo 3: Aplicar Migrations
```bash
supabase db push
```
- Aplica todas as migrations pendentes
- Inclui a migration de RLS + Race Conditions

---

## ⚡ MÉTODO RÁPIDO (Script Automatizado)

Execute o script criado:

```bash
./aplicar_migration_mcp.sh
```

O script irá:
1. Verificar se está autenticado
2. Criar migration se necessário
3. Aplicar via `supabase db push`

---

## ✅ VALIDAÇÃO APÓS APLICAR

Após aplicar, execute no Dashboard:

1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new
2. Cole o conteúdo de `VALIDAR_DEPLOY.sql`
3. Execute
4. Verifique que todos os testes retornam ✅

---

## 📋 O QUE SERÁ APLICADO

### ✅ Segurança (RLS)
- 5 tabelas com Row Level Security ativo
- 20+ policies criadas
- Isolamento total entre restaurantes

### ✅ Prevenção de Race Conditions
- Unique index: Apenas 1 pedido ativo por mesa
- Unique index: Apenas 1 caixa aberto por restaurante
- Unique index: Prevenção de pagamentos duplicados

### ✅ Performance
- 4+ indexes para queries rápidas
- Otimização de hot paths (KDS, TPV)

---

## 🚨 SE DER ERRO

### Erro: "Access token not provided"
**Solução:** Execute `supabase login` primeiro

### Erro: "Project not linked"
**Solução:** Execute `supabase link --project-ref qonfbtwsxeggxbkhqnxl`

### Erro: "Migration already applied"
**Solução:** Normal, significa que já foi aplicada. Execute validação.

---

## 🎯 RESULTADO ESPERADO

Após aplicar com sucesso, você verá:
```
✅ Applied migration [TIMESTAMP]_deploy_rls_race_conditions.sql
```

E no Dashboard (validação):
- ✅ 5 tabelas com RLS ativo
- ✅ 20+ policies criadas
- ✅ 3 unique indexes criados
- ✅ 1 helper function criada
- ✅ 4+ performance indexes criados

---

**Construído com 💛 pelo Goldmonkey Empire**  
**Ação:** Execute os 3 comandos acima para aplicar
