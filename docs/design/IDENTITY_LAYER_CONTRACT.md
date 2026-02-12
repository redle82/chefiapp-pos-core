# Identity Layer — Contrato de Identidade Visual

**Data:** 2026-02-11  
**Status:** Contrato activo  
**Objetivo:** Regra "restaurante protagonista, ChefIApp OS motor invisível". Nas áreas internas o utilizador deve sentir que está no sistema do restaurante, sustentado pelo ChefIApp.

---

## Regra de ouro

- **Restaurante protagonista:** Nas áreas internas (Admin, Config, Staff, TPV), o título e o header mostram o nome do restaurante e o contexto (ex. "Comando Central", "Staff"). O restaurante é a identidade principal.
- **ChefIApp OS = motor invisível:** ChefIApp nunca aparece como título principal nas áreas internas. Aparece sempre como assinatura com logo (componente ChefIAppSignature), em posição discreta: "Powered by ChefIApp™" ou no rodapé da sidebar / do Staff.

---

## Onde se aplica

| Área | Título / Header | ChefIApp |
|------|------------------|----------|
| Landing | Marca forte ChefIApp (sem alteração) | Em destaque |
| Admin / Config | Nome do restaurante + contexto (ex. "Sofia Gastrobar — Comando Central") | "Powered by" no topbar; assinatura no rodapé da sidebar |
| Staff | "Restaurante — Staff" (ou modo) | "Tecnologia ChefIApp™" discreto (ex. rodapé do sheet "Mais") |
| TPV | document.title e contexto com nome do restaurante | Assinatura apenas onde fizer sentido (ex. rodapé) |

---

## Componentes obrigatórios

### ChefIAppSignature

- **Regra:** Sempre **logo real** + "ChefIApp™" (e opcionalmente " OS"); **nunca** estrela, emoji ou apenas texto "ChefIApp OS". Logo = asset oficial (`/Logo Chefiapp.png`), renderizado via OSSignature.
- **Implementação:** [merchant-portal/src/ui/design-system/sovereign/ChefIAppSignature.tsx](../../merchant-portal/src/ui/design-system/sovereign/ChefIAppSignature.tsx) → [OSSignature.tsx](../../merchant-portal/src/ui/design-system/sovereign/OSSignature.tsx).
- **Variantes:** `full` = "ChefIApp™ OS"; `powered` = "Powered by ChefIApp™".
- **Uso:** Rodapé da sidebar admin; "Powered by" no topbar admin; "Tecnologia ChefIApp™" no Staff (sheet Mais).

### RestaurantHeader

- **Função:** Mostrar nome do restaurante (e, no futuro, logo/cores quando existirem em dados).
- **Implementação:** [merchant-portal/src/ui/design-system/sovereign/RestaurantHeader.tsx](../../merchant-portal/src/ui/design-system/sovereign/RestaurantHeader.tsx).
- **Props:** `name`, `logoUrl?`, `size?` ('sm' | 'md').
- **Uso:** Topo da sidebar admin; topbar admin (esquerda).

---

## Dados do restaurante

- Nome (e opcionalmente logo, cores) vêm de `gm_restaurants` via [useRestaurantIdentity](../../merchant-portal/src/core/identity/useRestaurantIdentity.ts) (`identity.name`, `identity.logoUrl`).
- Título das páginas e `document.title` devem usar o nome do restaurante quando disponível (ex. "{restaurantName} — Comando Central").

---

## Referências

- [CHEFIAPP_OS_DESIGN_CONTRACT_V1.md](CHEFIAPP_OS_DESIGN_CONTRACT_V1.md) — Camada visual (paleta, tipografia).
- Tokens: [tokens/colors.ts](../../merchant-portal/src/ui/design-system/tokens/colors.ts), [OSCopy.ts](../../merchant-portal/src/ui/design-system/sovereign/OSCopy.ts).
