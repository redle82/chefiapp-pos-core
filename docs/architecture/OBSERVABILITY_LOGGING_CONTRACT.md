# Observability — Logging Contract (Fase 2, 1000-ready)

**Objetivo:** Logs centralizados e rastreáveis por restaurante e dispositivo. Ver problemas antes do cliente.

**Status:** OBRIGATÓRIO para Fase 2 (Observabilidade).  
**Autoridade:** [core/logger](../../merchant-portal/src/core/logger/) — Logger central; código operacional (core-boundary, fluxos críticos) usa Logger, não `console.*` para erros/avisos operacionais.

---

## Regra

1. **Logger central:** Usar o módulo `core/logger` (Logger / logger) para avisos e erros operacionais. Não usar `console.log` / `console.warn` / `console.error` em código de produção para operações ou falhas que importem para diagnóstico.
2. **Contexto por pedido:** Cada log relevante deve incluir, quando existir:
   - **restaurant_id** (ou `tenantId` no contexto do Logger)
   - **device_id** (quando em contexto de dispositivo: TPV, KDS, instalado)
3. **Formato:** O Logger emite `timestamp`, `level`, `message`, `data` (dados do evento), `meta` (contexto: sessionId, tenantId, url, etc.). Em produção pode ser JSON por linha; em dev, prefixo por nível e tenant.
4. **Destinos:** Em dev, consola; em produção, consola (JSON) e, quando configurado, ingestão remota (ex.: app_logs) e/ou Sentry para erro/critical. Ver [Logger.ts](merchant-portal/src/core/logger/Logger.ts).

---

## Uso

- **Com contexto de restaurante:** Passar `restaurant_id` em `data` na chamada, ex.:  
  `Logger.warn("Tarefa por pedido não criada", { restaurant_id: restaurantId, error: err });`  
  O Logger usa `data.restaurant_id` para a coluna `restaurant_id` na ingestão remota quando não há `tenantId` no contexto global.
- **Com contexto de dispositivo:** Incluir `device_id` em `data` ou definir `Logger.setContext({ tenantId, deviceId })` antes do fluxo.
- **Erros:** `Logger.error(message, error, { restaurant_id, device_id })` para que incident response tenha sempre tenant e dispositivo.

---

## O que não fazer

- Não usar `console.log`/`warn`/`error` para falhas de escrita ao Core, Device Gate, criação de pedido, tarefas pós-pedido, etc.
- Não logar sem contexto de tenant quando o fluxo tiver `restaurant_id` disponível.

---

## Referências

- [Logger.ts](../../merchant-portal/src/core/logger/Logger.ts) — Implementação e ingestão remota.
- [OBSERVABILITY_MINIMA.md](../strategy/OBSERVABILITY_MINIMA.md) — Logs do Core (containers), saúde Postgres/PostgREST.
