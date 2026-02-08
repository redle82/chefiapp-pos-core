# Menu Builder P0/P1 — O que mudou

Resumo das alterações do MegaFix Menu Builder + Design System (plan anexo). ORE/Core não consomem DS; DS é pele no merchant-portal.

---

## FASE 1 (P0) — Fix do PREÇO

- **Util:** `merchant-portal/src/pages/MenuBuilder/utils/moneyInput.ts`
  - `parseMoneyInput(raw)` → `{ rawSanitized, valueNumber | null }` (aceita vírgula e ponto).
  - `formatMoney(valueNumber)` → string "2,50" para exibição.
- **MenuBuilderCore:** Campo Preço passou de `type="number"` (setas) para `type="text"` + `inputMode="decimal"`; estado `priceInput` (string); validação no submit com `parseMoneyInput`; submit bloqueado se preço inválido; ao guardar, `price_cents = Math.round(valueNumber * 100)`.

---

## FASE 2 (P0) — Rotas sem bloqueio

- **FlowGate:** Pass-through P0 alargado a `/menu-builder`: com `restaurant_id` válido e docker/local, `/menu-builder`, `/dashboard` e `/config/*` abrem direto, sem timeout nem mensagem de acesso.

---

## FASE 3 (P1) — Cinco formas de criar menu

- **Tabs:** [Manual] [Foto] [PDF] [Link] [IA].
- **Manual:** Formulário existente (preço já corrigido).
- **Foto / PDF / Link / IA:** Stubs elegantes (card com "Funcionalidade em breve" e "Funcionalidade não ativa. Use a opção Manual."); sem chamadas a APIs; zero 404.

---

## FASE 4 (P1) — Design System

- **MenuBuilderCore:** Form usa primitivos do DS: `Input`, `Select`, `Button`, `Card`; tokens `spacing`; container do form e stub das outras tabs em `Card`; botões "Criar Item", "Guardar", "Cancelar", "Usar menu de exemplo", "Editar", "Deletar" em `Button` do DS.
- **FirstProductPage:** Botão principal "Criar e abrir TPV" passou a usar `Button` do DS.
- **Tokens:** Export de `spacing` em `ui/design-system/tokens/index.ts` para uso no Menu Builder.

---

## FASE 5 — Smoke test (checklist)

1. Abrir `/menu-builder`.
2. Criar item com preço digitado (ex.: "2,50" e "0,09"); confirmar na lista.
3. Editar e eliminar item; confirmar que continua a funcionar.
4. Console sem 404 relacionados ao menu-builder.
5. Navegar para `/dashboard` e confirmar que não trava (FlowGate ok).

---

## Entregáveis

- Patch com alterações por fase (FASE 1–5).
- Este ficheiro: `docs/pilots/MENU_BUILDER_P0_P1.md`.

---

## Implementação concluída (2026-02-03)

- **FASE 1:** Já estava implementada (moneyInput.ts, priceInput, parseMoneyInput no submit).
- **FASE 2:** FlowGate já incluía `/menu-builder` no pass-through.
- **FASE 3:** Tabs alteradas para [Manual] [Foto] [PDF] [Link] [IA]; conteúdo "Preset" (tipo de negócio + aplicar preset) integrado no topo da tab Manual; stubs para Foto/PDF/Link/IA com copy por tab.
- **FASE 4:** MenuBuilderCore: uso de `radius` (tokens) em vez de `theme.radius`; campo Tempo (min) passou a usar primitivo `Input`; BootstrapPage: form de criar restaurante com `Input`, `Select`, `Button`, `Card` e tokens `colors`/`spacing`; FirstProductPage: form com `Input`, `Button`, `Card` e tokens.
- **FASE 5:** Smoke e2e (11 testes) passou; type-check e build ok.
