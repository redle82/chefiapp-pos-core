# Monitorização e saúde do Core

Resumo dos indicadores de saúde e uptime disponíveis ao dono do restaurante e referências para alertas em produção.

---

## Health check do Core

- **Endpoint:** `GET /rest/v1/` (ou `/health` se existir no Core) — resposta 200 = Core acessível.
- **No merchant-portal:** O cliente usa `useCoreHealth()` e `checkCoreHealth()` (core/infra/coreClient) para determinar se o Core está UP/DOWN/UNKNOWN.
- **Scripts:** `scripts/core/health-check-core.sh` — valida que o Core local responde.

---

## Indicadores na UI

| Componente | Onde | Quando mostra |
|------------|------|----------------|
| **OfflineIndicator** | App.tsx, StaffAppShellLayout | Quando `navigator.onLine === false` ou Core DOWN. Mensagem: "Modo offline — as alterações serão sincronizadas quando a ligação voltar." |
| **CoreUnavailableBanner** | App.tsx (BillingsPreloader) | Quando `runtime.coreMode === "offline-erro"` (Core inacessível). Oculto em /op/tpv e /op/kds (superfícies operacionais). |
| **CoreStatusBanner** | Onde for usado | Estado do Core (online/offline). |
| **HealthDashboardPage** | Rotas operacionais | Dashboard de saúde do restaurante (quando a rota estiver ativa). |

O dono vê o OfflineIndicator e o CoreUnavailableBanner quando a rede ou o Core falham; em TPV/KDS o indicador offline continua visível para que o operador saiba que as alterações serão sincronizadas.

---

## PgBouncer e connection pooling

Para escalar e reduzir conexões ao PostgreSQL, usar PgBouncer à frente do Postgres. Configuração e alertas em produção:

- **Doc:** [docs/ops/PGBOUNCER.md](PGBOUNCER.md)
- **Alertas recomendados:** Health check do Core falhar de forma prolongada; número de conexões no Postgres próximo de `max_connections`.

---

## Alertas em produção

- Configurar monitorização (Sentry, Datadog ou equivalente) para:
  - Falha prolongada do health check do Core (`/rest/v1/`).
  - Aumento anómalo de erros 5xx ou timeout nos pedidos ao Core.
- Runbook: reinício do PgBouncer, escalar pool ou aumentar `max_connections` no Postgres — ver PGBOUNCER.md.
