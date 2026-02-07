# Plano Unificado de Implementação — ChefIApp POS CORE

> **Versão:** 1.0 · **Data:** 2026-02-07 · **Branch:** `core/frozen-v1` > **Status atual do produto:** ~58% pronto para produção

---

## Visão Geral

Este plano combina **3 frentes**:

1. **Blockers de Produção** — 2 pendências restantes
2. **Pulso Operacional** — novo módulo diferenciador
3. **Hardening Final** — itens para atingir 80%+

---

## FRENTE A — Blockers de Produção (2h)

### A.1 Limpar Chaves Stripe do Git (30min)

| Arquivo                                                           | Linha | Ação                                        |
| ----------------------------------------------------------------- | ----- | ------------------------------------------- |
| `tests/audit-a3-webhook.sh`                                       | 41    | Trocar `sk_test_*` por `$STRIPE_SECRET_KEY` |
| `docs/archive/MERCHANT_ONBOARDING_CHECKLIST.md`                   | 216   | Substituir por `sk_test_XXXX` placeholder   |
| `testsprite_tests/tmp/prd_files/MERCHANT_ONBOARDING_CHECKLIST.md` | 216   | Idem                                        |

**Validação:** `grep -rn 'sk_test_' . --include='*.sh' --include='*.md' | grep -v node_modules` → 0 resultados

### A.2 Keycloak Modo Produção (1h30)

| Item        | Atual                   | Alvo                            |
| ----------- | ----------------------- | ------------------------------- |
| Comando     | `start-dev`             | `start --optimized`             |
| Admin user  | `admin/admin` hardcoded | Env vars `KC_BOOTSTRAP_ADMIN_*` |
| Proxy       | Nenhum                  | `KC_PROXY_HEADERS=xforwarded`   |
| Hostname    | Não definido            | `KC_HOSTNAME` via env           |
| Healthcheck | `/health/ready`         | Manter (já correto)             |

**Validação:** `docker compose up keycloak` inicia sem `start-dev` warning

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

### B.3 Integração Contexto (2 dias)

- `ContextLogic`: `OperationalMode` reage ao pulse (tower↔rush)
- `useOperationalKernel`: expor `pulse` no `OperationalState`
- Dashboard: cards adaptam layout conforme zone

### B.4 Gamificação + Analytics (1 dia)

- `GamificationService`: XP bonus em FLOW_ALTO
- `TaskAnalytics`: correlação pulse × task completion rate
- Histórico: gráfico de pulse ao longo do turno

---

## FRENTE C — Hardening (3 dias)

### C.1 Testes E2E Críticos (1 dia)

- Fluxo completo: login → abrir turno → criar pedido → pagar → fechar turno
- Smoke test Docker stack (7 serviços healthy)
- Teste de fallback offline

### C.2 Error Boundaries (4h)

- `ErrorBoundary` global no App.tsx
- Fallback UI por módulo (pedidos, cozinha, caixa)
- Log de erros no EventStore com hash chain

### C.3 Observabilidade (4h)

- Health endpoint consolidado (`/api/health`)
- Métricas: uptime, latência DB, orders/min
- Alertas: turno aberto > 14h, caixa diferença > R$50

### C.4 Documentação Operacional (4h)

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

| Marco               | Critério                                        |
| ------------------- | ----------------------------------------------- |
| Frente A done       | 0 secrets no git, Keycloak `start --optimized`  |
| Frente B done       | Pulse visível no header, tasks reagem ao score  |
| Frente C done       | E2E pass, error boundaries ativos, docs prontas |
| **Ready for Pilot** | A+B+C concluídos, 1 restaurante testando        |
