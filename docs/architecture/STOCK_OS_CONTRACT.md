# STOCK_OS_CONTRACT — Modelo de stock operacional ligado ao serviço

> Contrato conceptual para o módulo de stock do ChefIApp™ OS, focado em **stock operacional** (ligado ao serviço) e não em ERP/contabilidade completa.

---

## 1. Objetivo

- Garantir que o stock:
  - está ligado ao fluxo real de pedidos (`gm_orders` / `gm_order_items`);
  - suporta alertas e tasks de risco operacional;
  - alimenta dashboards e monitor de risco com métricas úteis.
- Definir **fronteira clara** entre:
  - o que é responsabilidade do ChefIApp™ OS;
  - o que permanece num ERP/POS fiscal/sistema externo.

---

## 2. Modelo conceptual

### 2.1. Entidades principais

1. **Produto de venda**
   - O que aparece no TPV/KDS/Web como artigo vendável.
   - Ex.: “Hambúrguer da Casa”, “Gin Tónico”, “Café”.

2. **Item de stock**
   - Unidade física controlada no armazém/cozinha/bar.
   - Ex.: “Carne moída kg”, “Pão brioche un”, “Garrafa de gin 1L”, “Cápsula de café”.

3. **Ficha técnica (receita)**
   - Relaciona produto de venda ↔ itens de stock.
   - Ex.: “Hambúrguer da Casa” consome:
     - 0.18 kg de “Carne moída kg”;
     - 1 un de “Pão brioche un”;
     - 0.02 kg de “Queijo cheddar kg”.

4. **Movimento de stock**
   - Qualquer alteração de quantidade de um item de stock.
   - Ex.: entrada de compra, saída por venda, ajuste por inventário, desperdício.

5. **Compra/fornecedor** (opcional/roadmap)
   - Registo de fatura/guia ligada a movimentos de entrada.

### 2.2. Relação com pedidos

- Cada `gm_order_item` representa uma unidade vendida de “produto de venda”.
- Via ficha técnica, cada unidade vendida:
  - gera um conjunto de movimentos de stock `OUT` (saída) associados a 1+ `stock_item_id`.
- Opcionalmente, pode existir:
  - um processo batch para consolidar movimentos;
  - ou geração direta on-the-fly no momento do “fecho”/“preparação”.

---

## 3. Responsabilidades do ChefIApp™ OS vs ERP externo

### 3.1. Responsabilidades do OS

O ChefIApp™ OS é responsável por:

- Representar **stock operacional**:
  - itens críticos para o serviço (cozinha/bar);
  - quantidades mínimas por item (`min_quantity`);
  - alertas de risco (`ESTOQUE_CRITICO`, `RUPTURA_PREVISTA`).
- Ligar vendas a consumo:
  - via fichas técnicas;
  - via movimentos automáticos por venda.
- Expor métricas operacionais:
  - stock crítico atual;
  - tendência de consumo por produto/ingrediente;
  - alertas de risco de stock em dashboards/Monitor de Risco.

### 3.2. O que fica fora (ERP/contabilidade)

O ChefIApp™ OS **não substitui**:

- ERP de compras / contabilidade:
  - gestão completa de fornecedores;
  - condições comerciais complexas, impostos, faturas;
  - reconciliação contabilística.
- POS fiscal:
  - emissão de documentos legais,
  - envio para autoridade tributária.
- Sistemas de inventário de armazém de hotel/cadeia em escala industrial.

Integrações futuras podem:

- ler movimentos agregados do OS;
- enviar resumos para ERP;
- mas este contrato mantém o escopo do OS focado em **operações ligadas ao serviço**.

---

## 4. Integração com Task Engine

O módulo de stock deve alimentar o `gm_tasks` com eventos relevantes.

### 4.1. Tipos de tasks de stock (mínimo)

- `ESTOQUE_CRITICO`
  - Disparado quando `current_quantity <= min_quantity`.
  - Contexto:
    - `stock_item_id`
    - quantidade atual
    - quantidade mínima

- `RUPTURA_PREVISTA`
  - Disparado quando projeção de consumo indica que:
    - o item vai abaixo de `min_quantity` num horizonte curto (ex.: próximas X horas/turnos).
  - Requer histórico mínimo de consumo (rolling window).

- `ESTOQUE_INVERSO`
  - Disparado quando há:
    - movimentos negativos incoerentes,
    - stock abaixo de zero,
    - ou diferenças significativas entre consumo esperado vs registado.

### 4.2. Critérios de disparo (exemplos)

- `ESTOQUE_CRITICO`:
  - verificado:
    - após cada movimento de stock;
    - e/ou periodicamente (job cron).

- `RUPTURA_PREVISTA`:
  - job periódico (ex.: a cada 15 min);
  - calcula consumo médio por item e projeta.

- `ESTOQUE_INVERSO`:
  - detetado quando:
    - `current_quantity < 0`;
    - ou variação > X% entre consumo esperado (via fichas técnicas) e movimentos registados.

### 4.3. Integração com UI

- Tasks de stock devem:
  - aparecer no Monitor de Risco;
  - ser filtráveis por `task_type` relacionada a stock;
  - poder ser marcadas como resolvidas com um comentário (ex.: “compra recebida”, “ajuste feito”).

---

## 5. Pontos de observabilidade

### 5.1. Métricas de stock para dashboards

Por restaurante (`restaurant_id`), o OS deve conseguir expor:

- `critical_stock_items_count`
  - nº de itens onde `current_quantity <= min_quantity`.

- `stock_risk_score`
  - índice sintético (0–100) baseado em:
    - nº de itens críticos;
    - nº de tasks abertas de stock;
    - presença de itens com `current_quantity < 0`.

- `top_n_consumption_items`
  - lista de N itens mais consumidos num período;
  - baseada em movimentos `OUT` ligados a vendas.

- `waste_quantity` / `waste_cost` (se modelado)
  - quantidades e custo de movimentos de tipo `DESPERDICIO`.

### 5.2. Integração com Monitor de Risco

- Painel de risco deve poder mostrar:
  - cards de stock por unidade com `critical_stock_items_count` e `stock_risk_score`;
  - lista de tasks de stock abertas;
  - sugestões de ação (ex.: “Rever compra de X”, “Rever ficha técnica de Y”).

---

## 6. Considerações de implementação (não exaustivas)

- Consistência de unidade:
  - todas as quantidades devem ser armazenadas em unidade base estável (ex.: kg, L, un);
  - conversões (ex.: caixas → unidades) devem ser explícitas em configuração.

- Performance:
  - movimentos de stock podem ser muitos; preferir:
    - views agregadas/materialized para dashboards;
    - jobs periódicos para projeções de `RUPTURA_PREVISTA`.

- Precisão vs simplicidade:
  - primeira versão pode:
    - focar apenas em `ESTOQUE_CRITICO` com base em `current_quantity` e `min_quantity`;
    - deixar projeções e desperdício para iterações futuras.

---

## 7. Uso deste contrato

Antes de implementar features de stock:

1. Confirmar se cenário pertence ao **escopo operacional** (e não a ERP/contabilidade).
2. Verificar se as entidades necessárias já existem:
   - `stock_items`, `stock_movements`, `recipes` (se aplicável).
3. Definir, para cada nova feature:
   - que tasks de stock pode/ deve gerar;
   - que métricas de observabilidade alimenta.

Alterações que estendam o escopo (ex.: compras complexas, múltiplos armazéns, centros de custo) devem resultar numa **extensão deste contrato** com marcação clara de “Roadmap / Avançado”, para não quebrar o foco operacional atual.

