# Checklist — Segundo cliente pagante

**Objetivo:** Repetir o fluxo do primeiro cliente noutro restaurante; validar repetibilidade e incorporar lições do cliente 1.

**Referências:** [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) · [ONDA_4_PILOTO_P1.md](./ONDA_4_PILOTO_P1.md) · [ONDA_4_VALOR_E_ONDA_5.md](./ONDA_4_VALOR_E_ONDA_5.md)

---

## Antes de agendar o segundo

### Lições do primeiro cliente

- [ ] **Feedback do cliente 1** anotado (1–3 pontos: o que faltou, o que atrapalhou).
- [ ] **Ajustes feitos** (copy, UX, BillingPage, GlobalBlockedView, etc.) ou decidido o que fica para depois.
- [ ] **Pré-requisitos técnicos** iguais ao primeiro: Core/BD, Stripe, webhook; tudo já validado no cliente 1.

### Repetibilidade

- [ ] Tempo médio do onboarding (conta → primeiro produto → primeira venda) estimado a partir do cliente 1.
- [ ] Um ponto de melhoria escolhido para testar no cliente 2 (ex.: mensagem de boas-vindas, ordem dos passos, suporte ao pagamento).

---

## Pré-requisitos (antes do dia)

- [ ] **Core/BD:** `billing_status` e fluxo iguais ao do primeiro cliente.
- [ ] **Stripe:** Mesmo preço (ex.: €79); webhook e checkout já usados no cliente 1.
- [ ] **2.º restaurante piloto** escolhido (nome, contacto, acordo: 2 semanas piloto + primeiro mês €79).

---

## Dia do segundo cliente pagante

*(Repetir os mesmos blocos do [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md), com as verificações extra abaixo.)*

### 1. Criar 2.º restaurante piloto

- [ ] Dono/gerente cria conta (landing → "Começar agora" → /auth).
- [ ] Completar bootstrap (criar restaurante).
- [ ] Completar primeiro produto (/onboarding/first-product).
- [ ] Confirmar acesso ao TPV (/op/tpv).
- [ ] **Extra:** Comparar com cliente 1 — algo correu mais rápido ou mais lento? Anotar.

### 2. Operar 1 turno real

- [ ] Abrir turno (caixa) no TPV.
- [ ] Registrar pelo menos 1 pedido real e 1 pagamento (Dinheiro/Cartão/Outro).
- [ ] Fechar turno ou deixar aberto conforme operação.
- [ ] Confirmar no dashboard que pedido e métricas do dia aparecem.

### 3. Ativar agora (Stripe)

- [ ] Utilizador vê BillingBanner (trial) ou acede a /app/billing.
- [ ] Clicar **"Ativar agora"** (checkout Stripe).
- [ ] Completar pagamento no Stripe.
- [ ] Redirecionamento para /billing/success; confirmar mensagem e link para Dashboard/TPV.
- [ ] **Extra:** Houve dúvida ou atrito em relação ao cliente 1? Anotar.

### 4. Cobrar €79

- [ ] Confirmar que o pagamento €79 foi registado no Stripe e que `billing_status` do restaurante passou a `active` (se aplicável).

### 5. Feedback

- [ ] Perguntar: algo que faltou? algo que atrapalhou?
- [ ] Anotar 1–3 pontos e comparar com o feedback do cliente 1 (padrões? melhorias?).

---

## Critério de sucesso

- 2 restaurantes reais operaram pelo menos 1 turno no ChefIApp.
- 2 pagamentos €79 recebidos via Stripe.
- Zero bloqueador crítico não resolvido OU bloqueador registado e resposta definida.
- Evidência de repetibilidade: segundo onboarding concluído sem desvios graves em relação ao primeiro.

---

## Próximo passo após este checklist

- **Bloco 1 Piloto:** Lista 10 alvos, agendar mais instalações ([ONDA_4_PILOTO_P1.md](./ONDA_4_PILOTO_P1.md)).
- **Bloco 2 Piloto:** Métricas, report 2 semanas, go/no-go ([ONDA_4_PILOTO_P2.md](./ONDA_4_PILOTO_P2.md)).
- **Onda 5:** Kick-off Owner Dashboard quando critérios de Onda 4 estiverem satisfeitos ([ONDA_4_VALOR_E_ONDA_5.md](./ONDA_4_VALOR_E_ONDA_5.md) §22–24).
