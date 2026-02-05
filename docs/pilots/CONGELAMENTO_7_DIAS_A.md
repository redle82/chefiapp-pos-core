# Congelamento consciente — 7 dias (A)

Checklist para o período de uso real sem alterações de código no Menu Builder V1. Objetivo: observar fricção antes de tocar em contratos downstream ou em novas features.

---

## Duração

**7 dias** a contar da data em que inicias o uso regular (menu + TPV + publicação).

---

## O que fazer

- Usar o sistema em cenário real: criar/editar menu no Menu Builder, publicar restaurante, abrir TPV e fazer vendas (ou simulações diárias).
- **Não** alterar código do Menu Builder nem da cadeia menu → publicação → TPV durante este período.
- Anotar (lista curta, não precisa ser formal):
  - Onde sentiste atrito no **preço** (digitação, edição, listagem).
  - Onde sentiste atrito no **preset** (tipo de negócio, aplicar exemplo).
  - Onde sentiste atrito na **publicação** (fluxo bootstrap/onboarding, “publicar”).
  - Onde sentiste atrito no **TPV** (produtos que não aparecem, preço errado, erro ao criar pedido).

---

## O que NÃO fazer

- Não implementar novas formas de criar menu (Foto, PDF, Link, IA) durante o congelamento.
- Não refatorar contratos downstream (B) nem automatizar a primeira venda auditável (C) até ao fim dos 7 dias, salvo correção de bug crítico.

---

## Após os 7 dias

- Se a fricção for pouca ou nula: considerar **C (Primeira venda auditável)** como próximo passo — fechar o fluxo menu → publicação → venda → core financeiro com um teste explícito.
- Se houver fricção clara: priorizar correções pontuais no Menu Builder ou no fluxo de publicação; depois avançar para C.
- **B (Contratos downstream)** fica para quando houver sintomas concretos (ex.: TPV a consumir dados fora do contrato do menu) ou após C para blindar consumidores.

---

## Referências

- [MENU_BUILDER_P0_P1.md](./MENU_BUILDER_P0_P1.md) — o que está implementado no Menu Builder.
- [MENU_CORE_CONTRACT.md](../architecture/MENU_CORE_CONTRACT.md) — contrato arterial do menu.
- [PRIMEIRA_VENDA_AUDITAVEL_C.md](./PRIMEIRA_VENDA_AUDITAVEL_C.md) — fluxo e checklist para a primeira venda auditável (próximo passo após o congelamento).
