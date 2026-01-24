#!/bin/bash

# 🚀 FASE 1 — DEPLOY BILLING — SCRIPT DE EXECUÇÃO
# Data: 2026-01-18
# Objetivo: Deploy completo do billing (Dia 1)

set -e  # Parar em caso de erro

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 FASE 1 — DEPLOY BILLING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# PRÉ-REQUISITOS
# ============================================

echo "📋 Verificando pré-requisitos..."
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado"
    echo "   Instale com: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado"

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Não está logado no Supabase CLI"
    echo "   Execute: supabase login"
    exit 1
fi

echo "✅ Logado no Supabase CLI"
echo ""

# ============================================
# PASSO 1: Verificar Tabelas (MANUAL)
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PASSO 1: Verificar Tabelas (MANUAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  AÇÃO NECESSÁRIA:"
echo "   1. Abra Supabase Dashboard → SQL Editor"
echo "   2. Execute: scripts/verify-billing-tables.sql"
echo "   3. Se tabelas não existirem, execute:"
echo "      supabase/migrations/20260130000000_create_billing_core_tables.sql"
echo ""
read -p "Pressione ENTER quando tabelas estiverem verificadas/criadas..."

# ============================================
# PASSO 2: Verificar Projeto Linkado
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PASSO 2: Verificar Projeto Linkado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! supabase status &> /dev/null; then
    echo "⚠️  Projeto não está linkado"
    echo ""
    read -p "Digite o project-ref do Supabase: " PROJECT_REF
    supabase link --project-ref "$PROJECT_REF"
else
    echo "✅ Projeto já está linkado"
    supabase status
fi

echo ""

# ============================================
# PASSO 3: Deploy Edge Functions
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PASSO 3: Deploy Edge Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🚀 Deployando stripe-billing..."
npx supabase functions deploy stripe-billing

echo ""
echo "🚀 Deployando stripe-billing-webhook..."
npx supabase functions deploy stripe-billing-webhook

echo ""
echo "✅ Edge Functions deployadas"
echo ""

# ============================================
# PASSO 4: Verificar Functions Deployadas
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PASSO 4: Verificar Functions Deployadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx supabase functions list

echo ""

# ============================================
# RESUMO
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY CONCLUÍDO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Próximos passos (MANUAIS):"
echo ""
echo "1. Configurar Variáveis no Supabase Dashboard:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_BILLING_WEBHOOK_SECRET (após configurar webhook)"
echo ""
echo "2. Configurar Webhook no Stripe Dashboard:"
echo "   - URL: https://[projeto].supabase.co/functions/v1/stripe-billing-webhook"
echo "   - Eventos: checkout.session.completed, customer.subscription.*, invoice.*"
echo "   - Copiar secret → adicionar em STRIPE_BILLING_WEBHOOK_SECRET"
echo ""
echo "3. Configurar Frontend (.env.local):"
echo "   - VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx"
echo ""
echo "📖 Guia completo: docs/audit/FASE_1_DIA1_GUIA_COMPLETO.md"
echo ""
