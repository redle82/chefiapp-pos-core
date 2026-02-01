# OPERATIONAL_UI_RESILIENCE_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato de resiliência da UI operacional (TPV/KDS)
**Local:** docs/architecture/OPERATIONAL_UI_RESILIENCE_CONTRACT.md
**Hierarquia:** Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) e [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md)

---

## Princípio

TPV e KDS **nunca crasham visivelmente**: a UX e a soberania são preservadas através de ErrorBoundary em rotas `/op/*`, mensagens neutras ao utilizador (sem stack, sem Docker/Supabase/RPC) e fallback ou estado degradado em vez de ecrã branco.

---

## Regras

| Regra | O que significa |
|-------|-----------------|
| Todo **/op/** deve ter ErrorBoundary | As rotas operacionais (/op/tpv, /op/kds) estão envolvidas por ErrorBoundary que captura erros de render e evita ecrã branco. |
| **Mensagens neutras** ao utilizador | Erros expostos ao utilizador não incluem stack trace, referências a Docker, Supabase ou RPC; usar funções como `toUserMessage` para traduzir erros técnicos em mensagens seguras. |
| Falha resulta em **estado degradado ou fallback**, nunca ecrã branco | Em caso de erro não recuperável no componente, o ErrorBoundary mostra UI de fallback (ex.: "Algo correu mal. Volte ao painel.") em vez de crash visível. |

---

## Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — soberania do Core.
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — rotas /op/tpv, /op/kds.
- [docs/product/B2_TPV_CONTENCAO.md](../product/B2_TPV_CONTENCAO.md) — contenção TPV; ErrorBoundary, toUserMessage.
- [docs/product/B4_KDS_CONTENCAO.md](../product/B4_KDS_CONTENCAO.md) — contenção KDS; ErrorBoundary, toUserMessage.
- App.tsx: ErrorBoundary em /op/tpv e /op/kds; toUserMessage (ou equivalente) para mensagens neutras.

**Violação = regressão arquitetural.**
