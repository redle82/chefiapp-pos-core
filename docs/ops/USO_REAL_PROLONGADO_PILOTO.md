## Piloto de Uso Real Prolongado Pós-DROP LEGACY (LOCAL)

**Propósito:** Definir um piloto operacional mínimo (1 restaurante / poucos terminais) para validar o sistema em **uso real consciente** após o DROP LEGACY, com observabilidade silenciosa e critérios explícitos de sucesso, paragem e próximos passos.

Este documento assume que:

- O ritual de DROP LEGACY (LOCAL) foi executado e carimbado em `docs/ops/DB_TABLE_CLASSIFICATION.md`.
- A validação pós-DROP foi feita via `docs/qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md`.

---

## 1. Piloto operacional mínimo

- **Âmbito físico:**
  - 1 restaurante real (ou ambiente-equivalente controlado).
  - 1–2 TPVs em operação.
  - 1 KDS em produção (cozinha).
- **Duração mínima:**
  - 1–2 semanas de uso contínuo.
  - Cobrir pelo menos:
    - Horários de pico (ex.: almoço, jantar).
    - Horários de vazio (início/fim de turno).
- **Participantes:**
  - Dono / gestor responsável do restaurante.
  - Operadores de caixa (TPV).
  - Equipa de cozinha (KDS).
  - Ponto de contacto técnico (responsável por receber logs e feedback estruturado).

---

## 2. Ritual diário de uso real

O dia de operação começa sempre com um **checklist de abertura** e inclui momentos de observação ao longo do dia.

### 2.1 Abertura (antes de abrir portas)

- Executar o **TESTE HUMANO CANÓNICO** definido em `docs/qa/VALIDACAO_POS_DROP_LEGACY_LOCAL.md`:
  - `/app/dashboard` abre direto e não volta para `/`.
  - `/app/install` abre e não redireciona.
  - TPV e KDS abrem e carregam.
  - Pedido TPV → KDS flui.
  - Header/Kernel refletem operador/estado.
- Se o teste **não passar**, o restaurante **não** entra em operação normal com o sistema:
  - Registar o ponto de falha (screenshot/log).
  - Notificar o ponto de contacto técnico.

### 2.2 Momentos de fotografia diária

Definir pelo menos **2 momentos por dia** para tirar uma “fotografia” do sistema:

- **Momento 1 — meio do serviço (ex.: meio do almoço):**
  - Estado do Dashboard (`/app/dashboard`).
  - TPV: pedidos em curso, fluidez na criação.
  - KDS: fila de pedidos e atualizações de estado.
  - Erros visíveis na UI ou comportamentos estranhos.
- **Momento 2 — fim do serviço (ex.: fim do jantar):**
  - Estado final do Dashboard.
  - TPV/KDS após o último pedido.
  - Qualquer fricção que tenha irritado operadores.

Para cada momento:

- Registar notas em texto curto.
- Se relevante, anexar 1 screenshot.
- Guardar tudo na secção de **Registo diário** no final deste documento.

### 2.3 O que é proibido mexer durante o piloto

Durante o piloto, **não** fazer:

- Introdução de novas features que não sejam estritamente hotfixes do que já existe.
- Refactors estruturais de fluxo, kernel ou contratos.
- Mudanças de UX que possam mascarar problemas funcionais.

Excepção: **hotfixes mínimos** para:

- Corrigir falhas soberanas (ex.: não conseguir abrir TPV, KDS ou criar pedido).
- Corrigir problemas de verdade financeira (ex.: pedido escrito em sítio errado).

Todos os hotfixes devem ser registados com:

- Data.
- Descrição curta.
- Commit (opcional).

---

## 3. Observabilidade silenciosa mínima

### 3.1 Smoke automático pré-uso

Antes de iniciar o serviço (idealmente antes da abertura), executar o teste automático:

- Script: `scripts/test_post_drop_local.sh`
- Objetivo:
  - Verificar Docker Core.
  - Confirmar contagem de tabelas `gm_%` operacionais.
  - Garantir ausência de tabelas LEGACY específicas.
  - Correr `npm run test` em `merchant-portal`.
  - Verificar que `/app/dashboard` e `/app/install` respondem `200`.

Se o script falhar:

- Não avançar para o uso real.
- Registar saída do script.
- Notificar o ponto de contacto técnico.

### 3.2 Logs mínimos (ligação com observabilidade pós-corte)

Reutilizar as diretrizes de `docs/ops/OBSERVABILITY_POST_CUT.md`:

- Logar apenas:
  - Mudanças de estado do Kernel (CoreHealth, OperationalState.terminals, Preflight).
  - Redirecionamentos relevantes (FlowGate, ORE).
  - Instalação/perda de terminais.
- Evitar:
  - Spam em polls.
  - Logs por render.
  - Mensagens repetitivas em loop.

### 3.3 Local único para notas humanas

Este próprio documento (`docs/ops/USO_REAL_PROLONGADO_PILOTO.md`) serve como:

- **Fonte canónica** do plano de piloto.
- **Local único** para:
  - Registos diários de observação (ver secção final).
  - Resumo de incidentes.
  - Ligações para logs externos, se existirem.

---

## 4. Critérios de sucesso, paragem e rollback

### 4.1 Critérios de sucesso mínimo

Considera-se que o piloto foi **bem-sucedido** se, durante a janela acordada (ex.: 1–2 semanas):

- Não há falhas soberanas repetidas:
  - TPV/KDS indisponíveis em horário de pico.
  - Impossibilidade de criar/ver pedidos.
- Não há regressões pós-deploy detectadas pelo `scripts/test_post_drop_local.sh`.
- Operadores não rejeitam o sistema por frustração extrema:
  - Sem relatos de “impossível trabalhar”.
  - Fricções existem, mas são toleráveis e mapeadas.
- Observabilidade confirma:
  - Ausência de spam estrutural.
  - Ausência de erros recorrentes “relation does not exist”.

### 4.2 Gatilhos de paragem

O piloto deve ser **parado** (ou suspenso) se ocorrerem, de forma repetida:

- Falhas de escrita/leitura de pedidos no Core.
- Quedas recorrentes de TPV ou KDS em horário crítico.
- Erros de verdade financeira (ex.: pedidos contabilizados de forma incorreta).
- Quebra de contratos centrais definidos nos docs de arquitetura/contratos.

Quando um gatilho é ativado:

- Parar o uso normal do sistema.
- Registar o incidente neste documento (data, descrição, impacto).
- Avaliar necessidade de rollback seguindo `docs/ops/ROLLBACK_OPERATIONAL_FREEZE.md`.

### 4.3 Política de hotfix durante o piloto

- Hotfixes são permitidos apenas para:
  - Restaurar operacionalidade básica.
  - Corrigir violações de verdade financeira.
- Cada hotfix deve:
  - Ser pequeno, focado e reversível.
  - Ter registo (data, descrição, commit).
  - Ser revalidado com:
    - `scripts/test_post_drop_local.sh`.
    - Trecho relevante do TESTE HUMANO CANÓNICO.

---

## 5. Ponte para staging e próximos cortes

Após o fim do piloto:

- Se critérios de sucesso forem cumpridos:
  - Preparar um **staging plan** baseado nos padrões observados:
    - Tipos de falhas reais encontradas (mesmo se resolvidas).
    - Comportamentos humanos frequentes (atalhos, abusos, desvios).
    - Momentos de maior stress operacional.
  - Ajustar contratos e observabilidade com base em dados, não suposições.
- Se dores estruturais forem identificadas:
  - Classificar em P0/P1/P2 e registá-las nos documentos de auditoria (ex.: `docs/plans/AUDITORIA_RITUAL_CORTE.md` ou similares).
  - Decidir novos cortes ou reforços (kernel, contratos, UI) **após** analisar os padrões do piloto.

Em ambos os casos:

- O resultado do piloto passa a ser a base para:
  - Decisões de rollout para mais restaurantes.
  - Ajustes em Staging/Prod.
  - Próxima iteração de contratos e testes guardiões.

---

## 6. Registo diário do piloto

Usar a tabela abaixo para registar, por dia, os principais sinais:

| Data | Turno(s) | Sinais positivos | Dores/fricções | Incidentes (sim/não) | Notas / links para logs |
|------|----------|------------------|----------------|----------------------|--------------------------|
| AAAA-MM-DD | almoço/jantar | DROP estável; TPV/KDS operacionais; Kernel/EventMonitor saudáveis | Banner "55 alertas críticos" confunde operador, mas sem impacto funcional | não | Console mostra `[OrderReader] gm_orders: 59 linha(s), 55 ativo(s)` e `[EventMonitor] 55 evento(s) detectado(s), 0 tarefa(s) criada(s)`; ruído semântico de alertas herdados, pendente de contrato de severidade/expiração |

Adicionar linhas à medida que o piloto decorre.

