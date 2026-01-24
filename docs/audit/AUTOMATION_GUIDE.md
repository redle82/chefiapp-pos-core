# 🤖 Guia de Automação — ChefIApp

**Data:** 2026-01-30  
**Objetivo:** Automatizar processos repetitivos e críticos

---

## 📋 Scripts Disponíveis

### 1. 🚀 `deploy-billing.sh` — Deploy Automatizado FASE 1

**O que faz:**
- Executa migration do billing
- Deploys todas as Edge Functions
- Verifica variáveis de ambiente
- Smoke test básico

**Uso:**
```bash
./scripts/deploy-billing.sh
```

**Pré-requisitos:**
- `supabase` CLI instalado
- `DATABASE_URL` configurada (opcional, para migration automática)
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` configuradas
- `STRIPE_SECRET_KEY` configurada (ou no Supabase Dashboard)

**Ganho:** Elimina erro humano no momento mais crítico

---

### 2. ✅ `validate-commercial.sh` — Validação Mínima Comercial

**O que faz:**
- Verifica se tabelas existem
- Verifica se Edge Functions estão deployadas
- Valida variáveis de ambiente
- Testa estrutura de subscription
- Verifica RLS Policies

**Uso:**
```bash
./scripts/validate-commercial.sh
```

**Pré-requisitos:**
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` configuradas
- `DATABASE_URL` configurada (opcional, para verificações de banco)
- `jq` instalado (para parsing JSON)

**Ganho:** Valida 70% dos testes manuais automaticamente

---

### 3. 📋 `generate-session-checklist.sh` — Checklist Automático

**O que faz:**
- Gera `SESSION_CHECKLIST_<DATA>.md` automaticamente
- Lista fases tocadas
- Mostra % estimada
- Define próximo passo único

**Uso:**
```bash
./scripts/generate-session-checklist.sh
```

**Saída:** `docs/audit/SESSION_CHECKLIST_YYYY-MM-DD.md`

**Ganho:** Evita reabrir decisões já tomadas

---

### 4. 🛡️ `check-phase-guardian.sh` — Guardião de Fases

**O que faz:**
- Verifica se uma fase pode ser iniciada
- Valida pré-requisitos
- Bloqueia se necessário

**Uso:**
```bash
./scripts/check-phase-guardian.sh <FASE_NUMERO>
```

**Exemplos:**
```bash
./scripts/check-phase-guardian.sh 1  # Verifica FASE 1
./scripts/check-phase-guardian.sh 7  # Verifica FASE 7 (com confirmação)
```

**Ganho:** Garante que fases só iniciam se anteriores estiverem completas

---

## 🎯 Fluxo Recomendado

### Antes de Iniciar uma Nova Fase

```bash
# 1. Verificar se pode iniciar
./scripts/check-phase-guardian.sh <FASE_NUMERO>

# 2. Se passar, iniciar trabalho
# ... fazer implementação ...

# 3. Ao final da sessão, gerar checklist
./scripts/generate-session-checklist.sh
```

### Para Deploy de FASE 1

```bash
# 1. Deploy automatizado
./scripts/deploy-billing.sh

# 2. Validação
./scripts/validate-commercial.sh

# 3. Se passar, testes manuais completos
# Seguir: docs/audit/PHASE_1_VERIFICATION_GUIDE.md
```

---

## 📊 O Que NÃO Automatizar (Importante)

### ❌ Não Automatizar

1. **Decisão Estratégica (FASE 0)**
   - Precisa de análise humana
   - Contexto de mercado
   - Visão de produto

2. **UX Humano Fino**
   - Testes de usabilidade
   - Feedback de usuários reais
   - Ajustes de percepção

3. **Validação em Restaurante Real**
   - Testes com clientes reais
   - Feedback operacional
   - Ajustes de fluxo

4. **Pitch / Narrativa**
   - Comunicação comercial
   - Posicionamento
   - Storytelling

**Razão:** Essas partes precisam de você. Automatizar aqui mataria o diferencial.

---

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```bash
# Supabase
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_ANON_KEY="sua-chave-anon"

# Database (opcional, para migration automática)
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Stripe (opcional, para validação)
export STRIPE_SECRET_KEY="sk_test_xxx"
```

### Instalar Dependências

```bash
# Supabase CLI
npm install -g supabase

# jq (para parsing JSON)
brew install jq  # macOS
# ou
apt-get install jq  # Linux
```

---

## 📚 Documentação Relacionada

- `PHASE_GUARDIAN.md` — Regras do guardião
- `QUICK_START.md` — Guia rápido FASE 1
- `PHASE_1_VERIFICATION_GUIDE.md` — Guia completo de testes

---

## ✅ Checklist de Automação

- [x] Script de deploy criado
- [x] Script de validação criado
- [x] Script de checklist criado
- [x] Script de guardião criado
- [x] Documentação criada
- [ ] Testes dos scripts (próxima sessão)

---

**Última atualização:** 2026-01-30
