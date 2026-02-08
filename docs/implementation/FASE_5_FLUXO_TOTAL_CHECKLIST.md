# FASE 5 — Fluxo Total: checklist de validação end-to-end

**Checklist de Validação End-to-End (Demo → Operação → Billing)**

---

## Objetivo

Documentar e validar o fluxo humano completo do ChefIApp: desde a entrada na web pública, passando pelo demo guiado, criação do restaurante, operação real em modo trial (14 dias) e ativação do pagamento via Stripe em modo demo.

Este documento é a fonte única de verificação para garantir que um restaurante novo consegue usar o sistema do zero até ao billing sem loops, bloqueios ou ambiguidades.

---

## Contexto técnico

- **App:** merchant-portal
- **Rotas principais:** `/`, `/demo-guiado`, `/auth`, `/bootstrap`, `/onboarding/first-product`, `/op/tpv`, `/op/kds`, `/app/dashboard`, `/app/tasks`, `/app/config/modules`, `/app/billing`
- **Stripe:** Modo demo / test — `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_*`; cartão de teste: 4242 4242 4242 4242
- **Referências cruzadas:** [FASE_5_DEMO_GUIADO_3_MIN.md](FASE_5_DEMO_GUIADO_3_MIN.md), [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md), [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md), [CONTRATO_VIDA_RESTAURANTE.md](../contracts/CONTRATO_VIDA_RESTAURANTE.md), [CONTRATO_ENTRADA_CANONICA.md](../contracts/CONTRATO_ENTRADA_CANONICA.md)

---

## Pré-requisitos

- Servidor merchant-portal a correr (ex.: `npm run dev` em merchant-portal; porta 5175).
- Stripe em modo test: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_*`, `VITE_STRIPE_PRICE_ID` (plano €79); webhook em modo test.
- Core/Docker ou Supabase conforme ambiente (Docker: `./start-local.sh` ou equivalente).

---

## Checklist por fase

### Fase 1 — Entrada

**Rotas:** `/`, `/auth`, `/demo-guiado` (opcional)

**Descrição:** O utilizador entra pela landing canónica. CTA principal "Começar agora" → `/auth`. Opcional: "Ver o sistema a funcionar (3 min)" → `/demo-guiado` (ao sair → `/auth`).

**Verificações:**

- Landing visível, sem ambiguidade (headline operacional).
- CTA principal: "Começar agora" → `/auth`.
- Opcional: link "Ver o sistema a funcionar (3 min)" → `/demo-guiado`; demo tem 4 passos; botão final "Criar o meu restaurante" → `/auth`.

**Resultado esperado:** Utilizador em `/auth` (directamente ou após demo).

---

### Fase 2 — Auth

**Rota:** `/auth`

**Descrição:** Registo/login ou simular registo (piloto). Sem estado "demo" paralelo.

**Verificações:**

- Não ocorre loop para landing.
- Opção "Simular Registo (Piloto)" disponível (modo local).
- Após autenticação, destino `/bootstrap` (BOOTSTRAP_REQUIRED).

**Resultado esperado:** Redireção para `/bootstrap` (BOOTSTRAP_REQUIRED).

---

### Fase 3 — Configuração Web / Bootstrap

**Rota:** `/bootstrap`

**Descrição:** Criação do restaurante (tenant).

**Verificações:**

- Formulário de criação carrega corretamente.
- Campos mínimos: nome, tipo, país, contacto.
- Conclusão cria restaurante.
- Opção "Modo demonstração" funcional.
- Conclusão leva a `/onboarding/first-product`.

**Resultado esperado:** Restaurante criado, estado = bootstrap concluído.

---

### Fase 4 — Primeiro Produto

**Rota:** `/onboarding/first-product`

**Descrição:** Configuração do primeiro item do menu.

**Verificações:**

- Página carrega sem erro.
- Criar produto (nome + preço).
- Salvar produto.
- Navegação automática para `/op/tpv`.

**Resultado esperado:** TPV acessível com produto criado.

---

### Fase 5 — Instalar TPV e KDS

**Rotas:** `/app/config/modules`, `/op/tpv`, `/op/kds`

**Descrição:** Garantir que os módulos operacionais estão ativos.

**Verificações:**

- Página de módulos acessível.
- TPV e KDS visíveis como instalados (ou default).
- Sidebar/Admin permite acesso a TPV e KDS.
- `/op/tpv` e `/op/kds` carregam.

**Resultado esperado:** Ambiente operacional funcional.

---

### Fase 6 — Criar Tarefas

**Rota:** `/app/tasks`

**Descrição:** Utilizar o sistema de tarefas como restaurante novo.

**Verificações:**

- TaskDashboardPage carrega.
- Lista de tarefas visível.
- Sugestões automáticas aparecem.
- Criar tarefa manual funciona.

**Resultado esperado:** Sistema de tarefas ativo e coerente.

---

### Fase 7 — Fazer um Pedido

**Rota:** `/op/tpv`

**Descrição:** Simular operação real.

**Verificações:**

- Abrir turno (se aplicável).
- Criar pedido (mesa + itens).
- Pedido aparece no KDS.
- Pedido visível no dashboard.

**Resultado esperado:** Fluxo TPV → KDS → Dashboard consistente.

---

### Fase 8 — Usar o Restaurante como Novo

**Rotas:** `/app/dashboard`, `/op/kds`

**Descrição:** Operação diária com restaurante recém-criado.

**Verificações:**

- Dashboard mostra métricas iniciais.
- KDS reage aos pedidos.
- Nenhum bloqueio por billing.
- Estado do restaurante = trial.

**Resultado esperado:** Restaurante utilizável "como novo".

---

### Fase 9 — Trial (14 dias)

**Estado:** `billing_status = trial`

**Descrição:** Período de experimentação sem bloqueio.

**Verificações:**

- BillingBanner indica trial ativo.
- TPV/KDS continuam funcionais.
- Nenhum paywall forçado.

**Resultado esperado:** Uso livre durante trial.

---

### Fase 10 — Billing e Pagamento (Stripe Demo)

**Rota:** `/app/billing`

**Descrição:** Ativação do plano pago (€79) em modo demo.

**Verificações:**

- Página de billing acessível.
- Botão "Ativar agora".
- Checkout Stripe abre (modo test).
- Cartão 4242 4242 4242 4242 funciona.
- Redireção de sucesso.
- Status da subscrição atualizado.

**Resultado esperado:** Pagamento concluído sem erro (modo demo).

---

## Checklist de execução (assinalar manualmente)

- [ ] **Fase 1** — Entrada e demo (landing → demo guiado → /auth)
- [ ] **Fase 2** — Auth (sem loop para landing; destino /bootstrap)
- [ ] **Fase 3** — Bootstrap (criar restaurante)
- [ ] **Fase 4** — Primeiro produto (criar produto → /op/tpv)
- [ ] **Fase 5** — Instalar TPV e KDS (módulos / sidebar)
- [ ] **Fase 6** — Criar tarefas (/app/tasks)
- [ ] **Fase 7** — Fazer um pedido (TPV: turno + pedido)
- [ ] **Fase 8** — Usar o restaurante como novo (dashboard, KDS, operação)
- [ ] **Fase 9** — Trial 14 dias (billing_status = trial; sem bloqueio)
- [ ] **Fase 10** — Billing e pagamento Stripe demo (checkout test → success)

---

## Resultado final

**Data:** ********\_\_\_\_********
**Executor:** ********\_\_\_\_********

- [ ] **PASSOU**
- [ ] **FALHOU**

**Notas:**

---

---

---

## Conclusão

Se todas as fases acima passam, o ChefIApp está oficialmente validado como:

**Um sistema onde um restaurante entra como humano, entende, testa, opera, confia — e paga.**

---

## Próximos passos possíveis

1. Executar este checklist manualmente (1ª validação real).
2. Criar E2E parcial (fases 1–4 ou 1–8) — já existe: [fluxo-total.spec.ts](../../merchant-portal/tests/e2e/fluxo-total.spec.ts).
3. Congelar este documento como baseline de release.

---

## E2E (opcional)

Spec: [merchant-portal/tests/e2e/fluxo-total.spec.ts](../../merchant-portal/tests/e2e/fluxo-total.spec.ts) — valida passos 1–4 (landing → demo → auth; bootstrap/first-product carregam) e smoke das rotas TPV e dashboard. Billing/Stripe (fase 10) fica manual.

---

## Rotas de referência

| Rota                        | Descrição                            |
| --------------------------- | ------------------------------------ |
| `/`                         | Landing                              |
| `/demo-guiado`              | Demo guiado (4 passos)               |
| `/auth`                     | Autenticação / Explorar demonstração |
| `/bootstrap`                | Criar restaurante                    |
| `/onboarding/first-product` | Primeiro produto                     |
| `/app/config/modules`       | Módulos (TPV, KDS, etc.)             |
| `/app/tasks`                | Dashboard de tarefas                 |
| `/op/tpv`                   | TPV (caixa)                          |
| `/op/kds`                   | KDS (cozinha)                        |
| `/app/dashboard`            | Comando central                      |
| `/app/billing`              | Faturação e checkout Stripe          |
