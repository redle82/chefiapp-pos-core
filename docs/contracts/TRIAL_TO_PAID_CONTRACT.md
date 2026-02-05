# Contrato Trial → Pago (Conversão)

**Propósito:** Quando o trial acaba, o cliente tem opções claras: escolher plano pago, continuar em modo leitura, ou exportar dados. Sem agressão; decisão informada.

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md), [CONTRATO_TRIAL_REAL.md](CONTRATO_TRIAL_REAL.md). Billing/Stripe: conforme implementação de faturação do projeto.

---

## Princípios (Trial e Billing)

- **Trial não bloqueia operação:** Enquanto o trial está ativo, o utilizador opera normalmente (TPV, KDS, tarefas). Nenhum bloqueio por "escolher plano" antes do fim do trial.
- **Billing não é pré-requisito para operar:** O acesso ao TPV e à operação não exige plano pago; exige apenas ter concluído o fluxo até "primeira venda" e estar em trial_active (ou active).
- **Suspensão só após uso real:** Bloqueio ou restrições por billing (ex.: past_due, suspended) aplicam-se conforme [BILLING_SUSPENSION_CONTRACT](../architecture/BILLING_SUSPENSION_CONTRACT.md) (ou equivalente), **após** o período de trial ou após falha de pagamento em plano pago — não antes do utilizador ter tido a oportunidade de usar o sistema.

---

## Estado antes

- Trial ativo chegou ao fim do período (ex.: 14 dias).
- SystemState deixa de ser TRIAL; passa a exigir decisão (ACTIVE, SUSPENDED ou modo leitura/export).

---

## Opções (apresentadas de forma clara)

1. **Escolher plano** — converter para subscription paga (ACTIVE). Fluxo de billing/Stripe conforme contrato de faturação do projeto.
2. **Continuar apenas em modo leitura** — acesso limitado (consultar dados, sem novas vendas/operação) até decidir ou exportar.
3. **Exportar dados** — permitir exportação dos dados do restaurante antes de encerrar ou mudar de plano.

---

## Regras

- **Sem agressão:** copy e UX não devem pressionar; opções visíveis e acessíveis.
- Nenhuma opção deve ser escondida ou dificultada (ex.: exportar deve estar disponível).
- Após conversão para pago, aplica-se CONTRATO_TRIAL_REAL (SystemState ACTIVE). Após suspensão ou não renovação, SUSPENDED conforme mesmo contrato.

---

## O que fica de fora

- Detalhe de Stripe, webhooks, preços por plano (podem estar noutros docs de billing).
- Regras de retenção ou reativação de trial — fora do âmbito deste contrato de passagem.
