# Onda 4 (30–45 dias) — Tarefas POS Ultra-Rápido

**Data:** Fev 2026  
**Referência:** [ONDA_4_POS_ULTRA_RAPIDO.md](./ONDA_4_POS_ULTRA_RAPIDO.md) · [ONDAS_4_A_7_ESTRATEGIA.md](./ONDAS_4_A_7_ESTRATEGIA.md)  
**Objetivo:** Produto vendável em 30–45 dias; fluxo único de venda (mesa/balcão → itens → pagamento); UI brutalmente rápida; primeiros clientes reais.

---

## Foco da Onda 4

| Área | O que entregar | Doc de referência |
|------|----------------|-------------------|
| Onboarding | Registo, criar restaurante, primeiro produto em &lt; 5 min | Este doc, secção A |
| Fluxo de venda | Mesa/balcão → itens (1 toque) → fechar conta → pagamento | [ONDA_4_POS_ULTRA_RAPIDO.md](./ONDA_4_POS_ULTRA_RAPIDO.md) § B |
| UI / velocidade | Zero modais no fluxo; atalhos; feedback &lt; 200 ms | § C |
| Dados | Pedidos e pagamentos já cobertos (Onda 3); métricas do dia visíveis | get_operational_metrics, DASHBOARD_METRICS |

**Critério de fecho:** Operador faz 1ª venda em &lt; 5 min; turno real operável; 2–5 clientes reais com feedback.

---

## Tarefas sugeridas (backlog)

### Bloco A — Onboarding (5 min)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| A1 | Registo / login (email + senha) | Fluxo auth; entrada em &lt; 1 min | Engenharia | Utilizador entra na app rapidamente |
| A2 | Criar restaurante (nome, contacto) | Fluxo bootstrap ou config; owner associado | Engenharia | Restaurante criado; owner associado |
| A3 | Primeiro produto (nome, preço) | Fluxo mínimo de criação de item; visível no TPV | Engenharia | Pelo menos 1 item no menu; visível no TPV |
| A4 | (Opcional) Mesa única “Balcão” | Opção “Balcão” ou 1 mesa default | Engenharia | Venda sem mesas = balcão |

### Bloco B — Fluxo de venda (1–2 toques)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| B1 | Selecionar “mesa” ou balcão | UI de escolha mínima (lista ou balcão) | Engenharia | Uma escolha; sem configuração |
| B2 | Lista de produtos; toque = +1 unidade | TPV ou vista equivalente; 1 toque adiciona item | Engenharia | Produtos carregam rápido; toque = +1 |
| B3 | Adicionar item ao pedido atual (sem modal) | Sem modal; atualização imediata | Engenharia | 1 toque = +1; sem modal |
| B4 | Ver pedido atual (resumo + total) | Resumo sempre visível; total correto | Engenharia | Resumo + total sempre visíveis |
| B5 | Fechar conta (abrir fluxo de pagamento) | 1 ação; escolha de método (dinheiro / cartão / outro) | Engenharia | 1 ação; método escolhido |
| B6 | Registar pagamento e fechar | Chamada process_order_payment; pedido pago; mesa livre | Engenharia | Pedido pago; mesa/balcão livre |

### Bloco C — UI / velocidade

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| C1 | Zero modais no fluxo de venda | Revisão de modais; remover ou substituir por inline | Engenharia | Nada bloqueia “produto → conta → pago” |
| C2 | Atalhos (+1 quantidade em 1–2 toques) | Botões ou gestos para +/- quantidade | Engenharia | Aumentar/diminuir em 1–2 toques |
| C3 | Feedback táctil ou visual imediato | Feedback &lt; 200 ms por toque | Engenharia | Resposta &lt; 200 ms |

### Bloco D — Dados (validar / expor)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| D1 | Garantir pedidos e pagamentos persistidos | create_order_atomic, process_order_payment (já existem); validar fluxo E2E | Engenharia | Pedidos e pagamentos em BD |
| D2 | Métricas do dia visíveis (receita, nº pedidos) | Usar get_operational_metrics; dashboard ou resumo no TPV/dashboard | Engenharia / Doc | Dono vê total do dia |

### Bloco P — Piloto

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| P1 | 2–5 restaurantes reais; 2 semanas | Seleção de pilotos; apoio e recolha de feedback | Produto / Ops | Feedback real; prova de mercado |
| P2 | Métricas de piloto (tempo por pedido, erros, satisfação) | Checklist ou mini-relatório | Doc / Ops | Dados para decisão Onda 5 |

---

## Ordem sugerida

1. **A1 → A2 → A3** (onboarding mínimo).  
2. **B1 → B2 → B3 → B4 → B5 → B6** (fluxo de venda fechado).  
3. **C1 → C2 → C3** (velocidade; podem sobrepor-se com B).  
4. **D1 → D2** (validar dados; expor métricas).  
5. **A4** (opcional: balcão) quando fizer sentido.  
6. **P1 → P2** (piloto e métricas).

---

## Progresso Onda 4

**Escopo de engenharia (A–D): concluído.** Pendente: P1–P2 (piloto e métricas).

| ID | Estado | Notas |
|----|--------|-------|
| A1 | Concluído | AuthPage login/signup (email+senha); /login→/auth; audit login_success/login_failure; pós-signup → /bootstrap (fluxo A2) |
| A2 | Concluído | BootstrapPage: form nome + contacto (opcional); create_tenant_atomic ou fallback insert; owner em gm_restaurant_members |
| A3 | Concluído | FirstProductPage: form nome + preço (€); DbWriteGate gm_products; redirect pós-bootstrap → /onboarding/first-product → /op/tpv |
| A4 | Concluído | Balcão quando sem mesas (B1); venda sem mesas = só botão Balcão no TPVMinimal |
| B1 | Concluído | TPVMinimal: barra "Venda para: Balcão | Mesa N"; gm_tables; sync_metadata table_id/table_number no createOrder |
| B2 | Concluído | TPVMinimal: lista produtos; toque = +1 (addToCart) |
| B3 | Concluído | TPVMinimal: addToCart sem modal; atualização imediata |
| B4 | Concluído | TPVMinimal: carrinho com resumo + total sempre visíveis |
| B5 | Concluído | TPVMinimal: Pagamento: Dinheiro / Cartão / Outro; passado ao createOrder |
| B6 | Concluído | TPVMinimal: create_order_atomic + process_order_payment quando caixa aberto; senão pedido criado (pagar no TPV) |
| C1 | Concluído | TPVMinimal: fluxo produto→conta→pago sem modais; tudo inline |
| C2 | Concluído | TPVMinimal: botões +/- por item no carrinho (1–2 toques) |
| C3 | Concluído | TPVMinimal: addToCart/updateQuantity = setState imediato; feedback visual imediato |
| D1 | Concluído | Fluxo E2E: create_order_atomic + process_order_payment no TPVMinimal; pedidos e pagamentos em BD |
| D2 | Concluído | get_operational_metrics + OperationalMetricsCards no dashboard (Onda 3 G4); receita e nº pedidos do dia |
| P1–P2 | Pendente | Piloto e métricas (ver abaixo) |

---

## Próximos passos (após escopo engenharia)

1. **P1 — Piloto:** Selecionar 2–5 restaurantes reais; 2 semanas de uso com apoio e recolha de feedback.
2. **P2 — Métricas de piloto:** Tempo por pedido, erros, satisfação; checklist ou mini-relatório para decisão Onda 5.
3. **Opção técnica:** Push (`git push`), integrar fail-fast na CI, ou corrigir falhas de `npm test`.

Critério de fecho Onda 4 (do doc): *Operador faz 1ª venda em < 5 min; turno real operável; 2–5 clientes reais com feedback.*

---

## Commit sugerido (após validação)

```bash
git add -A
git status   # rever
git commit -m "Onda 4: POS Ultra-Rápido — A1–A4, B1–B6, C1–C3, D1–D2 concluídos

- A1: Auth login/signup; pós-signup → /bootstrap
- A2: BootstrapPage form nome+contacto; create_tenant_atomic ou fallback
- A3: FirstProductPage nome+preço; /onboarding/first-product → /op/tpv
- A4: Balcão quando sem mesas (B1)
- B1–B6: TPVMinimal mesa/balcão, produtos, carrinho, pagamento (Dinheiro/Cartão/Outro), process_order_payment
- C1–C3: Zero modais, +/- no carrinho, feedback imediato
- D1–D2: E2E + get_operational_metrics no dashboard
- CoreFlow: /bootstrap, /onboarding/first-product permitidos
- ExceptionRegistry: OnboardingQuick gm_products
- NEXT_STEPS e docs Onda 4 atualizados"
git push -u origin <branch>
```

---

## Referências

- [ONDA_4_POS_ULTRA_RAPIDO.md](./ONDA_4_POS_ULTRA_RAPIDO.md) — Escopo fechado (feature por feature)
- [ONDAS_4_A_7_ESTRATEGIA.md](./ONDAS_4_A_7_ESTRATEGIA.md) — Estratégia e ondas 4–7
- [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) — Roadmap macro
- Componentes existentes: TPV (TPVMinimal, TPV), Menu, create_order_atomic, process_order_payment, get_operational_metrics
