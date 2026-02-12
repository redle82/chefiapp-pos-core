# MULTIUNIT_OWNER_DASHBOARD_CONTRACT — Dashboard “olho de dono” multi-unidade

> Contrato funcional e técnico para o dashboard central de dono/grupo com 2–10 casas.

---

## 1. Persona e contexto

- **Persona principal**: dono ou diretor de operações com:
  - 2–10 restaurantes/outlets (restauração independente ou F&B de hotel);
  - pouco tempo operacional (não entra em cada TPV/KDS);
  - preocupação com:
    - faturação diária/semana/mês;
    - vazamentos operacionais (atrasos, desperdício, stock);
    - saúde dos turnos (aberto/fechado, picos, incidentes).

- **Momento de uso**:
  - de manhã (fecho do dia anterior / planeamento do dia);
  - durante o serviço, em mobile/desktop;
  - ao fim do dia/semana, para validar se “o grupo está sob controlo”.

---

## 2. Perguntas que o dashboard deve responder

O dashboard deve ser capaz de responder, num único ecrã, pelo menos a:

1. **“Quem está a faturar quanto hoje?”**
   - Faturação por unidade (dia/semana/mês selecionável).
2. **“Onde estou a perder dinheiro agora?”**
   - Unidades com maior número de tasks críticas / atrasos / stock crítico.
3. **“Quem está sob controlo e quem está em risco?”**
   - Estado operacional por unidade (turno aberto, KDS/TPV online).
4. **“O grupo como um todo está melhor ou pior do que ontem/semana passada?”**
   - Tendência de faturação e de incidentes.
5. **“Se eu tiver 5 minutos, onde devo clicar primeiro?”**
   - Destaque de 3–5 unidades prioritárias, com razão.

---

## 3. Métricas concretas

Cada métrica deve ter:

- **nome canónico**;
- **fórmula** (em termos de tabelas/colunas Core);
- **origem de dados** (tabela/view);
- **escopo** (por `restaurant_id`, por grupo).

### 3.1. Faturação

- `total_revenue_today`
  - Fórmula: soma de `gm_orders.total` para `status in ('paid', 'closed')` no intervalo [início_dia, agora].
  - Agrupamento: por `restaurant_id`, com total de grupo.
  - Fonte: `gm_orders` ou view agregada `vw_revenue_by_restaurant_and_period`.

- `total_revenue_week` / `total_revenue_month`
  - Igual, mudando o intervalo de tempo.

### 3.2. Fluxo de pedidos

- `open_orders_count`
  - Fórmula: contagem de `gm_orders` com `status in ('new','open','in_prep','ready')`.
  - Escopo: por `restaurant_id`.

- `avg_prep_time_active_orders`
  - Fórmula: média de `(now() - created_at)` dos `gm_order_items` não marcados como prontos.
  - Fonte: `gm_order_items` ou view de KDS.

### 3.3. Tasks / risco operacional

- `critical_tasks_count`
  - Fórmula: contagem de `gm_tasks` com `priority = 'CRITICA'` e `status = 'OPEN'`.
  - Escopo: por `restaurant_id`.

- `open_tasks_count`
  - Fórmula: contagem de `gm_tasks` com `status in ('OPEN','ACKNOWLEDGED')`.

### 3.4. Stock crítico (se stock operacional ativo)

- `critical_stock_items_count`
  - Fórmula: contagem de `gm_stock_items` onde `current_quantity <= min_quantity`.

- `stock_risk_score`
  - Índice derivado: função do nº de itens críticos + tasks de stock (`ESTOQUE_CRITICO`, `RUPTURA_PREVISTA`).

### 3.5. Saúde de turno / dispositivos

- `shift_status`
  - Enum: `OPEN`, `PREP`, `CLOSED`, `UNKNOWN`.
  - Fonte: tabela/entidade de turno (`gm_shifts` ou equivalente) ou runtime context.

- `kds_online` / `tpv_online`
  - Boolean derivados:
    - de `RuntimeContext`/heartbeats;
    - ou do último evento de cada dispositivo.

---

## 4. Restrições de queries (disciplina de Core)

Este dashboard **não** deve:

- fazer `select *` em tabelas transacionais com janelas grandes;
- ler diretamente tabelas de eventos brutos sem views agregadas;
- ignorar o contexto de tenant/permissions.

### 4.1. Fontes de dados recomendadas

- Views/materialized views:
  - `vw_revenue_by_restaurant_and_period`
  - `vw_tasks_by_restaurant_and_severity`
  - `vw_stock_risk_by_restaurant`
  - `vw_runtime_health_by_restaurant`

### 4.2. Limites de intervalo

- Todas as queries de faturação:
  - devem receber **intervalo de tempo explícito** (ex.: `from`, `to`);
  - defaults seguros: hoje, última semana, último mês.

- Nenhuma query do dashboard deve tentar:
  - carregar mais de N dias (ex.: 31) de uma vez por restaurante;
  - retornar listas completas de pedidos; apenas agregados.

### 4.3. Multi-tenant / permissões

- O dono do grupo vê **apenas** os `restaurant_id` para os quais:
  - existe `gm_restaurant_members` com `role in ('owner','group_owner','ops_director')`;
  - OU uma tabela de grupos (`gm_groups`) mapeia restaurantes → grupo.

- Um manager local só vê:
  - o seu próprio `restaurant_id`.

---

## 5. Esboço de layout (alto nível)

> Não é CSS; é apenas o shape funcional esperado.

### 5.1. Hierarquia

1. **Header do grupo**
   - Nome do grupo / dono;
   - Filtro de intervalo de tempo (hoje / semana / mês).
2. **Linha de KPIs globais**
   - `total_revenue_period` (grupo)
   - `open_orders_count` (grupo)
   - `critical_tasks_count` (grupo)
   - `critical_stock_items_count` (grupo, se stock ativo)
3. **Grade de unidades (cards por restaurante)**
   - 2–4 colunas, adaptável a desktop/tablet.
4. **Painel de prioridades**
   - Lista de 3–5 unidades em risco com motivo.

### 5.2. Card de unidade (mínimo)

Cada card de `restaurant_id` deve conter:

- Nome da unidade + eventual label (hotel/outlet).
- KPIs locais:
  - faturação do período,
  - nº de pedidos abertos,
  - nº de tasks críticas,
  - nº de itens de stock crítico (se ativo).
- Estado operacional:
  - turno: `OPEN`/`CLOSED`/`UNKNOWN`;
  - `KDS online` / `TPV online` (icon + cor).
- Indicador de tendência simples:
  - ex.: setinha comparando com período anterior.
- CTA única:
  - “Ver detalhe da unidade” → navega para dashboard local.

### 5.3. Painel de prioridades

- Lista ordenada de unidades por:
  - maior `critical_tasks_count`
  - OU `stock_risk_score`
  - OU combinação.
- Cada linha:
  - nome da unidade;
  - razão do risco (ex.: “3 tasks críticas de atraso”, “5 itens de stock em risco”);
  - link para vista detalhada.

---

## 6. Estados vazios e degradação

- Se o utilizador tiver **apenas 1 restaurante**:
  - este dashboard pode degradar para um resumo mais simples,
  - sem dar a sensação de “produto pela metade”.

- Se **não houver stock operacional** configurado:
  - esconder métricas de stock OU mostrar estado “stock avançado ainda não ativado” com link para onboarding.

- Se **não houver tasks** ativas:
  - mostrar estado positivo (“sem incidentes críticos agora”),
  - mantendo coerência com narrativa do Monitor de Risco.

---

## 7. Uso deste contrato

Antes de implementar qualquer dashboard multi-unidade:

1. Validar se todas as métricas aqui descritas são calculáveis com o schema atual;
2. Se faltar alguma, decidir:
   - se se cria view agregada nova;
   - se se simplifica o primeiro MVP do dashboard;
3. Garantir que queries respeitam:
   - limites de intervalo,
   - agregação por restaurante,
   - contexto de permissões multi-tenant.

Qualquer alteração futura (novas métricas, persona diferente, mudança de foco) deve resultar numa **nova versão deste contrato** ou numa secção de “Extensões”, sem quebrar o acordo básico aqui descrito.

