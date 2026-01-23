# 🚀 EXECUTAR DEPLOY AGORA

**Data:** 2026-01-18  
**Status:** ✅ Tudo pronto

---

## ⚡ COMANDO ÚNICO

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core && ./scripts/deploy-billing-phase1.sh
```

**Ou copie e cole:**
```bash
./scripts/deploy-billing-phase1.sh
```

---

## 📋 O QUE VAI ACONTECER

1. **Script verifica:**
   - ✅ Supabase CLI instalado
   - ✅ Login realizado (se não, pede para fazer)

2. **Você executa (manual):**
   - Login: `supabase login` (se necessário)
   - Linkar: `supabase link --project-ref [ref]` (se necessário)
   - Verificar tabelas: SQL Editor → `scripts/verify-billing-tables.sql`

3. **Script executa (automático):**
   - Deploy `stripe-billing`
   - Deploy `stripe-billing-webhook`
   - Lista functions deployadas

4. **Você configura (manual):**
   - Variáveis no Supabase Dashboard
   - Webhook no Stripe Dashboard

---

## ✅ RESULTADO ESPERADO

- 3 tabelas no banco
- 2 Edge Functions deployadas
- Variáveis configuradas
- Webhook ativo

---

## 📖 DOCS COMPLETAS

- `DEPLOY_BILLING_AGORA.md` — Resumo rápido
- `docs/audit/FASE_1_DIA1_CONSOLIDADO.md` — Consolidação completa

---

**TEMPO:** 15-20 minutos  
**RISCO:** Baixo  
**STATUS:** 🟢 Pronto
