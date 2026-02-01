# Política de Implementação de Design — Core

## Classificação oficial

**Design System = Implementação subordinada ao UI Contract.**

Não é contrato. Não é fonte de verdade. É **ferramenta** para cumprir [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md).

---

## 1. O que o Design System NÃO define

- **Layout** — Quem define é o Shell (OperationalShell). Fundo, grid, max-width do mundo, minHeight 100vh são do Shell.
- **Fundo** — O Shell aplica VPC (ex.: `#0a0a0a`). Uma tela não escolhe “a página” com seu próprio background.
- **Hierarquia de página** — “Primeira coisa que o olho vê”, estado dominante, são regras do OUC; o DS fornece peças (tipografia, cor, espaçamento), não a lei.

**Regra:** O Shell manda, não o Design System.

---

## 2. O que o Design System FORNECE

- **Componentes** — Botões, inputs, cards, etc., com tokens (cor, raio, altura mínima).
- **Espaçamento interno** — Padding, gap, dentro do conteúdo que a tela entrega.
- **Estados visuais** — Hover, focus, disabled, erro; consistência entre telas que usam o DS.

O DS é **subordinado**: pode mudar, pode ser substituído, desde que o contrato (OUC) seja cumprido.

---

## 3. Quando o Design System NÃO se aplica

- **Rotas fora do OS** — Landing, web pública, páginas de marketing podem ter estética própria; estão fora do OUC.
- **Exceções explícitas** — Documentos que declaram “fora do Shell” (ex.: [LANDING_LAST_APP_MODE.md](../Commercial/LANDING_LAST_APP_MODE.md)) não são governados pelo DS operacional.

---

## 4. Resíduo histórico (tokens/estilos soltos)

Tokens antigos, estilos globais sem referência ao Shell ou ao OUC são **resíduo histórico**: foram feitos, não têm contrato, não são autoridade. Causam bugs visuais quando uma tela “usa alguns e ignora outros”. A correção é: telas dentro do OS usam Shell + PanelRoot e consomem o DS como **implementação subordinada**; não inventam fundo nem layout próprio.

---

## 5. Resumo

| Pergunta                               | Resposta                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| O Design System é contrato do Core?    | **Não.** É implementação subordinada.                                 |
| Quem define layout/fundo no OS?        | **Shell** (CORE_OPERATIONAL_UI_CONTRACT).                             |
| O DS pode ser alterado ou substituído? | **Sim**, desde que o OUC seja cumprido.                               |
| Onde está a lei que o DS cumpre?       | [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md). |
