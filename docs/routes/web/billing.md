# Billing & Pagamentos

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/app/billing`, `/billing/success`

## 3. Objetivo
Subscrição e gateways de pagamento: o dono gere o plano (trial, ativo, suspenso), acede ao checkout Stripe e ao sucesso do pagamento. Billing está ancorado no dashboard (card "Plano & Faturação" quando systemState === TRIAL, bloco "Faturação" na sidebar). Não bloquear outras rotas web por billing — apenas esta rota mostra/activa o fluxo de pagamento.

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; pode mostrar estado trial ou CTA para plano |
| TRIAL | Permitido; card no dashboard e acesso a /app/billing para escolher plano |
| ACTIVE | Permitido; gestão de subscrição |
| SUSPENDED | Permitido (read-only ou aviso; renovar/reativar conforme política) |

> Nunca bloquear acesso a outras rotas web por billing. Billing não bloqueia a web de configuração.

## 6. Conexão com o Core
- CoreFlow: `isWebConfigPath("/app/billing")` e `/billing/success` = true → ALLOW para hasOrg.
- Guards aplicáveis: não usar guards operacionais; nunca bloquear outras rotas por "não pagou".
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): tabela lógica `billing_configs` ou equivalente; Stripe (price_id, customer_id, subscription_id). Webhook: stripe-billing-webhook. Variável VITE_STRIPE_PRICE_ID.
- Backend futuro: contrato = webhook Stripe actualiza estado de billing; UI lê estado e redireciona para Stripe Checkout quando aplicável.
- Pode operar sem backend real? Parcial (UI pode mostrar estado vazio ou "Configuração de faturação indisponível"; checkout real precisa Stripe e webhook).

## 8. Impacto Operacional
- **TPV:** Nenhum directo; estado SUSPENDED pode afectar política de uso (fora do scope desta rota).
- **KDS:** Nenhum.
- **AppStaff:** Nenhum.
- **Relatórios:** Nenhum.
- **Billing:** Impacto directo — esta rota é a interface de billing; altera estado de subscrição (trial/active/suspended) via Stripe e webhook.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Funcional
- Observações: BillingPage existe; integração Stripe e webhook documentada; 404 em billing_configs em local pode ocorrer — UI deve tratar estado vazio/erro sem bloquear.

## 10. Próximos Passos Técnicos
- [ ] Garantir que 404 em billing_configs não quebra render; estado vazio ou mensagem humana.
- [ ] Alinhar redirect /billing/success com DashboardPortal (GlobalLoadingView enquanto navega, nunca return null).
