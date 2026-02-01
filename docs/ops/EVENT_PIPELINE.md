# Pipeline de eventos — gm_audit_logs (G1 Onda 3)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [EVENT_TAXONOMY.md](../architecture/EVENT_TAXONOMY.md) · [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) · [DASHBOARD_METRICS.md](./DASHBOARD_METRICS.md)  
**Propósito:** Como consumir eventos de `gm_audit_logs` para dashboards externos (Grafana/Sentry) ou interno. G1 Onda 3.

---

## 1. Visão geral

Os eventos da trilha de auditoria (login, pedidos, pagamentos, caixa, turnos, etc.) são persistidos em `gm_audit_logs`. Podem ser consumidos por:

1. **Supabase Realtime** — subscrição a novos INSERT (eventos em tempo quase real).
2. **RPC get_audit_logs** — consulta em batch por tenant, período e filtros.
3. **Worker ou Edge Function** (opcional) — encaminhar eventos para webhook, Sentry ou Grafana.

**RLS:** Subscrições Realtime e RPC respeitam RLS; cada cliente vê apenas eventos dos restaurantes em que é membro (ou eventos com `tenant_id` NULL próprios, conforme política).

---

## 2. Realtime (Supabase)

A tabela `gm_audit_logs` está na publication `supabase_realtime` (migração `20260228160000_g1_audit_logs_realtime.sql`). Novos INSERT são emitidos como eventos Realtime.

### 2.1 Subscrição (cliente autenticado)

```ts
const channel = supabase
  .channel('audit-events')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'gm_audit_logs',
      filter: 'tenant_id=eq.' + restaurantId, // opcional: filtrar por tenant
    },
    (payload) => {
      const row = payload.new;
      // row.event_type, row.action, row.actor_id, row.metadata, row.created_at
      console.log('Audit event:', row.event_type, row.action);
    }
  )
  .subscribe();
```

Sem `filter`, o cliente recebe apenas linhas que passam no RLS (tenant members ou próprios eventos com tenant_id NULL).

### 2.2 Uso típico

- **Dashboard interno:** UI que mostra stream de eventos do tenant (últimos N eventos).
- **Agregador:** Worker ou Edge Function que subscreve e reenvia para fila, webhook ou sistema externo (Grafana Loki, Sentry, etc.).

---

## 3. Consulta em batch (get_audit_logs)

Para períodos históricos e filtros, usar o RPC:

**Chamada:** `get_audit_logs(p_restaurant_id, p_from, p_to, p_event_type, p_action, p_limit)`

Ver [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md) para parâmetros e formato de retorno.

**Exemplo:**

```ts
const { data } = await supabase.rpc('get_audit_logs', {
  p_restaurant_id: restaurantId,
  p_from: '2026-02-01T00:00:00Z',
  p_to: '2026-02-01T23:59:59Z',
  p_event_type: 'login_failure',
  p_action: null,
  p_limit: 100,
});
```

---

## 4. Encaminhar para Grafana / Sentry (opcional)

- **Sentry:** Edge Function ou worker que subscreve a `gm_audit_logs` (ou consulta periódica) e envia eventos de falha (ex.: `login_failure`, `payment_recorded` com result=failure) para Sentry como breadcrumbs ou eventos.
- **Grafana / Loki:** Worker que subscreve (ou faz polling) e envia cada evento como log para Loki; depois criar dashboards e alertas no Grafana.
- **Webhook:** Edge Function que, em cada INSERT em `gm_audit_logs` (via Database Webhook ou Realtime), faz POST para URL configurável (ex.: Zapier, Make, endpoint interno).

A implementação concreta depende do stack (Supabase Edge Functions, worker externo, etc.); este doc define o ponto de partida (Realtime + get_audit_logs).

---

## 5. Referências

- [EVENT_TAXONOMY.md](../architecture/EVENT_TAXONOMY.md) — eventos emitidos
- [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) — especificação da trilha
- [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md) — RPC get_audit_logs
- [DASHBOARD_METRICS.md](./DASHBOARD_METRICS.md) — métricas e painéis sugeridos
- Migração: `supabase/migrations/20260228160000_g1_audit_logs_realtime.sql`
