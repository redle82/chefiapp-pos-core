# Contrato de Visibilidade Financeira — AppStaff

## Lei do sistema

**O AppStaff vê, mas não controla. Entende, mas não edita.**

Este documento é subcontrato do [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md). Aqui define-se o que staff e gerente **podem ver** em termos financeiros no terminal humano — nunca confundir com controlo (fechar contas, alterar preços, ver relatórios completos). Tudo vem do Core.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Princípio

- **Staff:** Vê impacto do próprio trabalho (ex.: ticket médio do turno, metas simples). Não vê margens, custos, relatórios completos.
- **Gerente:** Vê resumo financeiro do turno, desvios, alertas. Não vê billing nem integrações críticas (isso é backoffice/dono).

O AppStaff **nunca** edita preços, descontos globais ou relatórios fiscais. Pode executar acções permitidas no TPV (ex.: fechar mesa, aplicar desconto local conforme regras do Core).

---

## 2. O que staff pode ver (exemplos)

| Dado                        | Descrição                                              | Fonte |
| --------------------------- | ------------------------------------------------------ | ----- |
| Ticket médio do turno       | Média por venda no meu turno                           | Core  |
| Metas simples               | Ex.: “N vendas hoje”, “objetivo de faturação do turno” | Core  |
| Impacto do próprio trabalho | Ex.: vendas atribuídas a mim, itens servidos           | Core  |

---

## 3. O que gerente pode ver (exemplos)

| Dado                       | Descrição                                                   | Fonte |
| -------------------------- | ----------------------------------------------------------- | ----- |
| Resumo financeiro do turno | Total vendido, número de transacções, ticket médio do turno | Core  |
| Desvios                    | Ex.: diferença face à meta, alertas de caixa                | Core  |
| Alertas                    | Ex.: fecho pendente, anomalia de valor                      | Core  |

---

## 4. O que o AppStaff não faz

- Mostrar relatório financeiro completo (margens, custos, P&amp;L).
- Permitir edição de preços, impostos ou configuração fiscal.
- Expor billing, subscrições ou integrações de pagamento (backoffice).
- “Calcular” metas ou desvios; apenas mostra o que o Core expor.

---

## 5. Acções permitidas (TPV) vs visibilidade

- **Fechar mesa / conta** — Pode ser permitido a staff (caixa) ou gerente conforme [CHEFIAPP_ROLE_SYSTEM_SPEC.md](../CHEFIAPP_ROLE_SYSTEM_SPEC.md) e regras do TPV.
- **Desconto local** — Se o Core permitir (ex.: até X%), o AppStaff expõe a acção; não inventa limites.
- **Ver total da mesa** — Sim; é consciência operacional e visibilidade mínima para servir.

O contrato de **visibilidade** diz o que se **vê**. O contrato de **papéis** e de **TPV** diz o que se **pode fazer**. O AppStaff junta os dois sem ultrapassar.

---

## 6. Resumo

- Staff: vê ticket médio do turno, metas simples, impacto próprio; não vê finanças completas.
- Gerente: vê resumo do turno, desvios, alertas; não vê billing/integrações.
- AppStaff mostra; Core calcula e expor. Nada de edição de preços/fiscal no terminal.
