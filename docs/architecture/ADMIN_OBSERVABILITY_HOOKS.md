# Ganchos de observabilidade — Admin

**Objetivo:** Contratos de eventos e superfícies críticas para uma futura camada de observabilidade (logs estruturados, métricas, alertas). Nenhum pipeline é implementado neste documento; apenas a definição.

---

## 1. Eventos de navegação e módulo (propostos)

| Evento | Payload sugerido | Onde emitir |
|--------|-------------------|-------------|
| `admin.menu.clicked` | `{ section: string, item: string, path: string }` | AdminSidebar (NavLink / group item click) |
| `admin.config.section.entered` | `{ section: string, path: string }` | Ao montar página sob /admin/config/* (ex.: subscription, delivery) |
| `module.state.changed` | `{ moduleId: string, previousState: string, newState: string }` | ModulesPage ou lógica de ativação/desativação |
| `billing.plan.change.started` | `{ planId: string, source: string }` | SubscriptionPage / PlanCard ao clicar “Mudar plano” |
| `billing.plan.change.succeeded` | `{ planId: string, sessionId?: string }` | Após redirect de Stripe success (ex.: BillingSuccessPage) |
| `billing.plan.change.failed` | `{ planId: string, error: string }` | SubscriptionPage catch ou BillingBroker error |
| `admin.config.done` | `{ path: string }` | Opcional: ao clicar “Voltar ao menu” ou após guardar em páginas críticas |

Formato sugerido: objeto estruturado com `event`, `timestamp`, `payload`, e (quando houver) `userId` / `restaurantId` para correlación. A implementação futura (Sentry, logger, analytics) consumirá estes contratos.

---

## 2. Superfícies críticas para monitorização

Páginas e fluxos que devem ser cobertos por métricas e logs na fase de Observabilidade:

| Superfície | Rota(s) | Métricas / logs sugeridos |
|------------|---------|----------------------------|
| Assinatura / Billing | /admin/config/subscription, /billing/success | Erros de checkout, tempo até redirect Stripe, sucesso/falha de mudança de plano |
| TPV / Operação | /app/tpv, /admin/config/pos-software | Erros de pagamento, falhas de impressora, tempo de abertura de caixa |
| Pedidos / Encomendas | /admin (relatórios, listagens) | Falhas de API ao carregar pedidos |
| Integrações de pagamento | /admin/config/integrations, /admin/config/integrations/payments | Erros ao guardar config, falhas de webhook |
| Módulos | /admin/modules | Ativação/desativação, erros de instalação de dispositivo |
| Configuração geral | /admin/config/general, /admin/config/locations | Erros ao guardar identidade ou localizações |

Estas superfícies serão instrumentadas na **Fase 2 – Observabilidade e Produção** (logs estruturados, alertas, painel de saúde). Os nomes de evento acima servem como contrato para essa instrumentação.

---

## 3. Referências

- [ADMIN_NAVIGATION_MAP.md](ADMIN_NAVIGATION_MAP.md) — rotas e estrutura do Admin  
- [ADMIN_DOMAINS_CONTRACT.md](ADMIN_DOMAINS_CONTRACT.md) — domínios canónicos  
- Plano Reorganizar-admin-por-dominios — Fase 2 Observabilidade
