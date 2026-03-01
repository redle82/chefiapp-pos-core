# Quick Start - Testes Manuais

**Data:** 2026-01-25
**Objetivo:** Guia rápido para começar a testar o sistema

---

## 🚀 Início Rápido

### 1. Verificar Serviços

```bash
# Docker Core
cd docker-core
docker compose -f docker-compose.core.yml ps

# Frontend (se não estiver rodando)
cd merchant-portal
npm run dev
```

### 2. Abrir URLs de Teste

```bash
# Script automático (abre todas as URLs)
./scripts/open-test-urls.sh

# Ou manualmente:
# - KDS: http://localhost:5175/app/kds
# - TPV: http://localhost:5175/app/tpv
# - Página Pública: http://localhost:5175/public/restaurante-piloto
# - Mesa 1: http://localhost:5175/public/restaurante-piloto/mesa/1
```

### 3. Executar Validações Automatizadas

```bash
# Validar Realtime
./scripts/validate-realtime.sh

# Validar Web/QR Mesa
./scripts/validate-web-qr-mesa.sh
```

---

## 📋 Testes Essenciais (5 minutos)

### Teste 1: Realtime no KDS

1. Abrir KDS: `http://localhost:5175/app/kds`
2. Verificar 🟢 no header (conectado)
3. Criar pedido no TPV
4. ✅ Pedido deve aparecer automaticamente no KDS

### Teste 2: QR Mesa

1. Abrir: `http://localhost:5175/public/restaurante-piloto/mesa/1`
2. Adicionar produtos e criar pedido
3. Abrir KDS
4. ✅ Pedido deve aparecer com badge **QR MESA 📱** (rosa)

### Teste 3: Constraint

1. Tentar criar segundo pedido na mesa 1
2. ✅ Deve bloquear com mensagem clara

---

## 📚 Documentação Completa

- **Guia Completo de Testes:** `docs/testing/MANUAL_TEST_GUIDE.md`
- **Resumo da Sessão:** `docs/SESSION_SUMMARY_2026-01-25.md`
- **Próximos Passos:** `docs/NEXT_STEPS.md`

---

**Última atualização:** 2026-01-25
