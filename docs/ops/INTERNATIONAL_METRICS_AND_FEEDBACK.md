# Expansão internacional — métricas e feedback

## 1. Objetivo

Definir **métricas de sucesso** para a expansão internacional e um processo simples de recolha de feedback que permita priorizar polish de i18n/billing com base em dados reais em vez de hipóteses.

## 2. Métricas principais (por país/mercado)

Para cada mercado alvo (ex.: BR, PT, ES, US):

- **Aquisição**
  - `trials_started` — número de novos trials iniciados.
  - `visitors_with_intent` — visitantes que chegam a `/auth` ou `/app/billing` após landing.
- **Activação**
  - `restaurants_activated` — nº de restaurantes que completam onboarding e abrem TPV pelo menos 1 vez.
  - `first_order_time` — tempo médio desde criação de conta até 1.º pedido registado.
- **Retenção inicial**
  - `day7_active_rate` — % de contas que ainda tiveram actividade no dia 7.
  - `churn_30d` — cancelamentos ou inactividade ao fim de 30 dias.
- **Qualidade de experiência (i18n/locale/billing)**
  - `support_tickets_i18n` — nº de tickets com tags relacionadas com idioma/formatos/recibos.
  - `support_tickets_billing` — tickets relacionados com billing (currency errada, invoice confusa, etc.).
  - `billing_incidents_count` — nº de entradas em `billing_incidents` por mercado (currency/price mismatch, no_tenant).

## 3. Como recolher e observar

### 3.1 Instrumentação leve

- Landing / portal:
  - Registar eventos analíticos para:
    - `landing_view(country, locale)`.
    - `start_trial(country, locale)`.
    - `open_billing_page(country, locale)`.
- App operacional:
  - Marcar `restaurants_activated` quando:
    - onboarding concluído;
    - 1.º pedido fechado no TPV.
- Billing:
  - A partir da tabela `billing_incidents`, gerar contagens agregadas por:
    - `reason` (`no_tenant`, `currency_mismatch`, `price_mismatch`);
    - `restaurant_id` / país.

### 3.2 Painel mínimo

Antes de expandir para mais países, basta um painel simples (SQL / Metabase / Supabase dashboard) com:

- Tabela `markets` com colunas:
  - `country_code`, `locale_default`, `trials_started`, `restaurants_activated`, `day7_active_rate`, `support_tickets_i18n`, `support_tickets_billing`, `billing_incidents_count`.
- Gráfico de barras:
  - Trials vs activação por mercado.
- Lista de `billing_incidents` mais recentes com detalhes para investigação.

## 4. Processo de feedback qualitativo

Para os primeiros clientes em cada novo mercado:

- **Entrevistas curtas (15–20 min)**:
  - Perguntas focadas em:
    - Clareza da linguagem na UI (EN/ES).
    - Formatos de data/hora e currency em recibos e relatórios.
    - Experiência de checkout Stripe e invoices.
- **Canal dedicado de feedback**:
  - Tag `#intl-feedback` no sistema de suporte ou slack interno.
  - Cada ticket/feedback marcado com:
    - país, idioma preferido, tipo de problema (i18n, billing, docs, performance).

Resultados destas conversas devem alimentar um **backlog de i18n/billing** com:

- Itens classificados por:
  - severidade (bloqueia operação / causa confusão / apenas cosmético);
  - frequência (n.º de relatos).

## 5. Ritmo de revisão

- **Semanal (primeiros 2 meses)**:
  - Rever:
    - Métricas de trials/activação por mercado.
    - Tickets de suporte com tags `i18n` / `billing`.
    - `billing_incidents` recentes.
  - Decidir 1–3 ajustes rápidos (copy, formatos, docs) para a semana seguinte.

- **Mensal (após estabilização)**:
  - Comparar mercados:
    - Onde trials → activação converte melhor?
    - Onde há mais tickets de i18n/billing?
  - Ajustar roadmap de expansão (quais países escalar primeiro).

## 6. Definition of Done para esta fase

- [ ] Métricas chave definidas e documentadas neste ficheiro.
- [ ] Convenção de tagging de tickets de suporte para i18n/billing.
- [ ] Ponto de entrada (mesmo que manual) para ver `billing_incidents` por mercado.
- [ ] Checklist de validação internacional (billing + i18n crítico) alinhado com `BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md`.

