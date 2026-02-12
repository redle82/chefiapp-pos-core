# COMMERCIAL_CLAIMS_GUARDRAILS — Guardrails de claims comerciais e jurídicos

> Documento interno para alinhar **marketing, vendas, produto e jurídico** sobre o que o ChefIApp™ OS pode prometer hoje, o que deve ser posicionado como capacidade/roadmap e o que não deve ser prometido.

---

## 1. Objetivo

- Reduzir risco de **overpromise** na landing, deck, site e contratos.
- Garantir que toda a comunicação:
  - reflete o estado real do produto (segundo auditorias técnicas recentes);
  - prepara terreno para evolução (roadmap) sem prometer o que não existe.
- Servir como referência rápida ao escrever:
  - landing pages,
  - apresentações comerciais,
  - propostas e termos/contratos.

---

## 2. Lista branca — o que podemos afirmar com 100% de segurança hoje

### 2.1. Produto / módulos

É seguro afirmar que o ChefIApp™ OS hoje:

- **TPV Operacional**
  - Permite registar pedidos em serviço (sala, bar, balcão).
  - Liga pedidos a mesas/zonas quando configurado.
  - Trabalha em paralelo com POS fiscal existente (sem substituí-lo).

- **KDS (Kitchen/Bar Display)**
  - Recebe pedidos e itens em tempo real a partir do TPV/AppStaff/Web.
  - Permite marcar itens como em preparação / prontos.
  - Alimenta indicadores de atraso e tasks operacionais ligadas a serviço.

- **Menu Builder / Catálogo**
  - Permite configurar produtos, categorias e preços por restaurante.
  - Liga produtos de venda ao TPV, KDS e página pública.

- **Staff App / App de equipa**
  - Dá visibilidade de pedidos/tarefas à equipa operacional.
  - Pode funcionar como mini-TPV em contextos específicos (ex.: esplanada).
  - É mais valioso quando ligado ao resto do sistema (não como app de tarefas isolada).

- **Página Pública / Presença online**
  - Permite expor menu e/ou pedidos online para o restaurante.
  - Usa dados do mesmo catálogo ligado ao TPV.

- **Task Engine / Tarefas operacionais**
  - Gera tarefas automáticas a partir de eventos operacionais (ex.: atrasos, estados de pedidos).
  - Permite acompanhar e fechar tarefas ligadas ao serviço.

### 2.2. Arquitetura / operação

Podemos afirmar que:

- O ChefIApp™ OS foi desenhado e testado **dentro de operação real de restaurante**.
- A arquitetura usa um **núcleo unificado de dados** (Core/PostgREST) para:
  - pedidos,
  - tasks,
  - runtime,
  - reservas (onde configurado),
  - stock operacional (módulo em evolução).
- O sistema:
  - funciona **durante o serviço**, não apenas para reporting do dia seguinte;
  - consegue operar em paralelo com POS fiscal sem interromper a operação atual.

### 2.3. Multi-tenant / hotelaria F&B

É seguro dizer que:

- O sistema suporta **múltiplos restaurantes/unidades** a nível de Core (multi-tenant).
- É possível operar:
  - mais de um outlet de F&B de hotel,
  - mais de um restaurante dentro do mesmo grupo.
- A narrativa de hotelaria deve focar-se em:
  - operações de F&B (restaurantes, bares, room service),
  - não em PMS completo nem gestão de quartos.

---

## 3. Lista cinzenta — capacidades preparadas / roadmap

Aqui ficam claims que **podem ser mencionados**, mas sempre com linguagem de:

- “preparado para…”
- “desenhado para escalar até…”
- “em evolução para suportar…”

### 3.1. Multi-unidade avançado

Pode ser formulado como:

- O sistema está **preparado para consolidar dados de várias unidades** num único dono/grupo.
- A arquitetura já suporta:
  - multi-tenant,
  - métricas agregadas por restaurante.
- O dashboard multi-unidade “olho de dono” está:
  - **em desenho/implementação progressiva**, conforme `MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md`.

Evitar:

- “Dashboard completo multi-unidade já pronto para grupos grandes”.

### 3.2. Stock avançado

Pode ser formulado como:

- O módulo de stock está a evoluir para:
  - ligar consumo de ingredientes a vendas,
  - gerar alertas de stock crítico/ruptura prevista,
  - alimentar dashboards operacionais.

- O foco é **stock operacional** (ligado ao serviço), não substituição de ERP.

Evitar:

- “Controle de stock completo de ponta a ponta para grupos grandes”.

### 3.3. Integrações complexas

Podemos afirmar que:

- A arquitetura e o Core permitem integrar com:
  - POS fiscais,
  - ERPs,
  - PMS e outros sistemas,
  - via API/bridge dedicado.

Mas deve ser claro que:

- integrações específicas dependem de projeto, escopo e desenvolvimento adicional;
- não há hoje “lista de integrações plug-and-play” ampla.

---

## 4. Lista vermelha — o que NÃO devemos prometer

Estas frases/ideias **não devem ser usadas** em nenhum material, a menos que exista implementação concreta, testada e documentada.

### 4.1. Substituição de POS fiscal

Evitar qualquer formulação do tipo:

- “Substitui totalmente o seu POS fiscal.”
- “Não precisa mais de POS.”
- “Sistema fiscal completo integrado.”

Posicionar sempre como:

- “Funciona em paralelo ao seu POS fiscal atual.”
- “Prepara o terreno para uma migração futura, se fizer sentido.”

### 4.2. PMS completo de hotel

Evitar:

- “Substitui o PMS do hotel.”
- “Gestão completa de quartos, reservas de alojamento, billing de hospedagem.”

Posicionar:

- “Focado na operação de F&B do hotel (restaurantes, bares, room service).”

### 4.3. ERP de stock / contabilidade

Evitar:

- “Controle de stock e contabilidade completos.”
- “Gestão fiscal/contabilística integrada em todos os países.”

Posicionar:

- “Stock operacional ligado ao serviço.”
- “Complementar a um ERP/contabilidade já existente.”

### 4.4. SLAs e garantias não existentes

Evitar:

- “Disponibilidade 99,99% garantida” (sem infra/contracto que suporte).
- “Suporte 24/7 garantido” (se não existir equipa/turnos para isso).

---

## 5. Exemplos de frases — recomendadas vs. a evitar

### 5.1. Landing / site

- **Recomendado**:
  - “ChefIApp™ é um sistema operacional para o dia-a-dia do restaurante, ligado ao serviço real.”
  - “Funciona em paralelo ao seu POS fiscal atual.”
  - “Foi desenhado dentro de um restaurante real, durante serviço, e depois levado para produto.”

- **A evitar**:
  - “Substitui todo o seu sistema atual em poucos dias.”
  - “Acaba com todos os problemas de operação para sempre.”

### 5.2. Deck comercial

- **Recomendado**:
  - “Hoje já entregamos: TPV operacional, KDS, Menu Builder, Staff App, página pública e tarefas ligadas a serviço.”
  - “A arquitetura já é multi-tenant e está a ser extendida para dashboards multi-unidade.”

- **A evitar**:
  - “Dashboard corporativo completo pronto para cadeias globais.”

### 5.3. Contratos / termos

- **Recomendado**:
  - Descrever módulos e capacidades de forma factual, com escopo claro.
  - Definir o que está incluído e o que é serviço/projeto à parte (ex.: integrações específicas).

- **A evitar**:
  - Qualquer promessa de resultado garantido (ex.: “aumento de X% de faturação”).
  - Termos vagos como “garantia de excelência total em todas as operações”.

---

## 6. Como usar este documento

- Antes de publicar uma nova landing, secção de site ou deck:
  - passar texto pelos filtros:
    - **lista branca**: está alinhado? ótimo.
    - **lista cinzenta**: está marcado como capacidade/roadmap? linguagem moderada?
    - **lista vermelha**: remover/reformular.

- Antes de fechar um contrato com cliente maior (grupo/hotel):
  - verificar se:
    - nenhuma cláusula promete módulos/integrações que ainda não existem;
    - o escopo de multi-unidade/stock/integrations está descrito como **estado atual + roadmap**, não como “já entregues”.

Qualquer mudança relevante no produto (ex.: lançamento de dashboard multi-unidade completo, novo módulo de stock avançado) deve resultar numa **revisão deste documento**, ajustando listas branca/cinzenta/vermelha e exemplos de frases.

