# ✅ AÇÃO 1 — Fix de Onboarding

**Status:** ⏳ **Aguardando aplicação manual no Supabase Cloud**

---

## 📋 O QUE FOI FEITO

1. ✅ Script criado: `scripts/apply-onboarding-fix.sh`
2. ✅ SQL validado: `FIX_ONBOARDING_SQL.sql`
3. ✅ Instruções claras fornecidas

---

## 🚀 PRÓXIMO PASSO (MANUAL)

O Supabase CLI não está linkado ao projeto cloud. **Aplique manualmente:**

### Opção Rápida (2 minutos):

1. **Abrir arquivo SQL:**
   ```bash
   open FIX_ONBOARDING_SQL.sql
   ```

2. **Copiar todo o conteúdo** (Cmd+A, Cmd+C)

3. **Acessar Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
   - Menu: **SQL Editor**

4. **Colar e executar** (Cmd+V, depois Cmd+Enter)

5. **Verificar:**
   - Deve aparecer: "Success. No rows returned"
   - Ou uma tabela mostrando a função criada

---

## ✅ APÓS APLICAR

1. **Testar onboarding:**
   - Voltar para o app
   - Tentar criar entidade novamente
   - O erro `null value in column "heartbeat"` deve desaparecer

2. **Marcar como completo:**
   - [ ] SQL aplicado no Supabase Cloud
   - [ ] Onboarding testado e funcionando
   - [ ] Avançar para Ação 2 (Testar Onboarding Completo)

---

## 🔧 ALTERNATIVA: Linkar Supabase CLI

Se quiser automatizar no futuro:

```bash
supabase link --project-ref qonfbtwsxeggxbkhqnxl
./scripts/apply-onboarding-fix.sh
```

---

**Arquivo SQL:** `FIX_ONBOARDING_SQL.sql`  
**Script:** `scripts/apply-onboarding-fix.sh`  
**Tempo estimado:** 2 minutos
