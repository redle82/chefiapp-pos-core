# Rota — Financeiro (Web de Configuração)

**Path exato:** `/financial`  
**Tipo:** WEB CONFIG  
**Estado atual:** UI PARCIAL (página existe; integração Core/backend variável).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** Visão de fluxo de caixa, receitas e despesas, resumo por período e eventual reconciliação. O dono usa para tomar decisões com base em números reais (trial ou plano ativo).
- **Para quem é:** Dono apenas — web de configuração.
- **Em que momento do ciclo de vida:** TRIAL e ACTIVE; em SETUP pode mostrar estado vazio (“Ainda não há movimentos”). SUSPENDED: apenas leitura se política assim o definir.

---

## 2. Rota & Acesso

- **Path:** `/financial`
- **Tipo:** WEB CONFIG.
- **Guard aplicado:** CoreFlow — ALLOW para hasOrg; nunca bloquear por systemState nem por billing nesta rota.
- **Comportamento por SystemState:**
  - **SETUP:** ALLOW; estado vazio: “Abra o TPV e faça a primeira venda para ver o fluxo aqui.”
  - **TRIAL:** ALLOW; dados reais do trial.
  - **ACTIVE:** ALLOW; dados reais.
  - **SUSPENDED:** ALLOW leitura; escritas bloqueadas conforme política.

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant, Orders (totais, por estado), Payments, Shifts (abertura/fecho de caixa). O Core financeiro soberano é o Docker Core (CORE_FINANCIAL_SOVEREIGNTY_CONTRACT).
- **Entidades escritas:** Ajustes manuais só se permitidos por contrato (ex.: notas de despesa); normalmente leitura de dados já persistidos pelo TPV/Core.
- **Eventos gerados:** Leitura de eventos já existentes (ORDER_PAID, SHIFT_CLOSED, etc.); não inventar “demo”.

---

## 4. Backend & Dados

- **Tabelas envolvidas:** Dados agregados de vendas, pagamentos, turnos (ex.: `gm_shift_*`, tabelas de orders/payments no Core ou espelho no Supabase). RPCs ou endpoints de relatório: ex. `get_financial_summary`, `get_cash_flow_by_period`.
- **Backend local:** Docker Core / Supabase local como fonte; se RPC falhar ou não existir, estado vazio ou mensagem “Dados financeiros indisponíveis. Verifique a ligação ao Core.”
- **Estado vazio honesto:** “Ainda não há movimentos financeiros.” / “Abra o TPV e faça a primeira venda.”

---

## 5. UI / UX Esperada

- **Estados:** (1) **Vazio** — sem vendas/turnos; CTA: “Abrir TPV” ou “Ir ao Dashboard”. (2) **Em uso** — resumo por período, gráfico ou tabela de receitas/despesas, filtros. (3) **Erro** — “Não foi possível carregar os dados financeiros. Tente novamente.”
- **Mensagens humanas:** Sem “demo”; trial = dados reais.
- **CTAs:** “Ver por dia/semana/mês”, “Exportar”, “Ir ao TPV”.

---

## 6. Integração com Outras Rotas

- **De onde vem:** Dashboard (módulo Financeiro), Billing (contexto subscrição), relatórios (/app/reports/finance se existir).
- **Para onde vai:** Dashboard, TPV, Billing, Compras (se despesas de compras aparecerem aqui).
- **Dependências:** Dados dependem de TPV e turnos em uso; a rota em si não bloqueia nem é bloqueada por billing.

---

## 7. Regras de Negócio

- **Permitido:** Ver totais, filtros por período, export; dados sempre reais em trial/active.
- **Bloqueado:** Não bloquear acesso à rota por “plano não pago”; não mostrar dados fictícios como “demo”.
- **Regra de ouro:** Fonte de verdade financeira é o Core (Docker); esta rota é vista sobre esses dados.

---

## 8. Estado Atual

- **Estado:** UI PARCIAL — `FinancialDashboardPage` existe; relatórios e RPCs podem estar parciais.
- **Próximo passo técnico:** (1) Garantir `/financial` tratada como WEB CONFIG em CoreFlow se necessário; (2) Ligar à API/RPC do Core para resumo financeiro; (3) Estado vazio e mensagens de erro humanas.
