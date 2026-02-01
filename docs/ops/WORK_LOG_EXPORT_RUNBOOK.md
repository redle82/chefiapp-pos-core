# Como solicitar o export de work log (DPO / Admin)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [WORK_LOG_EXPORT.md](../architecture/WORK_LOG_EXPORT.md) · Onda 2 B1  
**Público:** Equipa legal/DPO, Owner/Manager do restaurante.

---

## 1. O que é

O export de work log contém, para um restaurante e um período:

- **Utilizadores** com atividade no período (user_id, role).
- **Turnos (shifts):** sessões de trabalho (check-in/check-out) em `turn_sessions`.
- **Check-in / Check-out:** eventos de entrada e saída derivados dos turnos.
- **Tarefas:** v1 devolve array vazio (a preencher em versões futuras).

Formato: JSON conforme [EXPORT_FORMATS.md](../architecture/EXPORT_FORMATS.md) (schema_version `work_log_v1`).

---

## 2. Quem pode pedir

Apenas **Owner** ou **membro ativo** do restaurante. Cada pedido é registado na trilha de auditoria (`gm_audit_logs`, event_type `export_requested`).

---

## 3. Como solicitar (API)

Chamar o RPC com o ID do restaurante e o intervalo (datas em UTC):

```ts
const { data, error } = await supabase.rpc('get_work_log_export', {
  p_restaurant_id: 'uuid-do-restaurante',
  p_from: '2026-01-01T00:00:00Z',
  p_to: '2026-01-31T23:59:59Z'
});
// data = objeto JSON (schema_version, tenant_id, period, users, shifts, check_ins, tasks)
// Gravar data como ficheiro .json ou converter para CSV no cliente
```

### Exemplo curl (REST)

```bash
curl -X POST 'https://<PROJECT>.supabase.co/rest/v1/rpc/get_work_log_export' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "p_restaurant_id": "<UUID>",
    "p_from": "2026-01-01T00:00:00Z",
    "p_to": "2026-01-31T23:59:59Z"
  }'
```

---

## 4. Interpretar o resultado

- **period:** intervalo pedido (start/end em ISO 8601 UTC).
- **generated_at:** data/hora de geração do export (UTC).
- **export_id:** identificador único do export (para rastreabilidade).
- **users:** lista de { user_id, role } com atividade no período.
- **shifts:** lista de turnos (shift_id, user_id, start, end, status, role_at_turn, operational_mode, device_id).
- **check_ins:** lista de eventos { event_type: 'check_in'|'check_out', user_id, timestamp, session_id } ordenados por timestamp.
- **tasks:** v1 = [].

Para converter para CSV: usar as chaves do JSON como colunas (uma folha por categoria: users, shifts, check_ins) e gravar com encoding UTF-8 e separador vírgula, conforme [EXPORT_FORMATS.md](../architecture/EXPORT_FORMATS.md).

---

## 5. Auditoria

Pedidos de export ficam registados em `gm_audit_logs` com `event_type = 'export_requested'`. Para listar: usar o RPC `get_audit_logs` com `p_event_type = 'export_requested'` (ver [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md)).

---

**Referências:** [WORK_LOG_EXPORT.md](../architecture/WORK_LOG_EXPORT.md) · [EXPORT_FORMATS.md](../architecture/EXPORT_FORMATS.md) · [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md)
