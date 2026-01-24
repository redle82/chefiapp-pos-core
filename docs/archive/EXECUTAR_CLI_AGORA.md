# 🚀 EXECUTAR CLI AGORA - INSTRUÇÕES

**Status:** ✅ Tudo preparado  
**Ação:** Execute no seu terminal

---

## ⚡ EXECUTAR AGORA (3 comandos)

Abra o terminal e execute:

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# 1. Autenticar (abrirá navegador)
supabase login

# 2. Linkar projeto
supabase link --project-ref qonfbtwsxeggxbkhqnxl

# 3. Aplicar migrations
supabase db push
```

---

## 📋 O QUE ACONTECERÁ

### Passo 1: `supabase login`
- Abrirá seu navegador
- Você fará login no Supabase
- Autorize o acesso
- Volte ao terminal

### Passo 2: `supabase link`
- Conecta o CLI ao seu projeto
- Você pode precisar confirmar o projeto

### Passo 3: `supabase db push`
- Aplica todas as migrations pendentes
- Inclui: `20260111182110_deploy_rls_race_conditions.sql`
- Mostra progresso em tempo real

---

## ✅ RESULTADO ESPERADO

Você verá algo como:

```
✅ Applied migration 20260111182110_deploy_rls_race_conditions.sql
✅ Applied migration [outras migrations pendentes]
```

---

## 🔍 VERIFICAR APÓS APLICAR

Execute no Dashboard:

1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new
2. Cole o conteúdo de `VALIDAR_DEPLOY.sql`
3. Execute
4. Verifique que todos os testes retornam ✅

---

## 🚨 SE DER ERRO

### "Access token not provided"
- Execute `supabase login` primeiro

### "Project not linked"
- Execute `supabase link --project-ref qonfbtwsxeggxbkhqnxl`

### "Migration already applied"
- Normal! Significa que já foi aplicada
- Execute validação para confirmar

---

## 📄 ARQUIVOS PRONTOS

- ✅ `supabase/migrations/20260111182110_deploy_rls_race_conditions.sql`
- ✅ `DEPLOY_MIGRATIONS_CONSOLIDADO.sql`
- ✅ `VALIDAR_DEPLOY.sql`
- ✅ `aplicar_migration_cli.sh` (script automatizado)

---

**Execute os 3 comandos acima no seu terminal!** 🚀
