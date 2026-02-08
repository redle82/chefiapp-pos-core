# Contrato Restaurant Bootstrap (Passo 1 do Onboarding)

**Propósito:** Passo 1 do wizard de onboarding. Criar o restaurante com dados mínimos obrigatórios; estado Restaurant criado, status bootstrap.

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md), [CONTRATO_VIDA_RESTAURANTE.md](CONTRATO_VIDA_RESTAURANTE.md) (BOOTSTRAP_*).

---

## Princípios (Bootstrap canônico)

- **Criação mínima** de restaurante: nome, tipo, país/moeda, contacto opcional.
- **Sem billing** neste passo; billing é posterior ([TRIAL_TO_PAID_CONTRACT](TRIAL_TO_PAID_CONTRACT.md) / [BILLING_AND_PLAN_CONTRACT](BILLING_AND_PLAN_CONTRACT.md)).
- **Sem permissões avançadas**; só identidade operacional para poder avançar para menu e TPV.
- **Só identidade operacional** — suficiente para "quem é este restaurante" e para o próximo passo (menu mínimo).

---

## Estado antes

- User ativo, Trial ativo.
- Restaurant ainda NÃO criado.

---

## Perguntas obrigatórias

- Nome do restaurante
- País / moeda
- Tipo de serviço (mesa / balcão / misto)

---

## Estado após

- **Restaurant:** criado.
- **Status:** bootstrap (pronto para Passo 2 — menu mínimo).

---

## Regra

Obrigatório para avançar no wizard. Sem restaurante criado, não se avança para o menu.

---

## Próximo contrato

[MENU_MINIMAL_CONTRACT.md](MENU_MINIMAL_CONTRACT.md) — Passo 2: criar primeiro menu (mínimo).
