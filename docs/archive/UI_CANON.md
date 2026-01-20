# UI Canon — Design System Soberano

Data: 2026-01-03
Objetivo: impedir fragmentação do Design System enquanto consolidamos primitives, tokens e padrões.

---

## 1) Fonte única de verdade

- **`merchant-portal/src/ui/design-system/primitives/` é a fonte única** para componentes base.
- Componentes base incluem (não-exaustivo): `Button`, `Input`, `Card`, `Badge`, `Dialog/Modal`, `Select`.

Regra: se você precisa de um componente base, **crie/ajuste em `primitives/`**, não em outra pasta.

---

## 2) Pastas proibidas para novos componentes

- **Não criar novos componentes em `merchant-portal/src/ui/components/`**.
  - Esta pasta é considerada **legacy/deprecated**.
  - Exceção: um `README` explicando depreciação e migração.

---

## 3) Exports sem colisões

- `merchant-portal/src/ui/design-system/index.ts` deve exportar apenas:
  - tokens
  - primitives
  - (opcional) domain/layouts/patterns **desde que não colidam com primitives**

Regra: **não pode existir export de nomes que colidem** entre camadas (ex.: `Button` exportado por `primitives/` e por um wrapper paralelo).

---

## 4) Sem hardcodes críticos (P0)

- Evitar hardcodes de:
  - z-index
  - transitions
  - focus ring/outline

Regra: usar tokens (ex.: `zIndex`, `transitions`, `focus`).

---

## 5) A11y mínima obrigatória

- Componentes interativos devem:
  - suportar teclado
  - expor ARIA básico quando necessário
  - manter focus visível

---

## 6) Critério de revisão

Um PR que viola estas regras deve ser considerado **não-mergeável** até corrigir.
