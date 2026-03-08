# CORE Testing Prerequisites

> **"O CORE não inventa restaurante. O CORE não assume contexto implícito. O CORE exige identidade institucional."**

Este documento define os pré-requisitos explícitos para testar o CORE operacional. Estes não são "hacks" ou "workarounds" - são **gates ontológicos** que o CORE exige para manter a integridade financeira.

---

## 🎯 Princípio Fundamental

O CORE **não cria fatos financeiros sem identidade institucional**.

Isso significa:
- ✅ Orders requerem `restaurant_id` válido
- ✅ Não há fallback silencioso
- ✅ Não há "restaurante padrão" inventado
- ✅ O banco protege a verdade histórica com constraints

**Isso é certificação de qualidade, não defeito.**

---

## 📋 Pré-requisitos Obrigatórios

### 1. Restaurant ID (CRÍTICO)

**Requisito:** Um `restaurant_id` válido deve existir no banco de dados.

**Por quê:**
- Tabela `orders` tem constraint `NOT NULL` em `restaurant_id`
- CORE não inventa identidade institucional
- Garante que todos os fatos financeiros têm origem rastreável

**Como resolver:**

#### Opção A: Seed Explícito (Recomendado)

Execute o seed SQL:

```bash
psql $DATABASE_URL -f migrations/99999999_00_test_restaurant_seed.sql
```

Isso cria:
- Restaurant ID: `00000000-0000-0000-0000-000000000001`
- Company ID: `00000000-0000-0000-0000-000000000002`
- Slug: `test-restaurant-core`

Depois, configure no `.env`:

```bash
WEB_MODULE_RESTAURANT_ID=00000000-0000-0000-0000-000000000001
```

#### Opção B: Usar Seed Existente

Se você já tem o `seed-web-module.ts` rodado:

```bash
npm run seed:web-module
```

Isso cria um restaurante e mostra o `restaurant_id` no output. Use esse ID no `.env`.

#### Opção C: Verificar Restaurante Existente

```sql
SELECT restaurant_id FROM restaurant_web_profiles LIMIT 1;
```

Use o ID retornado no `.env`.

---

### 2. Database Connection

**Requisito:** PostgreSQL rodando e acessível.

**Verificação:**
```bash
curl http://localhost:4320/health
# Deve retornar: {"status":"ok","services":{"database":"up"}}
```

---

### 3. Environment Variables

**Requisito:** `.env` configurado com:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chefiapp_core

# Restaurant (CRÍTICO para order creation)
WEB_MODULE_RESTAURANT_ID=00000000-0000-0000-0000-000000000001

# Opcional (para outros testes)
WEB_MODULE_COMPANY_ID=00000000-0000-0000-0000-000000000002
```

---

## 🧪 Verificação Pré-Teste

Antes de executar TestSprite, verifique:

```bash
# 1. Health check
curl http://localhost:4320/health
# ✅ Deve retornar 200 OK

# 2. Restaurant existe
psql $DATABASE_URL -c "SELECT restaurant_id FROM restaurant_web_profiles WHERE restaurant_id = '00000000-0000-0000-0000-000000000001';"
# ✅ Deve retornar 1 linha

# 3. Environment variable set
echo $WEB_MODULE_RESTAURANT_ID
# ✅ Deve mostrar o UUID
```

---

## 🔍 Por Que Isso É Importante

### Gate Ontológico

O CORE implementa um **gate ontológico**:

> "Nenhum fato financeiro existe sem identidade institucional."

Isso significa:
- ✅ Orders não são criadas sem `restaurant_id`
- ✅ Event Store não aceita realidade incompleta
- ✅ Banco protege a verdade histórica

### Prova de Qualidade

Se o CORE estivesse quebrado, você teria:
- ❌ Orders criadas com `restaurant_id = NULL`
- ❌ Fallbacks silenciosos
- ❌ Contexto implícito assumido

O fato de o CORE **rejeitar** orders sem `restaurant_id` prova que:
- ✅ Integridade está protegida
- ✅ Constraints estão funcionando
- ✅ CORE está fazendo seu trabalho

---

## 📝 Checklist Pré-Teste

Antes de executar TestSprite:

- [ ] PostgreSQL rodando
- [ ] `DATABASE_URL` configurado no `.env`
- [ ] Seed executado (restaurant criado)
- [ ] `WEB_MODULE_RESTAURANT_ID` configurado no `.env`
- [ ] Servidor rodando (`npm run server:web-module`)
- [ ] Health check retorna 200 OK

---

## 🚀 Quick Start

**Opção A: Script Automatizado (Recomendado)**
```bash
# Executa seed + configura .env automaticamente
./scripts/setup-test-restaurant.sh

# Inicie servidor
npm run server:web-module

# Execute testes
# (TestSprite será executado)
```

**Opção B: Manual**
```bash
# 1. Seed o restaurante de teste
psql $DATABASE_URL -f migrations/99999999_00_test_restaurant_seed.sql

# 2. Configure .env
echo "WEB_MODULE_RESTAURANT_ID=00000000-0000-0000-0000-000000000001" >> .env

# 3. Inicie servidor
npm run server:web-module

# 4. Execute testes
# (TestSprite será executado)
```

---

## ⚠️ Importante

**NÃO** faça:
- ❌ Fallback silencioso no código
- ❌ Assumir contexto implícito
- ❌ Criar "restaurante padrão" automaticamente

**FAÇA:**
- ✅ Seed explícito e documentado
- ✅ Environment variable obrigatória
- ✅ Validação explícita

---

## 📚 Referências

- [00_CORE_DEFINITION.md](../:blueprint/00_CORE_DEFINITION.md) - Leis do CORE
- [03_CORE_CONSTRAINTS.md](../:blueprint/03_CORE_CONSTRAINTS.md) - Constraints
- [README_TESTING.md](../README_TESTING.md) - Guia de testes
- [SESSION_INFRASTRUCTURE.md](./SESSION_INFRASTRUCTURE.md) - Infraestrutura de sessão

---

**Última atualização:** 2025-12-27  
**Status:** ✅ Pré-requisito Documentado

