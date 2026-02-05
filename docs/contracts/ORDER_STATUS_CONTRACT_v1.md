# ORDER Status Contract — v1.0

**Constituição de estado para a entidade ORDER.**
Fonte única da verdade para KDS, OrderReader, RPCs e simulador.
Compatível com PostgREST + Docker Core; sem mudar stack.

---

## Princípios (não negociáveis)

1. Todo status é normalizado em **UPPERCASE** antes de qualquer filtro ou lógica.
2. Nenhum status desconhecido quebra a UI.
3. O KDS **nunca** filtra silenciosamente: desconhecido aparece com badge de alerta.
4. Estados activos ≠ estados terminais; classificação é explícita.
5. Status é fonte da verdade, não heurística de tempo.

---

## 1. Enum ORDER (única lista válida)

| Status      | Significado                       | Tipo        |
| ----------- | --------------------------------- | ----------- |
| `CREATED`   | Pedido criado, ainda não aberto   | Transitório |
| `OPEN`      | Activo, itens a serem adicionados | Activo      |
| `PREPARING` | Em preparação                     | Activo      |
| `IN_PREP`   | Em cozinha/bar                    | Activo      |
| `READY`     | Pronto (até confirmação humana)   | Activo      |
| `SERVED`    | Entregue ao cliente, fim do fluxo | Terminal    |
| `CANCELLED` | Anulado                           | Terminal    |
| `FAILED`    | Falha (deve logar causa)          | Terminal    |
| `ARCHIVED`  | Arquivado (só rotina automática)  | Terminal    |

### LEGACY (compatibilidade com Core actual)

- **`CLOSED`** — Alias transitório de **SERVED**. Classificado como **TERMINAL**. Permitido apenas durante migração; estado “real” do domínio é SERVED. Deprecated.

---

## 2. Classificação por tipo

**ACTIVE_ORDER_STATUSES (KDS mostra):**

- `OPEN`, `PREPARING`, `IN_PREP`, `READY`

**TERMINAL (KDS não mostra):**

- `SERVED`, `CANCELLED`, `FAILED`, `ARCHIVED`
- Legacy: `CLOSED` (tratado como terminal)

**Transitório / sistema:**

- `CREATED` — nunca aparece no KDS.

---

## 3. Regras duras

- **CREATED** nunca aparece no KDS.
- **READY** continua activo até confirmação humana (ex.: SERVED).
- **ARCHIVED** só pode ser setado por rotina automática (cron / RPC interno).
- **FAILED** é terminal e deve logar causa.
- **CLOSED** (legacy) é terminal; em novo código usar SERVED.

---

## 4. Normalização (obrigatória)

Antes de qualquer filtro ou lógica, em todo o sistema:

- **Core / SQL:** `UPPER(TRIM(status))`
- **Frontend / OrderReader:** `status?.toUpperCase().trim() ?? ''`

Nenhum lugar do sistema pode trabalhar com status “cru” (lowercase ou com espaços).

---

## 5. Estados desconhecidos (blindagem)

Se o Core devolver um valor fora do enum (ex.: `WAITING_PAYMENT`):

- **Normalizar** com a regra acima.
- **Classificar** como **UNKNOWN** (não é ACTIVE nem TERMINAL conhecido).
- **Mostrar no KDS** com badge ⚠️ e texto de alerta (ex.: “Status desconhecido”).
- **Log obrigatório** (parte do contrato, não opcional):

```
[WARN][ORDER_STATUS_CONTRACT]
order_id=<uuid>
raw_status=<valor bruto>
normalized_status=UNKNOWN
source=OrderReader
```

**Semântica de UNKNOWN:**

- UNKNOWN **não é** ACTIVE. É exibido por **segurança operacional** (o operador vê que algo está fora do esperado).
- UNKNOWN **nunca** entra em métricas de produção nem em contagens de “pedidos activos”.
- Aparece no KDS com semântica de **alerta**, não de fluxo normal.

---

## 6. Comportamento do KDS (regra de ouro)

Pedido **só sai** do KDS quando o status passa a **TERMINAL**.

- `READY` → continua visível.
- `SERVED` (ou `CLOSED`) → sai.
- `CANCELLED` → sai.
- `FAILED` → sai (com badge / log se ainda visível em transição).
- Status **UNKNOWN** → permanece visível com badge ⚠️ até correcção ou transição para terminal.

---

## 7. RPCs e responsabilidades (Core)

- **create_order_atomic** → retorna ordem com status `OPEN`.
- **update_order_status** — única forma legítima de mudar status (frontend nunca inventa estado).
- **mark_item_ready** — marca item; pode influenciar estado derivado do pedido.

Regra: só RPC (ou rotina autorizada) altera status; toda a mudança deve poder ser registada em `order_events` (quando existir).

---

## 8. Tabela order_events (recomendado)

Esquema leve para replay, debug e simulador:

```sql
order_events (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES gm_orders(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor TEXT,  -- 'TPV' | 'KDS' | 'SYSTEM'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Implementação em fase opcional (após validação do contrato em doc + frontend + checklist).

---

## 9. Contrato do OrderReader (frontend)

- **ACTIVE_ORDER_STATUSES** = `['OPEN','PREPARING','IN_PREP','READY']`.
- **TERMINAL_ORDER_STATUSES** = `['SERVED','CANCELLED','FAILED','ARCHIVED','CLOSED']` (CLOSED por compatibilidade).

Regra extra: se o status normalizado não está em ACTIVE nem em TERMINAL, tratar como **UNKNOWN**: incluir na lista devolvida ao KDS com flag (ex.: `_unknownStatus: true`), mostrar no KDS com badge e **logar** no formato canónico acima.

---

## Referências

- OrderReader: `merchant-portal/src/core-boundary/readers/OrderReader.ts`
- KDS: `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`
- RPC: `docker-core/schema/rpc_update_order_status.sql`
- Schema: `docker-core/schema/core_schema.sql` (`gm_orders.status`)
- Checklist QA: `docs/strategy/CHECKLIST_KDS_FLUXO.md`
