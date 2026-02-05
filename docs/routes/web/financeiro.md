# Financeiro

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/financial`

## 3. Objetivo
Visão de fluxo de caixa, receitas e despesas, resumo por período e eventual reconciliação. O dono usa para tomar decisões com base em números reais (trial ou plano ativo). Fonte de verdade financeira é o Core (CORE_FINANCIAL_SOVEREIGNTY_CONTRACT).

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; estado vazio: "Abra o TPV e faça a primeira venda para ver o fluxo aqui." |
| TRIAL | Permitido; dados reais do trial |
| ACTIVE | Permitido; dados reais |
| SUSPENDED | Permitido (read-only conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `resolveNextRoute` — rota não está em `isWebConfigPath`; após auth e hasOrg, não é operacional → ALLOW.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): dados agregados de vendas, pagamentos, turnos (ex.: `gm_shift_*`, orders/payments no Core ou espelho). RPCs/endpoints esperados: `get_financial_summary`, `get_cash_flow_by_period`, `get_operational_metrics`.
- Backend futuro: contrato = leitura do Core financeiro soberano; sem escrita nesta rota (apenas visualização).
- Pode operar sem backend real? SIM (estado vazio: "Ainda não há movimentos financeiros." / "Abra o TPV e faça a primeira venda.")

## 8. Impacto Operacional
- **TPV:** Leitura de dados gerados pelo TPV (vendas, pagamentos, turnos); nenhuma alteração directa.
- **KDS:** Nenhum.
- **AppStaff:** Nenhum.
- **Relatórios:** Esta rota é vista de relatório; pode alimentar export e dashboards.
- **Billing:** Contexto de subscrição pode ser mostrado noutra rota; esta rota não altera billing.

## 9. Estado Atual
- [ ] Mock
- [x] Parcial
- [ ] Funcional
- Observações: `FinancialDashboardPage` existe; 404 em `get_operational_metrics` ou billing_configs em local não deve bloquear; estado vazio e mensagens de erro humanas.

## 10. Próximos Passos Técnicos
- [ ] Garantir `/financial` tratada como WEB CONFIG em CoreFlow se necessário.
- [ ] Ligar à API/RPC do Core para resumo financeiro.
- [ ] Estado vazio e mensagens de erro humanas: "Não foi possível carregar os dados financeiros. Tente novamente."
