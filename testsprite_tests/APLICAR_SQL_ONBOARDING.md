# 🚀 APLICAR SQL PARA BYPASS DE ONBOARDING

**Data:** 2026-01-17  
**Objetivo:** Marcar onboarding como completo para usuário de teste

---

## 📋 INSTRUÇÕES

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase/migrations/20260117_mark_test_user_onboarding_complete.sql`
6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. Verifique a mensagem de sucesso no console

### Opção 2: Via Supabase CLI

```bash
# Se você tem Supabase CLI configurado
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase db push
```

---

## ✅ VALIDAÇÃO

Após aplicar, verifique:

```sql
-- Verificar se onboarding foi marcado como completo
SELECT 
    r.id,
    r.name,
    r.onboarding_completed,
    r.onboarding_completed_at,
    r.wizard_completed_at,
    r.setup_status,
    r.status,
    u.email
FROM gm_restaurants r
JOIN gm_restaurant_members rm ON r.id = rm.restaurant_id
JOIN auth.users u ON rm.user_id = u.id
WHERE u.email = 'contact@goldmonkey.studio';
```

**Resultado esperado:**
- `onboarding_completed = true`
- `onboarding_completed_at` não nulo
- `wizard_completed_at` não nulo
- `setup_status = 'advanced_done'`
- `status = 'active'`

---

## 🔄 PRÓXIMO PASSO

Após aplicar o SQL, re-executar TestSprite:

```bash
# Re-executar TestSprite
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
# O TestSprite será executado automaticamente via MCP
```

---

## 📝 NOTAS

- O script é **idempotente** (pode ser executado múltiplas vezes)
- Se o usuário não existir, o script não falhará (apenas avisará)
- Se o restaurante não existir, o script não falhará (apenas avisará)
