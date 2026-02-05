# Rota — Painel Pedidos Prontos (Web de Configuração + Operação)

**Paths:** Acesso dono (link/config): dashboard → “Painel Pedidos Prontos” aponta para vista operacional; Vista operacional: `/op/kds`  
**Tipo:** OPERAÇÃO (KDS); link na web de configuração é apenas navegação para a vista.  
**Estado atual:** DOCUMENTADO (KDS existe; “Painel Pedidos Prontos” é a designação no sidebar para a vista de pedidos prontos / KDS público).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** A cozinha (ou ecrã de “pedidos prontos”) vê os pedidos em preparação e marca como prontos; opcionalmente um ecrã público mostra apenas os pedidos prontos para entrega ao cliente. O dono, na web, tem um link para abrir esta vista (TPV/KDS).
- **Para quem é:** Operação (cozinha/salão) na vista `/op/kds`; Dono na web usa o link do dashboard para aceder à mesma vista.
- **Em que momento do ciclo de vida:** TRIAL e ACTIVE; em SETUP a rota operacional `/op/kds` é bloqueada → redirect `/onboarding/first-product`. Na web de configuração o link pode estar visível mas ao clicar o utilizador é redirecionado se systemState === SETUP.

---

## 2. Rota & Acesso

- **Path operacional:** `/op/kds` (e eventualmente `/app/kds` se legacy).
- **Link no dashboard:** Módulo “Painel Pedidos Prontos” no sidebar (EM EVOLUÇÃO) com route `/op/kds` no código atual.
- **Tipo:** OPERAÇÃO — guard operacional aplicado: SETUP → redirect `/onboarding/first-product`.
- **Guard aplicado:** CoreFlow — `isOperationalPath("/op/kds")` = true; quando `systemState === "SETUP"` → REDIRECT para `/onboarding/first-product`. Quando TRIAL/ACTIVE → ALLOW.
- **Comportamento por SystemState:**
  - **SETUP:** REDIRECT para `/onboarding/first-product` ao tentar aceder a `/op/kds`.
  - **TRIAL:** ALLOW; KDS com dados reais do trial.
  - **ACTIVE:** ALLOW; dados reais.
  - **SUSPENDED:** Conforme política (ex.: ALLOW leitura ou REDIRECT).

---

## 3. Conexão com o Core

- **Entidades lidas:** Orders (pedidos ativos por restaurante), Order items (estado: em preparo, pronto). KDS lê do Core.
- **Entidades escritas:** Atualização de estado dos itens/pedidos (em preparo → pronto). Core é fonte de verdade.
- **Eventos gerados:** `ORDER_ITEM_READY`, `ORDER_READY`; EventMonitor pode gerar tarefas a partir de pedidos atrasados.

---

## 4. Backend & Dados

- **Tabelas envolvidas:** Orders, order_items (ou equivalente no Core). RPCs ou endpoints: listagem de pedidos ativos, atualização de estado. Backend local: Docker Core; estado vazio: “Ainda não há pedidos. Os pedidos aparecem quando forem criados no TPV ou no app.”

---

## 5. UI / UX Esperada

- **Estados:** (1) **Vazio** — “Ainda não há pedidos.” (2) **Em uso** — lista de pedidos/itens por estação, ações “Marcar como pronto”. (3) **Erro** — “Não foi possível carregar os pedidos. Tente novamente.”
- **Mensagens:** Sem “demo”; trial = pedidos reais.
- **CTA (dashboard):** “Abrir Painel Pedidos Prontos” → navega para `/op/kds` (respeitando guard: se SETUP, redirect).

---

## 6. Integração com Outras Rotas

- **De onde vem:** Dashboard (módulo Painel Pedidos Prontos), TPV (pedidos criados no TPV alimentam o KDS).
- **Para onde vai:** TPV (estado pronto pode afetar fluxo de fecho), Task system (alertas de atraso). Depende de TPV ou canais de pedido ativos para haver dados.

---

## 7. Regras de Negócio

- **Permitido:** Aceder a `/op/kds` em TRIAL/ACTIVE; ver e atualizar estados de pedidos; estado vazio quando não há pedidos.
- **Bloqueado:** Em SETUP, acesso a `/op/kds` redireciona para primeiro produto; não bloquear por billing na web (o link pode estar visível; o redirect é por systemState).
- **Regra de ouro:** Operação só bloqueia TPV/KDS quando SystemState === SETUP; Painel Pedidos Prontos = vista KDS, mesma regra.

---

## 8. Estado Atual

- **Estado:** DOCUMENTADO — KDS implementado (`/op/kds`); “Painel Pedidos Prontos” no dashboard é a entrada para essa vista. Guard em CoreFlow já aplicado.
- **Próximo passo técnico:** (1) Manter consistência entre nome no sidebar (“Painel Pedidos Prontos”) e doc; (2) Se existir vista “só pedidos prontos” (pública) separada, documentar path e guard à parte.
