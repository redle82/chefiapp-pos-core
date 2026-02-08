# Consulta à trilha de auditoria (DPO / Admin)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) · Onda 2 A3  
**Público:** Equipa legal/DPO, Owner/Manager do restaurante.

---

## 1. Acesso

- **Quem pode consultar:** Apenas utilizadores autenticados que sejam **Owner** ou **membro ativo** (não desativado) do restaurante.
- **Filtro obrigatório:** Sempre por tenant (`restaurant_id`). Não é possível consultar logs de outros restaurantes.

---

## 2. RPC `get_audit_logs`

Endpoint consultável para a trilha de auditoria, com filtros por tenant, período, tipo de evento e ação.

### Parâmetros

| Parâmetro         | Tipo        | Obrigatório | Descrição |
|-------------------|-------------|-------------|-----------|
| `p_restaurant_id` | UUID        | Sim         | ID do restaurante (tenant). |
| `p_from`          | TIMESTAMPTZ | Não         | Início do intervalo (inclusivo). |
| `p_to`            | TIMESTAMPTZ | Não         | Fim do intervalo (inclusivo). |
| `p_event_type`    | TEXT        | Não         | Filtrar por `event_type` (ex.: `order_created`, `payment_recorded`, `user_disabled`). |
| `p_action`        | TEXT        | Não         | Filtrar por `action` (ex.: `ORDER_CREATED`, `PAYMENT_RECORDED`). |
| `p_limit`         | INT         | Não         | N.º máximo de linhas (default 500; máximo 2000). |

### Colunas devolvidas

| Coluna           | Tipo        | Descrição |
|------------------|-------------|-----------|
| `id`             | UUID        | Identificador do evento. |
| `tenant_id`      | UUID        | Restaurante. |
| `actor_id`       | UUID        | Quem realizou a ação (pode ser NULL em eventos de sistema). |
| `actor_type`     | TEXT        | `user` \| `system` \| `support_admin`. |
| `action`         | TEXT        | Ação (ex.: `ORDER_CREATED`, `PAYMENT_RECORDED`). |
| `resource_entity`| TEXT        | Tipo de recurso (ex.: `order`, `payment`, `member`). |
| `resource_id`    | TEXT        | ID do recurso. |
| `metadata`       | JSONB       | Detalhes adicionais (ex.: `short_id`, `amount_cents`). |
| `event_type`     | TEXT        | Categoria do evento (ex.: `order_created`, `payment_recorded`). |
| `result`         | TEXT        | Ex.: `success`, `failure`. |
| `created_at`     | TIMESTAMPTZ | Data/hora UTC do evento. |

### Exemplo (Supabase client)

```ts
const { data, error } = await supabase.rpc('get_audit_logs', {
  p_restaurant_id: 'uuid-do-restaurante',
  p_from: '2026-02-01T00:00:00Z',
  p_to: '2026-02-01T23:59:59Z',
  p_event_type: 'payment_recorded',  // opcional
  p_action: null,                       // opcional
  p_limit: 500
});
```

### Exemplo (curl / REST)

```bash
curl -X POST 'https://<PROJECT>.supabase.co/rest/v1/rpc/get_audit_logs' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "p_restaurant_id": "<UUID>",
    "p_from": "2026-02-01T00:00:00Z",
    "p_to": "2026-02-01T23:59:59Z",
    "p_limit": 500
  }'
```

---

## 3. Consulta direta à tabela (alternativa)

Se o cliente tiver acesso Supabase com RLS, pode ler diretamente `gm_audit_logs` com filtros. A política RLS permite **SELECT** apenas a membros do tenant (`restaurant_id = tenant_id`). Recomenda-se usar o RPC para interface estável e limite de linhas.

---

## 4. Export para auditoria / DSR

Para export em ficheiro (CSV/JSON) ou para cumprir pedidos de acesso (DSR), usar os resultados do RPC e gravar no formato desejado. O formato de export está especificado em [WORK_LOG_EXPORT.md](../architecture/WORK_LOG_EXPORT.md) e [EXPORT_FORMATS.md](../architecture/EXPORT_FORMATS.md).

---

**Referências:** [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) · [DATA_SUBJECT_REQUESTS.md](../architecture/DATA_SUBJECT_REQUESTS.md) · [ONDA_2_TAREFAS_60_DIAS.md](../ONDA_2_TAREFAS_60_DIAS.md)
