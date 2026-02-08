# PRD — Dashboard do Proprietário (Owner Dashboard)

**Propósito:** PRD do **dashboard do proprietário** (portal de gestão): requisitos e fluxos para o dono do restaurante configurar, publicar e operar. Consolida READY_TO_PUBLISH_CHECKLIST, MANAGEMENT_ADVISOR, rotas /app/* e fluxo CAMINHO_DO_CLIENTE.  
**Público:** Produto, engenharia.  
**Referência:** [CAMINHO_DO_CLIENTE.md](../architecture/CAMINHO_DO_CLIENTE.md) · [READY_TO_PUBLISH_CHECKLIST.md](../architecture/READY_TO_PUBLISH_CHECKLIST.md) · [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md)

---

## 1. Visão e objetivo

- **Objetivo:** Um único portal (dashboard) onde o proprietário configura o restaurante, equipa, cardápio, billing e publica; depois opera ou delega. Onboarding aconselha, não bloqueia. Billing controla operação, não configuração.
- **Regra:** Portal nunca bloqueia acesso à configuração; bloqueia apenas operação (TPV/KDS) quando não publicado ou billing suspended.

---

## 2. Requisitos funcionais

### 2.1 Entrada e navegação

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Destino pós-login** | Após login/signup, utilizador vai para `/app/dashboard` (ou `/dashboard`); se 0 tenants → bootstrap ou select-tenant. | P0 |
| **Seleção de tenant** | Se >1 restaurante, página de seleção em `/app/select-tenant`; após escolha → dashboard. | P0 |
| **Dashboard como hub** | Dashboard é o hub: árvore de módulos (SystemTree/WorkTree) ou menu lateral; painel central mostra o módulo selecionado (TPV, KDS, Menu, Config, Billing, Publish, People, Tasks, Health, etc.). | P0 |
| **Sem wizard obrigatório** | Onboarding usa banners/checklists (ManagementAdvisor); não bloqueia rotas. | P0 |

### 2.2 Módulos e rotas

| Módulo | Rota (ex.) | Função | Prioridade |
|--------|-------------|--------|------------|
| **Dashboard** | `/dashboard`, `/app/dashboard` | Hub principal; resumo e atalhos. | P0 |
| **Restaurante** | `/app/restaurant`, `/config/*` | Nome, identidade, contacto. | P0 |
| **Cardápio** | `/menu-builder`, `/app/menu` | Categorias, produtos. | P0 |
| **Billing** | `/app/billing` | Planos, assinatura, cartão; Stripe Checkout/Portal. | P0 |
| **Publicar** | `/app/publish` | Botão "Publicar restaurante"; isPublished = true; libera TPV, KDS, web pública. | P0 |
| **Instalar** | `/app/install` | Instruções para instalar TPV/KDS (browser, PWA). | P0 |
| **Equipa** | `/app/people`, `/people` | Utilizadores, papéis (owner, manager, staff). | P1 |
| **Tarefas** | Painel Tarefas no dashboard | Criar, delegar, ver execução. | P1 |
| **Saúde / Health** | Painel Health | Consciência operacional (opcional). | P2 |
| **Backoffice** | `/app/backoffice` | Operações internas (conforme escopo). | P2 |

### 2.3 Checklist "Ready to Publish"

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Lista recomendada** | Mostrar checklist: identidade, cardápio (≥1 item), billing ativo, (opcional) equipa, pagamentos. Fonte: READY_TO_PUBLISH_CHECKLIST. | P0 |
| **Advisor, não gate** | Checklist não bloqueia o botão "Publicar"; cliente pode publicar mesmo sem todos os itens. | P0 |
| **Onde mostrar** | Dashboard ou /app/publish como "Recomendado antes de publicar". | P0 |

### 2.4 Billing e bloqueio

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Billing não bloqueia portal** | Acesso a /app/billing, /app/restaurant, /app/menu, etc. sempre permitido (após auth e tenant). | P0 |
| **Billing bloqueia operação** | Quando past_due ou suspended, TPV/KDS bloqueados (RequireOperational + billingStatus); mensagem e CTA para /app/billing. | P1 (gate já preparado; aplicar quando implementado) |

### 2.5 Estados e UX

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Loading/empty/error** | Dashboard e painéis usam GlobalUIState e componentes canónicos (GlobalLoadingView, GlobalEmptyView, GlobalErrorView) conforme GLOBAL_UI_STATE_MAP. | P0 |
| **Blocked (não publicado)** | RequireOperational mostra "Sistema não operacional" com CTA para dashboard; não dentro do dashboard, mas ao aceder a /op/tpv ou /op/kds. | P0 |

---

## 3. Fluxos principais

1. **Primeiro acesso (0 restaurantes):** Login → redirect /bootstrap → cria 1º restaurante + owner → /app/dashboard.
2. **Configurar:** Dashboard → Restaurante, Cardápio, Billing (trial/active) → opcionalmente Equipa, Pagamentos.
3. **Publicar:** Dashboard ou /app/publish → "Publicar restaurante" → isPublished = true → TPV/KDS e web pública disponíveis.
4. **Operar:** Dashboard → atalho para TPV ou KDS (ou /op/tpv, /op/kds); ou abrir turno e usar caixa.
5. **Manter:** Billing, People, Tarefas, Health conforme necessidade.

---

## 4. Referências

- [CAMINHO_DO_CLIENTE.md](../architecture/CAMINHO_DO_CLIENTE.md) — Fluxo completo Landing → Signup → Portal → Billing → Publish → Operação.
- [READY_TO_PUBLISH_CHECKLIST.md](../architecture/READY_TO_PUBLISH_CHECKLIST.md) — Checklist mínima recomendada.
- [MANAGEMENT_ADVISOR_CONTRACT.md](../architecture/MANAGEMENT_ADVISOR_CONTRACT.md) — Banners e checklists; nunca bloqueia.
- [PORTAL_MANAGEMENT_CONTRACT.md](../architecture/PORTAL_MANAGEMENT_CONTRACT.md) — /app/*; gestão; nunca bloqueia.
- [GLOBAL_UI_STATE_MAP.md](./GLOBAL_UI_STATE_MAP.md) — Estados globais de UI no dashboard e painéis.

---

## 5. Critérios de aceite (resumo)

- [ ] Dono acede ao dashboard após login; vê hub com módulos (config, menu, billing, publish, etc.).
- [ ] Pode configurar restaurante, cardápio e billing sem ser bloqueado.
- [ ] Checklist "Ready to Publish" visível como recomendação; botão Publicar sempre utilizável.
- [ ] Após publicar, TPV e KDS ficam acessíveis (gates isPublished); antes disso, mensagem "Sistema não operacional" ao tentar /op/tpv ou /op/kds.
- [ ] Estados loading/empty/error consistentes (GlobalUIState e componentes canónicos).

---

*Documento vivo. Novos módulos ou fluxos no dashboard devem ser alinhados aos contratos e a este PRD.*
