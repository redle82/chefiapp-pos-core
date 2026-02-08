# READY_TO_PUBLISH_CHECKLIST — Lista operativa para publicar restaurante

**Status:** CANONICAL
**Tipo:** Checklist operativa — o que o cliente deve ter feito antes de “Publicar restaurante”
**Local:** docs/architecture/READY_TO_PUBLISH_CHECKLIST.md
**Hierarquia:** Subordinado a [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) e [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md)

---

## Objetivo

Dar ao cliente uma lista clara e operativa para poder publicar com confiança. Não é gate obrigatório no código; é orientação (advisor). O botão “Publicar” pode estar sempre visível; a checklist ajuda a evitar publicar sem o mínimo configurado.

---

## Checklist mínima (recomendada)

| #   | Item                                           | Onde configurar | Nota                                                     |
| --- | ---------------------------------------------- | --------------- | -------------------------------------------------------- |
| 1   | Restaurante com nome e identidade              | /app/restaurant | Nome, contacto (opcional).                               |
| 2   | Cardápio com pelo menos um item                | /app/menu       | Sem menu, operação não faz sentido.                      |
| 3   | Billing ativo (trial ou active)                | /app/billing    | Sem billing ativo, operação fica bloqueada após publish. |
| 4   | (Opcional) Equipe / utilizadores               | /app/people     | Para multiutilizador e AppStaff.                         |
| 5   | (Opcional) Métodos de pagamento do restaurante | /app/payments   | Para TPV cobrar cliente final.                           |

---

## O que “Publicar” faz (recordar)

- **Efeito:** `isPublished = true`.
- **Libera:** KDS, TPV, presença online (/public/:slug), apps operacionais.
- **Antes de publicar:** Tudo aparece como “Em preparação”, não como erro.

A checklist não bloqueia o clique em “Publicar”; o cliente pode publicar mesmo sem todos os itens. A UI pode mostrar a checklist como progresso (banners/checklists no portal) conforme [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md).

---

## Uso em vendas / onboarding

- Para **vendas:** “Antes de ir ao vivo, confira: identidade, cardápio, faturação.”
- Para **onboarding:** Mostrar checklist no dashboard ou em /app/publish como “Recomendado antes de publicar”.

---

## Referências

- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — Publicação em /app/publish
- [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) — configured / published / operational
- [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md) — banners e checklists

**Violação = usar esta checklist como gate obrigatório que bloqueia o botão Publicar (decisão: onboarding aconselha, não bloqueia).**
