# Plano Unificado de Implementação — ChefIApp POS CORE

> **Versão:** 1.1 · **Data:** 2026-02-08 · **Branch:** `core/frozen-v1` > **Status atual do produto:** ~80% pronto para produção ✅

---

## Visão Geral

Este plano combina **3 frentes**:

1. **Blockers de Produção** — 2 pendências restantes
2. **Pulso Operacional** — novo módulo diferenciador
3. **Hardening Final** — itens para atingir 80%+

---

## FRENTE A — Blockers de Produção (2h) ✅

### A.1 Limpar Chaves Stripe do Git (30min) ✅

| Arquivo                                                           | Linha  | Ação                                      |
| ----------------------------------------------------------------- | ------ | ----------------------------------------- |
| `tests/audit-a3-webhook.sh`                                       | 41     | ✅ Removido fallback, agora exige env var |
| `docs/archive/MERCHANT_ONBOARDING_CHECKLIST.md`                   | 47,216 | ✅ Substituído por `$STRIPE_SECRET_KEY`   |
| `testsprite_tests/tmp/prd_files/MERCHANT_ONBOARDING_CHECKLIST.md` | 47,216 | ✅ Idem                                   |
| `docs/security/STRIPE_KEYS_ROTATION.md`                           | 29-41  | ✅ Prefixos redacted para `XXXX`          |

**Validação:** `grep -rn 'sk_test_51SgVOw' . --include='*.sh' --include='*.md' --include='*.ts' | grep -v node_modules` → 0 resultados ✅

### A.2 Keycloak Modo Produção (1h30) ✅

| Item        | Atual                                                   | Status |
| ----------- | ------------------------------------------------------- | ------ |
| Comando     | `docker-compose.prod.yml`: `start --optimized`          | ✅     |
| Admin user  | Dev: `${:?}` exige .env · Prod: `${:?}` env obrigatório | ✅     |
| Proxy       | Prod: `KC_PROXY_HEADERS=xforwarded` + TLS               | ✅     |
| Hostname    | Prod: `KC_HOSTNAME` via env obrigatório                 | ✅     |
| Healthcheck | `/health/ready` mantido                                 | ✅     |

---

## FRENTE B — Pulso Operacional (5 dias)

### Conceito

Score 0-100 que detecta automaticamente o ritmo do restaurante:

| Estado         | Score  | Descrição                  |
| -------------- | ------ | -------------------------- |
| `FLOW_ALTO`    | 70-100 | Pico — foco em velocidade  |
| `FLOW_PARCIAL` | 30-69  | Normal — equilíbrio        |
| `FLOW_BASE`    | 0-29   | Calmo — tarefas de preparo |

### B.0 Core Engine (2-3h) ✅ `5f904d6c`

Criar `core-engine/pulse/`:

- ✅ `PulseState.ts` — Tipos: `PulseScore`, `PulseZone`, `PulseSnapshot`
- ✅ `PulseConfig.ts` — Thresholds configuráveis por restaurante
- ✅ `OperationalPulse.ts` — Cálculo puro: `(activeOrders, ordersLast30m, capacity, hourOfDay) → PulseSnapshot`
- ✅ `tests/unit/pulse/OperationalPulse.test.ts` — 20 cenários (5 describes)

**Fórmula:**

```
orderPressure = activeOrders / declaredCapacity × 50
flowRate = ordersLast30min / peakBaseline × 30
timeBias = hourCurve[hour] × 20
pulse = clamp(orderPressure + flowRate + timeBias, 0, 100)
```

### B.1 React Hook + Provider (4-6h) ✅ `9bc2e05`

Criar `merchant-portal/src/core/pulse/`:

- ✅ `usePulse.ts` — Hook puro com interval refresh, zone tracking
- ✅ `PulseProvider.tsx` — Context provider com dados do OrderReader
- ✅ `PulseIndicator.tsx` — Badge (🔴🟡🟢) com animação CSS
- ✅ `index.ts` — Barrel exports

### B.2 Integração Tarefas (1 dia) — ✅ `11258f3`

- ✅ `EventTaskGenerator`: `adjustPriorityForPulse()` — prioridade dinâmica
- ✅ `RecurringTaskEngine`: `shouldSuppressForPulse()` + `suppressNonUrgent()`
- ✅ `PulseProvider`: emite `METABOLIC_PULSE_LOGGED` no SystemBus
- ✅ 27/27 testes unitários (self-contained pure logic)

### B.3 Integração Contexto (2 dias) — ✅ `b7f86e9`

- ✅ `ContextLogic`: `resolveOperationalMode()` mapeia zone→rush/tower/calmo
- ✅ `ContextEngine`: injeta `pulseZone` via `usePulseOptional()`
- ✅ `useOperationalKernel`: expõe `pulse { score, zone }` no `OperationalState`
- ✅ `OwnerDashboard`: badge colorido (🔴🟡🟢) em ambas variantes
- ✅ Corrige imports B.2: useEffect, SystemEvents, PulseZone
- ✅ 16/16 testes (PulseContextIntegration.test.ts)

### B.4 Gamificacao + Analytics (1 dia) — ✅ `3b9f888`

- ✅ `GamificationService`: XP bonus em FLOW_ALTO
- ✅ `TaskAnalytics`: correlacao pulse x task completion rate
- ✅ Historico: grafico de pulse ao longo do turno
- ✅ 12/12 testes unitarios (PulseGamificationAnalytics.test.ts)

---

## FRENTE C — Hardening (3 dias)

### C.1 Testes E2E Críticos (1 dia) — ✅

- Fluxo completo: login → abrir turno → criar pedido → pagar → fechar turno
- Smoke test Docker stack (7 serviços healthy)
- Teste de fallback offline

### C.2 Error Boundaries (4h) — ✅

- `ErrorBoundary` global no App.tsx
- Fallback UI por módulo (pedidos, cozinha, caixa)
- Log de erros no EventStore com hash chain

### C.3 Observabilidade (4h) — ✅

- Health endpoint consolidado (`/api/health`)
- Métricas: uptime, latência DB, orders/min
- Alertas: turno aberto > 14h, caixa diferença > R$50

### C.4 Documentação Operacional (4h) — ✅

- Runbook de deploy (passo-a-passo)
- Troubleshooting: 10 problemas mais comuns
- Guia do operador (PDF para imprimir no restaurante)

---

## Timeline

```
Semana 1 (Dias 1-3):
  ├─ Dia 1: Frente A completa + B.0 (core engine)
  ├─ Dia 2: B.1 (hook + provider + indicator)
  └─ Dia 3: B.2 (integração tarefas)

Semana 2 (Dias 4-6):
  ├─ Dia 4-5: B.3 (integração contexto)
  └─ Dia 6: B.4 (gamificação + analytics)

Semana 3 (Dias 7-9):
  ├─ Dia 7: C.1 (E2E críticos)
  ├─ Dia 8: C.2 + C.3 (error boundaries + observabilidade)
  └─ Dia 9: C.4 (docs operacionais)
```

**Total: 9 dias úteis → ~80% product readiness**

---

## Critérios de Conclusão

| Marco               | Critério                                        | Status |
| ------------------- | ----------------------------------------------- | ------ |
| Frente A done       | 0 secrets no git, Keycloak `start --optimized`  | ✅     |
| Frente B done       | Pulse visível no header, tasks reagem ao score  | ✅     |
| Frente C done       | E2E pass, error boundaries ativos, docs prontas | ✅     |
| Pendências P.1-P.5  | Secrets, pipeline, keycloak, runner, billing DB | ✅     |
| **Ready for Pilot** | A+B+C+P concluídos, deploy prep + seed prontos  | ✅     |

---

## Pendencias de Prontidao (Auditoria) ✅ TODAS CONCLUÍDAS

### P.1 Secrets no Git (2h) ✅

- ✅ Chaves Stripe removidas de todos os arquivos versionados
- ✅ Prefixos redacted em docs de segurança
- ✅ Scripts de audit agora exigem `${STRIPE_SECRET_KEY:?}` (sem default)
- Validação: `grep -rn 'sk_test_51SgVOw' .` → 0 resultados

### P.2 Deploy Pipeline Real (2-5 dias) ✅ já existia

- ✅ Pipeline completa em `.github/workflows/deploy.yml` (203 linhas)
- 6 fases: Build → Docker (GHCR) → Frontend (Vercel) → Migrate → Backend (SSH) → Smoke Test
- Trigger: `push tags: "v*"`, Environment: `production`
- Secrets configurados: `DATABASE_URL`, `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `VERCEL_TOKEN`, etc.

### P.3 Keycloak Producao (1 dia) ✅ já existia + hardening

- ✅ `docker-compose.prod.yml`: `start --import-realm --optimized` (não `start-dev`)
- ✅ Prod: env vars obrigatórios com `${:?}`, TLS, resource limits
- ✅ Dev: removido `admin/admin` default — agora exige `.env`

### P.4 Migration Runner (1 dia) ✅ já existia

- ✅ `scripts/migrate.ts` (191 linhas) — runner completo
- Tabela `schema_migrations` com tracking de checksums
- Execução transacional com `BEGIN/COMMIT/ROLLBACK`
- Modos: `--status`, `--dry-run`, aplicação em ordem lexicográfica

### P.5 Billing State no DB (4h) ✅

- ✅ Migração `20260207_01_merchant_subscriptions.sql` já criada
- ✅ Removido fallback JSON de `subscription-management-server.ts`
- Agora DB-only: se não encontrar registro, lança erro com instrução de migração
