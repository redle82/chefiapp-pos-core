# 🔧 FIX: Onboarding Empire Pulses Insert

**Data:** 2026-01-08  
**Problema:** `null value in column "project_slug" of relation "empire_pulses" violates not-null constraint`

---

## 🐛 Problema

A função RPC `create_tenant_atomic` estava tentando inserir em `empire_pulses` usando colunas antigas:
- `type`, `status`, `metadata` (não existem mais)

Mas a tabela atual requer:
- `project_slug` (NOT NULL)
- `tenant_slug` (NOT NULL)  
- `heartbeat` (NOT NULL)
- `metrics` (JSONB)
- `events` (JSONB)

---

## ✅ Solução

**Migration:** `supabase/migrations/031_fix_empire_pulses_insert.sql`

**Mudanças:**
1. Atualizada função `create_tenant_atomic` para usar schema correto
2. Inserção em `empire_pulses` agora usa:
   - `project_slug: 'chefiapp'`
   - `tenant_slug: v_slug` (slug do restaurante)
   - `heartbeat: now()`
   - `metrics: jsonb_build_object(...)`
   - `events: '[]'::jsonb`

---

## 🚀 Aplicar Migration

**Local:**
```bash
npx supabase migration up
```

**Cloud:**
```bash
npx supabase db push
```

---

**Status:** Migration criada e pronta para aplicar.
