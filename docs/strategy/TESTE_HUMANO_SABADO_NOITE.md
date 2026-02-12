# Teste Humano Real — Sábado à Noite (Restaurante Fictício)

**Objetivo:** Validar UX, fluxos, falhas silenciosas, decisões erradas e pontos de fricção reais.
**Regra:** Usar o sistema como produção — sem exceções, sem bypass, sem uso humano fora do sistema.

---

## Contexto e Regras

### NÃO

- NÃO usar dados mockados irreais
- NÃO usar Supabase como domínio
- NÃO usar "modo trial" especial
- NÃO ignorar falhas (tudo deve aparecer para o humano)

### SIM

- Usar **Docker Core** como fonte única de verdade
- Usar **ORE** (Operational Readiness) como gate absoluto
- Usar Menu Core, TPV, KDS, QR, Tasks, Fiscal, Impressão
- Simular pessoas reais, erros reais, atrasos reais

### Importante

Este exercício **NÃO** é para refatorar código agora. É para **OBSERVAR**. Correções só depois.
Executar passo a passo. Documentar tudo.

---

## Pré-requisitos

- [ ] **Docker Core** a correr (ex.: `make up` em `docker-core/`; verificar `docker ps`).
- [ ] **merchant-portal** a correr em **<http://localhost:5175>** (ex.: `cd merchant-portal && npm run dev`).
- [ ] **Limpar localStorage** de trial/pilot: DevTools → Application → Local Storage → remover `chefiapp_pilot_mode`, `chefiapp_trial_mode` (e opcionalmente `chefiapp_restaurant_id` se for criar restaurante novo).
- [ ] **Auth** real (login) ou fluxo de acesso operacional conforme contrato (sem bypass).
- [ ] **Dispositivos (checklist):** 1 portátil/tablet (TPV), 1 ecrã (KDS), opcional telemóvel (QR). Mínimo 1 pessoa pode alternar janelas.

---

# TAREFA 1 — Criar o Restaurante Fictício (Entidade Canónica)

**Restaurante:** La Última Ola
**Tipo:** Gastrobar / Restaurante
**País:** Espanha | **Moeda:** EUR
**Fiscal:** ativo | **Impressora:** ativa
**Horário:** realista (almoço + jantar)
**Capacidade:** 14 mesas

Criar **via bootstrap e fluxos existentes** (Core). Sem inserts manuais fora da UI/API.

### Passos

1. **Bootstrap** (`/bootstrap`)

   - Garantir que o Core está a responder (BackendType.docker).
   - Nome: **La Última Ola**
   - Tipo: Gastrobar ou Restaurante
   - País/Moeda: **ES** (Espanha / EUR)
   - Submeter. Verificar que não há erro e que redireciona (ex.: `/onboarding/first-product` ou dashboard).
   - Nota: o payload atual do Core pode só incluir name, slug, owner_id, status; country/currency são persistidos na secção **Identidade** do onboarding.

2. **Identidade** (Onboarding ou Config)

   - Completar **Identidade**: país ES, moeda EUR, tipo Gastrobar/Restaurante.
   - Onde for possível: fiscal ativo, impressora ativa (anotar se não houver opção).

3. **Localização**

   - Endereço fictício (ex.: Cidade, código postal).
   - **Capacidade:** 56 (o Core usa `create_tables_from_capacity` com `capacity/4` → 56/4 = **14 mesas**).
   - Guardar. Verificar que as mesas são criadas (ex.: em Config ou listagem de mesas).

4. **Horários**

   - Definir horário realista: almoço (ex.: 12:00–15:00) e jantar (ex.: 19:00–23:00) nos dias desejados.

5. **Verificação**
   - [ ] Restaurante aparece no selector de tenant (se aplicável).
   - [ ] 14 mesas existem no Core (consultar `gm_tables` ou UI de mesas).
   - [ ] Nenhum insert manual em `gm_restaurants` / `gm_tables` fora destes fluxos.

| Onde clicar (rota)                               | O que esperar                                               | Se falhar, anotar                            |
| ------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------- |
| `/bootstrap` → formulário                        | Form com Nome, Tipo, País/Moeda; submit redireciona         | Erro "Core indisponível"; redirect para auth |
| Onboarding → Identidade / Localização / Horários | Campos guardam; Localização com capacidade 56 cria 14 mesas | Mensagem de erro; mesas não criadas          |

---

# TAREFA 2 — Menu Realista (Menu Core)

**Categorias:** Entradas | Pratos Principais | Sobremesas | Bebidas
**Regras:** Preços reais (EUR); produtos com custo implícito (stock/fiscal); **pelo menos 1 item indisponível**; **pelo menos 1 item com variação** (ex.: ponto da carne).
**Publicar:** Verificar MenuState; só fica LIVE quando válido; verificar mensagens humanas do ORE antes/depois.

### Passos

1. **Categorias**

   - Criar ou confirmar categorias: Entradas, Pratos Principais, Sobremesas, Bebidas (via First Product ou Menu Builder).

2. **Produtos (exemplo coerente)**

   - **Entradas:** ex. Bruschetta 4,50 €, Croquetas 5,00 €
   - **Principais:** ex. Hambúrguer 12,00 € (com variação: ponto da carne — mal passado, médio, bem passado), Arroz de Marisco 14,00 €, Salada 8,00 €
   - **Sobremesas:** ex. Tiramisú 5,50 €, **Brownie (indisponível)** 4,00 €
   - **Bebidas:** ex. Água 1,50 €, Cerveja 3,00 €, Vinho copo 4,00 €
   - Definir **pelo menos 1 produto** com `available: false` (Brownie ou outro).
   - Definir **pelo menos 1 produto** com variação (modificador/notas, ex.: ponto da carne).

3. **Custo implícito**

   - Onde a UI permitir: custo ou custo implícito para stock/fiscal (ex.: `cost_price_cents` ou equivalente).

4. **Publicação**
   - Completar secções obrigatórias do onboarding (identidade, localização, horários, menu, pessoas conforme ORE).
   - Publicar (ex.: PublishSection → `publishRestaurant`).
   - Verificar: MenuState passa a LIVE? ORE deixa aceder a TPV/KDS? Mensagem ao utilizador é clara?

| Onde clicar (rota)                                  | O que esperar                                                 | Se falhar, anotar                                           |
| --------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `/onboarding/first-product` ou `/app/config` (menu) | Categorias e produtos; 1 indisponível, 1 com variação         | Menu vazio; sem opção de publicar                           |
| Onboarding → Publicar / PublishSection              | Botão "Publicar"; redirect para dashboard; TPV/KDS acessíveis | Bloqueio sem mensagem; item indisponível não visível no TPV |

---

# TAREFA 3 — Stock e Receitas

**Objetivo:** Stock mínimo funcional; receita ligada a pelo menos 3 produtos do menu. Simular venda que consome stock; situação de stock baixo; ver comportamento (alerta ou silêncio).

### Passos

1. **Ingredientes (Core)**

   - Criar ingredientes base (ex.: Carne 500g, Pão 1 un., Queijo 100g, Cerveja 1 un.) onde a UI ou API do Core o permitir (`gm_ingredients`).

2. **Quantidades iniciais**

   - Definir níveis de stock iniciais (`gm_stock_levels` / UI se existir).

3. **Receitas (BOM)**

   - Ligar pelo menos **3 produtos** do menu a ingredientes via BOM (`gm_product_bom`): qty por unidade do produto.

4. **Simular venda**

   - No TPV: vender pedido que inclua esses produtos. Verificar se o stock é deduzido (RPC `process_inventory_deduction` ou equivalente).

5. **Stock baixo**
   - Reduzir stock manualmente ou com várias vendas até ficar abaixo do mínimo (se houver `min_qty`).
   - **Anotar:** O sistema mostra alerta? Task? Ou fica em silêncio?

| Onde clicar (rota)              | O que esperar                                | Se falhar, anotar                                     |
| ------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Config / Estoque ou equivalente | Ingredientes, quantidades, BOM (≥3 produtos) | Sem UI para BOM; sem alerta de stock baixo (silêncio) |

---

# TAREFA 4 — TPV (Uso Real)

Simular uso de TPV como um empregado real. **Regras:** Preço é snapshot do Menu; nenhum cálculo fora do Core; erros devem ser visíveis; latência perceptível se existir.

### Checklist de ações

- [ ] Abrir caixa (se fluxo existir)
- [ ] Abrir mesa (ex.: mesa 1)
- [ ] Criar pedido
- [ ] Adicionar itens (vários produtos)
- [ ] Remover 1 item
- [ ] Alterar quantidade de outro item
- [ ] Enviar para cozinha
- [ ] Fechar pedido / Pagar (cash ou outro método)

**Anotar:**

- Preço mostrado = preço do menu no momento?
- Erro ao remover/alterar: mensagem clara?
- Latência ao enviar/confirmar: perceptível? Mensagem de loading?

| Onde clicar (rota) | O que esperar                                                             | Se falhar, anotar                                                 |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `/op/tpv`          | Abrir caixa; mesa; adicionar/remover/alterar itens; Enviar Cozinha; Pagar | Preço diferente do menu; erro sem mensagem; latência sem feedback |

---

# TAREFA 5 — KDS (Cozinha)

Abrir KDS em paralelo ao TPV.

### Checklist

- [ ] Pedidos entram no KDS após "Enviar para cozinha"
- [ ] Atualização em tempo real (ou refresh explícito — anotar qual)
- [ ] Estados corretos: novo → em preparação → pronto
- [ ] **Crítico:** Algum pedido NÃO aparece? (bug crítico)

**Validar:** RestaurantId correto; orders do Core visíveis; nenhum uso de Supabase para domínio de pedidos.

| Onde clicar (rota) | O que esperar                                                                             | Se falhar, anotar                               |
| ------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `/op/kds`          | Pedidos entram; estados novo → em preparação → pronto; atualização (real-time ou refresh) | Pedido não aparece (bug crítico); estado errado |

---

# TAREFA 6 — QR / Web (Cliente)

Simular cliente real.

### Checklist

- [ ] Aceder via QR (ou link público do restaurante)
- [ ] Ver menu público
- [ ] Criar pedido (mesa ou balcão conforme fluxo)
- [ ] Acompanhar estado do pedido
- [ ] Mensagens claras ou confusas? (anotar)

**Testar em:** Android, iOS, Desktop (anotar diferenças).

| Onde clicar (rota)               | O que esperar                                 | Se falhar, anotar                                 |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| Link público / QR do restaurante | Menu público; criar pedido; acompanhar estado | Mensagens confusas; pedido não aparece no TPV/KDS |

---

# TAREFA 7 — Tasks e Turnos

### Criar

- [ ] Checklist de abertura (se existir)
- [ ] Checklist de fecho (se existir)

### Simular

- [ ] Turno iniciado
- [ ] Task marcada como feita
- [ ] Task esquecida (não marcar uma)

**Anotar:** Onde o sistema ajuda? Onde o sistema não diz nada? (importante para o relatório.)

| Onde clicar (rota)                  | O que esperar                                                              | Se falhar, anotar                           |
| ----------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Turno / Tasks (dashboard ou módulo) | Checklist abertura/fecho; marcar task feita; task esquecida visível ou não | Sistema não avisa task esquecida (silêncio) |

---

# TAREFA 8 — Fiscal e Documentos

Após pedidos pagos:

- [ ] Ver criação de eventos fiscais (Core)
- [ ] Ver leitura via FiscalService (Core)
- [ ] Algo falha em silêncio? (anotar)

| Onde clicar (rota)       | O que esperar                                      | Se falhar, anotar                      |
| ------------------------ | -------------------------------------------------- | -------------------------------------- |
| Após pagar pedidos (TPV) | Eventos fiscais no Core; leitura via FiscalService | Falha silenciosa; documento não gerado |

---

# TAREFA 9 — Falhas Controladas

Simular:

- Core lento (ex.: throttling ou atraso de rede)
- Core indisponível momentâneo (parar container ou rede)
- Erro de rede (desligar WiFi brevemente)

**Anotar:**

- ORE bloqueia? Com que mensagem?
- Mensagem humana aparece?
- Sistema entra em modo degradado?
- O humano percebe o que fazer?

| Onde clicar (rota)                                | O que esperar                                         | Se falhar, anotar                         |
| ------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Simular: Core lento / indisponível / rede cortada | ORE bloqueia ou modo degradado; mensagem humana clara | Sem mensagem; humano não sabe o que fazer |

---

# TAREFA 10 — Relatório Final (Humano)

Gerar um **relatório humano** com base nas anotações das tarefas 1–9. Formato: texto direto; sem marketing; sem desculpas; sem "depende".

## Template do Relatório

1. **Onde o sistema foi claro**
   _(Ex.: mensagens, fluxos, feedback visual.)_

2. **Onde foi confuso**
   _(Ex.: passos obscuros, termos técnicos, falta de explicação.)_

3. **Onde falhou em silêncio**
   _(Ex.: ação sem feedback, erro não mostrado.)_

4. **Onde exigiu conhecimento técnico indevido**
   _(Ex.: ter de saber IDs, tabelas, ou conceitos de sistema.)_

5. **Onde um restaurante REAL ficaria nervoso**
   _(Ex.: risco de perda de pedido, falta de confirmação, bloqueio sem aviso.)_

6. **O que é P0 humano (não técnico)**
   _(Prioridade máxima para um operador real.)_

7. **O que pode esperar**
   _(Melhorias que podem ser feitas depois, sem urgência extrema.)_

8. **O que está surpreendentemente bom**
   _(Pontos positivos inesperados.)_

---

## Referências

- [FASE_B_NOITE_ROTEIRO.md](./FASE_B_NOITE_ROTEIRO.md) — Roteiro da noite (blocos rush, erros, confluência)
- [EXECUTION_ORDER_B_A_C.md](./EXECUTION_ORDER_B_A_C.md) — Fase B
- [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](../architecture/RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) — Bootstrap via Core
- Docker Core: `docker-core/`, schema `gm_restaurants`, `gm_tables`, `gm_products`, `gm_orders`, `create_tables_from_capacity`, `process_inventory_deduction`

---

## Ficha de observação rápida

Preencher durante o teste. Uma linha por tarefa; detalhes nas secções acima.

| Tarefa                | OK? | Travou? | Silêncio? | Notas |
| --------------------- | --- | ------- | --------- | ----- |
| 1. Restaurante        |     |         |           |       |
| 2. Menu               |     |         |           |       |
| 3. Stock/Receitas     |     |         |           |       |
| 4. TPV                |     |         |           |       |
| 5. KDS                |     |         |           |       |
| 6. QR/Web             |     |         |           |       |
| 7. Tasks/Turnos       |     |         |           |       |
| 8. Fiscal             |     |         |           |       |
| 9. Falhas controladas |     |         |           |       |

**Relatório final (Tarefa 10):** preencher o template das secções 1–8 no fim do documento e guardar como relatório humano.
