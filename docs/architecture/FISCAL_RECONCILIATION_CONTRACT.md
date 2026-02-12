# FISCAL_RECONCILIATION_CONTRACT — Reconciliação ChefIApp™ OS vs POS fiscal

> Contrato técnico para garantir que o ChefIApp™ atua como **camada de verdade
> operacional** e permite validar se o POS fiscal acompanha o que aconteceu em
> serviço.

---

## 1. Objetivo

- Permitir ao dono / financeiro ver, por turno:
  - quanto o ChefIApp registou como faturado;
  - quanto o POS fiscal emitiu;
  - se existe divergência e qual a causa provável.
- Servir de base para:
  - auditorias internas/externas;
  - confiança em operações multi‑unidade;
  - transição gradual para um cenário pós‑fiscal.

---

## 2. Conceitos básicos

### 2.1. Turno (Shift) para reconciliação

Um **turno** é a janela mínima para reconciliação.

- Definido por:
  - `shift_id` (PK lógica);
  - `restaurant_id`;
  - `device_id` / `terminal_id` (quando aplicável);
  - `opened_at`, `closed_at`.
- Um turno pode agrupar:
  - vários canais (`TPV`, `WEB_PUBLIC`, `APPSTAFF`);
  - vários tipos de pagamento (dinheiro, cartão, etc.).

### 2.2. Totais ChefIApp (operacionais)

Para cada turno, ChefIApp calcula:

- `total_revenue_operational` (soma de `gm_orders.total` pagos no turno);
- `total_orders` (nº de pedidos pagos no turno);
- `breakdown_by_payment_method` (cash, card, outros);
- `breakdown_by_channel` (TPV, Web, Staff).

### 2.3. Totais POS fiscal

Obtidos de três formas possíveis (por implementação):

- API do POS fiscal;
- upload de ficheiro (SAF‑T, CSV, PDF parseado etc.);
- input manual de totais (mínimo viável).

Capturados como **snapshot** com metadados:

- sistema (`pos_system`);
- versão;
- fonte (`API`, `UPLOAD`, `MANUAL`).

---

## 3. Modelo de dados proposto

### 3.1. `gm_fiscal_snapshots`

Capturas de estado do POS fiscal por turno ou intervalo.

- `id` (PK)
- `restaurant_id` (FK)
- `shift_id` (opcional mas recomendado)
- `pos_system` (identificador curto: ex. `foo_pos`, `bar_pos`)
- `source` (`API`, `UPLOAD`, `MANUAL`)
- `payload` (`jsonb`) — dados brutos ou normalizados
- `total_fiscal_cents`
- `total_orders_fiscal`
- `created_at`

### 3.2. `gm_reconciliations`

Resultado consolidado ChefIApp vs POS para um turno.

- `id` (PK)
- `restaurant_id` (FK)
- `shift_id`
- `fiscal_snapshot_id` (FK → `gm_fiscal_snapshots.id`)
- `total_operational_cents`
- `total_fiscal_cents`
- `difference_cents` (`total_fiscal_cents - total_operational_cents`)
- `status` (`OK`, `DIVERGENT`, `PENDING_DATA`)
- `reason_code` (opcional, ex.: `MISSING_ORDERS`, `MANUAL_DISCOUNT`, `ROUNDING`)
- `notes` (texto livre)
- `created_at`
- `reconciled_by` (user id ou referência)

### 3.3. Views auxiliares

- `vw_reconciliation_by_day_and_restaurant`
- `vw_reconciliation_by_shift`

Para consumo em relatórios e dashboards.

---

## 4. Fluxo de reconciliação

### 4.1. Fecho de turno (lado ChefIApp)

1. `SHIFT_CLOSED` (evento no `core_event_log`) é registado com:
   - `shift_id`, `restaurant_id`, `opened_at`, `closed_at`.
2. ChefIApp calcula:
   - `total_operational_cents` a partir de `gm_orders` no intervalo do turno;
   - breakdown por método de pagamento/canal.

### 4.2. Captura de totais fiscais

Dependendo da integração:

- **API**:
  - Uma bridge chama a API do POS com `shift_id`/intervalo e grava um
    `gm_fiscal_snapshots` com `source = 'API'`.
- **UPLOAD**:
  - O utilizador envia ficheiro; um job o interpreta e grava snapshot com
    `source = 'UPLOAD'`.
- **MANUAL**:
  - Interface permite introduzir valores finais; grava snapshot com `source = 'MANUAL'`.

### 4.3. Cálculo de reconciliação

1. Selecionar turno + snapshot correspondente.
2. Calcular `difference_cents`.
3. Atribuir `status`:
   - `OK` se diferença dentro de tolerância (ex.: 0–1 cêntimo por arredondamento).
   - `DIVERGENT` se acima.
   - `PENDING_DATA` se não há snapshot fiscal.
4. Criar `gm_reconciliations` com detalhes.

### 4.4. Eventos ligados

Em paralelo, o sistema deve registar:

- `FISCAL_SYNC_REQUESTED`, `FISCAL_SYNC_CONFIRMED`, `FISCAL_SYNC_FAILED` no
  `core_event_log` (ver `CORE_EVENTS_CONTRACT.md`).

---

## 5. UI — Reconciliação do Turno

Página alvo: extensão de
`merchant-portal/src/pages/Reports/DailyClosingReportPage.tsx`.

### 5.1. Secções mínimas

- Seleção:
  - `Restaurante` (quando multi‑tenant),
  - `Turno` (lista de turnos fechados),
  - ou intervalo de datas.
- Bloco “ChefIApp OS”:
  - `total_operational_cents`,
  - nº de pedidos,
  - breakdown por método de pagamento/canal.
- Bloco “POS Fiscal”:
  - `total_fiscal_cents`,
  - nº de documentos,
  - fonte (`API`, `UPLOAD`, `MANUAL`).
- Resultado:
  - `difference_cents`,
  - `status` (`OK`, `DIVERGENT`, `PENDING_DATA`),
  - campo para `notes`/justificativa.

### 5.2. Estados vazios

- Sem snapshot fiscal:
  - mostrar call‑to‑action para carregar dados (API/upload/manual).
- Sem turno fechado:
  - instruções para fechar turno no TPV primeiro.

---

## 6. Regras e garantias

- Reconciliação é **idempotente**:
  - recalcular para o mesmo turno não deve gerar múltiplas linhas “ativas”
    de `gm_reconciliations` sem motivo; usar `status`/`revision` se necessário.
- ChefIApp nunca altera dados no POS fiscal:
  - apenas lê ou recebe snapshots; qualquer correção fiscal é feita no POS.
- Logs de reconciliação e eventos fiscais devem ser:
  - filtráveis por `restaurant_id` (respeitando `QUERY_DISCIPLINE_CONTRACT.md`);
  - exportáveis para auditoria.

---

## 7. Roadmap de implementação (resumo)

1. Criar migrations para `gm_fiscal_snapshots` e `gm_reconciliations`.
2. Implementar:
   - API/handlers para registar snapshots (por API, upload ou manual).
3. Extender `DailyClosingReportPage` para:
   - mostrar blocos ChefIApp vs POS;
   - permitir criação/edição de reconciliação.
4. Ligar eventos fiscais no `core_event_log` (ver `CORE_EVENTS_CONTRACT.md`).

