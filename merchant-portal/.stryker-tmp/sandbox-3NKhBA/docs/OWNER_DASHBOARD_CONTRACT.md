## Owner Dashboard — Contrato de Produto/UX

### 1. Objetivo

Criar um **Owner Dashboard** que permita ao dono do restaurante, em **até 10 segundos**, responder:

- Estou a ganhar ou a perder dinheiro hoje?
- Onde está o gargalo agora?
- Quem está a segurar o piano / onde a equipa está a falhar?
- Existe algo perigoso a acontecer se eu sair agora?

Este dashboard substitui a necessidade de dezenas de relatórios separados, concentrando **visão, operação, pessoas e risco** numa única tela.

---

### 2. Eixos de Poder

Todo o conteúdo do Owner Dashboard encaixa em **4 eixos**:

1. **Dinheiro agora**
   - Faturação de hoje/semana
   - Número de contas
   - Ticket médio
   - Estado da(s) caixa(s) (aberta/fechada, total teórico)

2. **Motor da operação**
   - Pedidos por estado (OPEN / IN_PREP / READY / PAID / CANCELLED)
   - Tempo médio de preparação/entrega
   - Mesas abertas / em risco
   - Canais (salão, takeaway, delivery) — quando disponíveis

3. **Pessoas e disciplina**
   - Turnos ativos agora
   - Pessoas por função (sala, cozinha, bar)
   - Tarefas críticas em atraso (fecho, checklists, etc.)
   - Erros ligados a pessoas (anulações, descontos atípicos, contas reabertas)

4. **Risco e tendência**
   - Descontos vs faturação
   - Estornos/cancelamentos fora do padrão
   - Diferenças de caixa
   - Tendência de faturação (7/30 dias) — subindo, estável, caindo

---

### 3. Layout Macro (Web)

O Owner Dashboard é pensado para desktop/laptop, com três zonas:

1. **Zona 1 — Cabeçalho de Estado (topo, largura total)**
   - Nome do restaurante + data
   - Estado geral: *Excelente / Estável / Abaixo do normal* (cor verde/amarelo/vermelho)
   - Mini-métricas:
     - Faturação de hoje
     - Nº de contas
     - Ticket médio
     - Ocupação aproximada (mesas ativas / total)

2. **Zona 2 — Grelha 2x2 de painéis principais**

   - **Painel Dinheiro agora**
     - Faturação por faixa horária (manhã, almoço, tarde, jantar)
     - Estado da(s) caixa(s) e totais
     - Comparação com média de dias equivalentes

   - **Painel Motor da operação**
     - Contador de pedidos por estado
     - Tempo médio de preparação
     - Nº de mesas em risco (abertas há mais de X minutos)

   - **Painel Pessoas e disciplina**
     - Turnos ativos e nº de pessoas por função
     - Tarefas críticas: X completas, Y em atraso
     - Destaque simples: colaborador de alta performance / ponto de atenção

   - **Painel Risco e tendência**
     - Descontos hoje vs média
     - Estornos/cancelamentos
     - Indicador de tendência (7/30 dias)
     - Badge de anomalia quando houver regra disparada

3. **Zona 3 — Linha do tempo de eventos (rodapé ou lateral direita)**
   - Feed de eventos importantes:
     - Mesa 12 em atraso há 18 min
     - Caixa Principal com diferença de 23€
     - Pico de pedidos às 13h com tempo médio de 6 min

---

### 4. Cards e Métricas por Fase

#### 4.1 MVP (dados que o Core já sabe hoje)

Apoiado em `gm_orders`, `gm_order_items`, `gm_tables`, `gm_cash_registers`:

- **Faturação de hoje**
  - Soma dos pagamentos confirmados de hoje.
  - Sinal:
    - Verde: ≥ 95% da média de dias equivalentes
    - Amarelo: 80–95%
    - Vermelho: < 80%

- **Ticket médio**
  - Faturação de hoje / nº de contas fechadas hoje.

- **Contas de hoje**
  - Nº de contas fechadas hoje.

- **Estado da caixa**
  - Caixas abertas/fechadas + total teórico.

- **Pedidos em andamento**
  - Nº de pedidos com status diferente de PAID/CANCELLED.
  - Destaque se algum pedido exceder um limite de tempo simples.

- **Mesas em risco**
  - Mesas abertas há mais de X minutos (top 3 em atraso).

- **Alertas de risco simples**
  - Descontos totais do dia acima de um % da faturação.
  - Caixa aberta há mais de N horas.
  - Pedido com tempo absurdamente alto (ex.: > 90 min).

#### 4.2 Fase 2 — Comportamento

- Tempo médio de permanência por mesa.
- Taxa de sobremesa / upsell (% de contas com determinados itens).
- Eficiência de turnos (faturação/tempo por nº de pessoas).

#### 4.3 Fase 3 — Energia / Ritual

- Índice de cumprimento de tarefas de fecho (% de dias com tudo concluído).
- Consistência entre turnos (variação grande em performance para dias semelhantes).
- Índice de saúde operacional acumulada (atrasos recorrentes, falhas de fecho, diferenças de caixa).

---

### 5. Navegação a partir do Owner Dashboard

Cada painel/card tem **1 destino principal** (nada de floresta de links):

- **Dinheiro agora** → vista de *Financeiro diário* (contas do dia, formas de pagamento, fechos de caixa).
- **Motor da operação** → *Operação ao vivo* (pedidos e mesas em tempo real, com filtros mínimos).
- **Pessoas e disciplina** → *Pessoas & turnos* (turnos, presenças, tarefas críticas).
- **Risco e tendência** → *Centro de risco* (linha do tempo de eventos críticos + resumos).

Menu lateral reduzido, visto do Owner:

- Dashboard (esta tela)
- Operação ao vivo
- Pessoas & turnos
- Configuração básica (horários, impostos, métodos de pagamento)

---

### 6. Dados de Suporte (Core)

Entidades do Core que alimentam o Owner Dashboard:

- **Vendas / Operação**
  - `gm_orders` (estado, timestamps, origem)
  - `gm_order_items` (itens, categoria, preço, descontos)
  - `gm_tables` (estado, `opened_at`, `closed_at`)

- **Financeiro**
  - `gm_cash_registers` (aberturas, fechos, totais)
  - `gm_payments` (forma de pagamento, valor)
  - `gm_invoices` (quando houver camada fiscal separada)

- **Pessoas**
  - `gm_employees` / `gm_staff`
  - `gm_shifts` (turnos)
  - `gm_tasks` / `gm_checklists` (tarefas críticas)

- **Risco / Eventos**
  - Logs de descontos e estornos.
  - Reaberturas de contas.
  - Diferenças de caixa registradas.

---

### 7. Pontes com a Implementação Atual

- Já existe um `OwnerDashboard` em `src/pages/AppStaff/OwnerDashboard.tsx` com:
  - Layout em `StaffLayout`.
  - Uso de `DashboardService.getDailyMetrics` para métricas diárias.
  - Widgets de saúde do sistema, rentabilidade, stock baixo e performance da equipa.
- Este contrato serve como **guia de convergência**:
  - Novos cards/widgets devem ser avaliados perguntando: a que eixo de poder pertencem?
  - Backlog de melhorias do Owner Dashboard deve referenciar este documento antes de mexer em rotas/componentes.

