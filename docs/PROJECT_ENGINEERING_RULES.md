# PROJETO — REGRAS DE ENGENHARIA

**Status:** ATIVO  
**Data:** 2026-01-23  
**Projeto:** ChefIApp

> **Este documento declara como o ChefIApp aplica a `ENGINEERING_CONSTITUTION.md` global.**

---

## 📚 CONSTITUIÇÃO GLOBAL

**Referência obrigatória:** `~/.cursor/ENGINEERING_CONSTITUTION.md` (global) ou `ENGINEERING_CONSTITUTION.md` (se copiado para o projeto)

Todas as regras da constituição global se aplicam. Este documento só declara **exceções e adaptações específicas**.

---

## 🛠️ STACK DO PROJETO

- **Frontend Web:** React + Vite + TypeScript
- **Frontend Mobile:** React Native + Expo + TypeScript
- **Backend:** Supabase (Postgres + Edge Functions)
- **Deploy:** Supabase CLI + Vercel (frontend)

---

## 📁 ESTRUTURA DE PASTAS

- **Código Core:** `merchant-portal/`, `mobile-app/`, `server/`
- **Documentação:** `docs/`
- **Scripts Oficiais:** `scripts/`
- **Archive:** `archive/` (código morto, docs obsoletos)
- **Migrations:** `supabase/migrations/`

---

## 🔐 AUTORIDADES DECLARADAS

### Banco de Dados

**Fonte da Verdade:** `docs/architecture/DATABASE_AUTHORITY.md`

**Regra de Ouro:**
- Código novo só conversa com tabelas `gm_*`
- Legado é congelado, não tocado

### Backend vs Frontend

**Fonte da Verdade:** `docs/audit/AUDITORIA_BACKEND_VS_FRONTEND.md`

**Regras:**
- Backend decide verdade (pedidos, billing)
- Frontend decide UX (roteamento, renderização)
- Backend valida tudo que é crítico

### Billing

**Fonte da Verdade:** `docs/architecture/BILLING_FLOW.md`

**Schema Oficial:** `subscriptions`, `billing_events`, `billing_payments`

---

## 🤖 SCRIPTS OFICIAIS

**Fonte da Verdade:** `docs/architecture/SCRIPTS_OFICIAIS.md`

**Scripts Principais:**
- `./aplicar_migration.sh` - Aplicar migrations
- `./scripts/deploy-billing-phase1.sh` - Deploy de billing
- `./scripts/verify-billing-tables.sql` - Verificar tabelas

---

## 📋 CICLO DE DESENVOLVIMENTO

**Seguir:** `ENGINEERING_CONSTITUTION.md` → Ciclo Obrigatório

**Validações Específicas:**
```bash
# Merchant Portal
cd merchant-portal && npm run typecheck && npm run lint

# Mobile App
cd mobile-app && npm run typecheck
```

---

## 🚀 DEPLOY

**Guias Oficiais:**
- Billing: `DEPLOY_BILLING_AGORA.md`
- Completo: `docs/audit/FASE_1_DIA1_GUIA_COMPLETO.md`

**Nunca deployar sem seguir checklist oficial.**

---

## 📚 DOCUMENTAÇÃO

**Índices:**
- `docs/audit/INDICE_CONSOLIDACAO.md` - Índice completo
- `PROXIMOS_PASSOS.md` - Próximos passos imediatos

**Regra:**
- Documento novo → atualizar índice
- Documento obsoleto → `archive/docs/`

---

## ⚠️ EXCEÇÕES À CONSTITUIÇÃO GLOBAL

**Nenhuma exceção atualmente.**

Todas as regras da constituição global se aplicam integralmente.

---

## 🔗 DOCUMENTOS RELACIONADOS

- `~/.cursor/ENGINEERING_CONSTITUTION.md` - Constituição global (localização padrão)
- `docs/architecture/DATABASE_AUTHORITY.md` - Autoridade do banco
- `docs/audit/AUDITORIA_BACKEND_VS_FRONTEND.md` - Separação de responsabilidades
- `docs/architecture/BILLING_FLOW.md` - Fluxo de billing

---

**ÚLTIMA ATUALIZAÇÃO:** 2026-01-23  
**VERSÃO:** 1.0
