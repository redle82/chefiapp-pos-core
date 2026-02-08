# MENU_FALLBACK_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato de continuidade do fluxo quando o Core não responde (menu)
**Local:** docs/architecture/MENU_FALLBACK_CONTRACT.md
**Hierarquia:** Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md)

---

## Princípio

Garantir **continuidade do fluxo feliz** quando o Core não responde (erro de rede): a UI tenta sempre o Core primeiro; em falha de rede pode usar fallback local e criar produtos locais; o fallback **nunca** é promovido automaticamente a Core nem usado quando o Core responde.

---

## Regras

| Regra | O que significa |
|-------|-----------------|
| UI **tenta Core sempre primeiro** | Toda leitura/escrita de menu (produtos, categorias) chama o boundary ao Core antes de qualquer fallback. |
| Em **erro de rede** pode ler fallback local e criar produtos locais | Se a chamada ao Core falhar por rede (ex.: "Failed to fetch"), a UI pode ler de localStorage e gravar novos produtos em localStorage (ex.: `chefiapp_menu_pilot_{restaurantId}`). |
| Fallback **nunca é promovido** automaticamente a Core | Dados em fallback local não são enviados ao Core sem fluxo explícito e autorizado (ex.: acção do utilizador "Sincronizar" futura). |
| Fallback **nunca é usado** se o Core responder | Se o Core responder com sucesso, só os dados do Core são usados; o fallback é ignorado. |

---

## Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — soberania do Core.
- [docs/product/B1_MENU_CONTENCAO.md](../product/B1_MENU_CONTENCAO.md) — contenção cardápio; diagnóstico e implementação.
- core-boundary: `menuPilotFallback`, ProductReader, MenuWriter.

**Violação = regressão arquitetural.**
