# Lista exacta de cortes — FASE 1 (refactor pós-freeze)

**Propósito:** Paths concretos para DELETE na FASE 1 (limpeza estrutural). Regra: se só "explica", "promete" ou "simula" → corte.

**Contexto:** [refactor_estrutural_pós-freeze](.cursor/plans/refactor_estrutural_pós-freeze_2e7993e4.plan.md); [AUDITORIA_RITUAL_CORTE](AUDITORIA_RITUAL_CORTE.md); [LEGACY_CODE_BLACKLIST](../ops/LEGACY_CODE_BLACKLIST.md).

---

## 1. UX legado — DELETE

| # | Path | Motivo |
|---|------|--------|
| 1 | `merchant-portal/src/pages/Demo/DemoTourPage.tsx` | Nunca referenciado em rotas; dead code. |
| 2 | `merchant-portal/src/components/DemoExplicativo/DemoExplicativoCard.tsx` | Só "explica"; link para `/demo-guiado`. |
| 3 | `merchant-portal/src/components/DemoExplicativo/demoExplicativoContent.ts` | Conteúdo do demo explicativo. |
| 4 | `merchant-portal/src/components/DemoExplicativo/index.ts` | Barrel do DemoExplicativo. |
| 5 | `merchant-portal/src/cinematic/` (directório inteiro) | Fluxo explicativo; não executa ritual operacional. |
| 6 | `merchant-portal/src/ui/design-system/components/GlobalPilotBanner.tsx` | Banner "piloto"; removido da UI (contrato). |
| 7 | `merchant-portal/src/pages/Demo/DemoGuiadoPage.tsx` | Corte: rota `/demo-guiado` passa a redireccionar para `/auth`. |

**Nota:** DemoExplicativo é substituído em KDSMinimal e TPVMinimal por mensagem mínima ("Complete o bootstrap" / estado Kernel). Cinematic: dependentes (BootstrapComposer, PublicMenuContext, PermanentSuggestionPopup) migrados antes do delete.

---

## 2. Guards duplicados — DELETE

| # | Path | Motivo |
|---|------|--------|
| 8 | `merchant-portal/src/core/flow/OperationGate.tsx` | Não está nas rotas do App; apenas FlowGate + ORE estão. |
| 9 | `merchant-portal/src/core/flow/OperationGate.test.tsx` | Teste do OperationGate; morre junto. |

---

## 3. Legado que depende de cinematic — migrar depois cortar

| # | Acção | Detalhe |
|---|--------|---------|
| - | BootstrapComposer | Usa ProductProvider, OnboardingEngineProvider, AutopilotProvider de cinematic; não é usado em nenhuma árvore de rotas → DELETE `merchant-portal/src/core/bootstrap/BootstrapComposer.tsx`. |
| - | PublicMenuContext | Trocar `useProducts` de cinematic por leitura via core-boundary (ProductReader) ou hook mínimo. |
| - | PermanentSuggestionPopup | Trocar import de `Product` de cinematic por tipo em `core/contracts/Menu.ts` (MenuItem) ou `types/product.ts`. |

---

## 4. Rotas e referências a actualizar

- `App.tsx`: rota `/demo-guiado` → `<Navigate to="/auth" replace />`; remover import de DemoGuiadoPage.
- `App.tsx`: rota `/demo` já redirecciona para `/auth`; manter.
- Links para `/demo-guiado` (Landing Hero, AuthPage, ProductFirstLandingPage, DemoExplicativoCard antes de delete) → `/auth`.
- `LifecycleStateContext.tsx`, `CoreFlow.ts`: remover `/demo-guiado` das listas de rotas públicas se deixar de existir página.
- `ui/design-system/components/index.ts`: remover export de GlobalPilotBanner.

---

## 5. Após cada DELETE

- Actualizar [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md) §2 (módulos proibidos de reintrodução).
- Rodar testes soberanos (FASE 4).

---

Última actualização: Lista exacta FASE 1; refactor pós-freeze.
