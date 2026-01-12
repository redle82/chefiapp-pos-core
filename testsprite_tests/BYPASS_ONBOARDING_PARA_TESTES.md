# 🧪 BYPASS DE ONBOARDING PARA TESTES

**Data:** 2026-01-17  
**Objetivo:** Permitir que TestSprite acesse funcionalidades principais sem completar onboarding

---

## 📋 SOLUÇÕES IMPLEMENTADAS

### 1. Script SQL para Marcar Onboarding como Completo

**Arquivo:** `supabase/migrations/20260117_mark_test_user_onboarding_complete.sql`

Este script:
- Encontra o usuário de teste (`contact@goldmonkey.studio`)
- Encontra o restaurante associado
- Marca `onboarding_completed = true`
- Marca `onboarding_completed_at = NOW()`
- Marca `wizard_completed_at = NOW()`
- Define `setup_status = 'advanced_done'`
- Define `status = 'active'`

**Como aplicar:**
```sql
-- Via Supabase Dashboard SQL Editor
-- Copiar e colar o conteúdo do arquivo SQL
```

### 2. Bypass via URL Parameter

**Arquivo:** `merchant-portal/src/core/flow/FlowGate.tsx`

Adicionado bypass via URL parameter `?skip_onboarding=true`:
- Quando presente, o FlowGate ignora verificação de onboarding
- Define flag `chefiapp_test_mode = 'true'` no TabIsolatedStorage
- Permite acesso direto às funcionalidades principais

**Como usar:**
```
http://localhost:5173/app/tpv?skip_onboarding=true
http://localhost:5173/app/dashboard?skip_onboarding=true
```

---

## 🎯 COMO USAR

### Opção 1: Aplicar SQL (Recomendado)

1. Acesse Supabase Dashboard
2. Vá para SQL Editor
3. Execute o script `20260117_mark_test_user_onboarding_complete.sql`
4. Verifique que o onboarding foi marcado como completo

### Opção 2: Usar URL Parameter

1. Adicione `?skip_onboarding=true` a qualquer URL
2. O sistema irá bypassar o onboarding automaticamente
3. Útil para testes manuais e TestSprite

---

## ✅ VALIDAÇÃO

Após aplicar, verifique:

1. **Login funciona:** ✅ (já validado)
2. **Onboarding bypassado:** Acesse `/app/tpv?skip_onboarding=true`
3. **TestSprite pode testar:** Re-executar TestSprite

---

## 📝 NOTAS

- O bypass via URL é **apenas para testes**
- Em produção, o onboarding deve ser completado normalmente
- O script SQL é idempotente (pode ser executado múltiplas vezes)
- O bypass via URL não persiste no banco, apenas na sessão atual

---

## 🔄 PRÓXIMOS PASSOS

1. Aplicar script SQL no Supabase
2. Re-executar TestSprite
3. Validar que todos os testes podem acessar funcionalidades principais
4. Documentar resultados
