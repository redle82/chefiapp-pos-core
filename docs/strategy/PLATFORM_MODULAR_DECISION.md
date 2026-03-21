# ChefIApp — Decisão Estratégica: Plataforma Modular

**Data:** 2026-02-25  
**Status:** Decisão registada  
**Ref:** [STRATEGIC_DECISION_FRAMEWORK.md](./STRATEGIC_DECISION_FRAMEWORK.md)

---

## 1. Opção escolhida: **3 — Plataforma Operacional Modular**

Cada módulo é vendável independentemente. O ChefIApp não se posiciona como "mais um POS", mas como **sistema operacional para restaurantes** com módulos ativáveis.

---

## 2. Posicionamento

**ChefIApp OS™** — Um sistema operacional para restaurantes.

- **Não competimos frontalmente** com Toast/Square no campo deles (pagamento, hardware).
- **Competimos** em inteligência operacional, gestão de equipe e produtividade dinâmica.
- **Diferencial:** orquestração operacional, tarefas baseadas em fluxo real, KDS que vira painel de tarefas quando idle.

---

## 3. Arquitetura de módulos

| Módulo | Descrição | Vendável | Concorrência |
|--------|-----------|----------|--------------|
| **Core** | Auth, RBAC, multi-tenant, engine transacional, eventos | Obrigatório | — |
| **POS** | Pedidos, mesas, KDS, pagamentos, fechamento | Sim | Toast, Square |
| **Workforce** | Tarefas, check-in, ranking, gamificação, auditoria | Sim | 7shifts |
| **Intelligence** | Métricas cruzadas, heatmap, alertas automáticos | Premium | — |
| **Customer Loop** | Avaliações, fidelização (fase 2) | Fase 2 | — |

---

## 4. Modelo de venda sugerido

| Plano | Módulos |
|-------|---------|
| Start | Gestão de Equipe |
| Pro | Gestão + POS |
| Elite | Gestão + POS + Inteligência |
| Enterprise | Tudo + API + suporte |

---

## 5. Critérios de sucesso (18 meses)

1. 1 módulo Workforce vendido sem POS.
2. Billing modular (cobrança por módulo ativo).
3. Documentação pública da API para integradores.
4. 1 restaurante piloto com pagamento real em produção.

---

## 6. Não priorizar (por agora)

- Competição global com Toast (infra, escala, hardware próprio).
- Suporte 24/7.
- Hardware próprio.
