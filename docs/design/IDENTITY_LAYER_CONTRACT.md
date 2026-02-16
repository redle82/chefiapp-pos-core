# Identity Layer Contract

**Objetivo:** O sistema deve parecer **"O restaurante a usar o ChefIApp OS como motor invisível"**, não "ChefIApp OS a usar o restaurante".

**Regra de ouro:** Restaurante 100% visível nas áreas internas; ChefIApp sempre com logo (ChefIAppSignature), nunca texto sozinho, em posição discreta ("Powered by" / rodapé).

---

## 1. Regras gerais

- **Áreas internas (Admin, Config, Staff, TPV):** Título/header = nome do restaurante + contexto (ex. "Comando Central", "Staff"). ChefIApp nunca como título principal; sempre assinatura com logo (componente ChefIAppSignature).
- **Landing:** Mantém marca forte ChefIApp (sem alteração de identidade neste contrato).
- **Camada visual:** Ver [CHEFIAPP_OS_DESIGN_CONTRACT_V1.md](./CHEFIAPP_OS_DESIGN_CONTRACT_V1.md) para tokens e tom.

---

## 2. ChefIAppSignature

- **Definição:** Componente que mostra sempre **logo + "ChefIApp™"** (e opcionalmente " OS"). Nunca renderizar apenas texto "ChefIApp OS".
- **Variantes:**
  - `full`: "ChefIApp™ OS" (logo + wordmark completo).
  - `powered`: "Powered by ChefIApp™" (ou outro label, ex. "Tecnologia") — logo + "ChefIApp™" sem " OS".
- **Uso:** Rodapé da sidebar Admin, "Powered by" no topbar Admin, rodapé do sheet "Mais" no Staff, qualquer menção discreta à marca em áreas internas.
- **Implementação:** [merchant-portal/src/ui/design-system/sovereign/ChefIAppSignature.tsx](../../merchant-portal/src/ui/design-system/sovereign/ChefIAppSignature.tsx); reutiliza [OSSignature.tsx](../../merchant-portal/src/ui/design-system/sovereign/OSSignature.tsx).

---

## 3. RestaurantHeader

- **Definição:** Componente que mostra o **nome do restaurante** (e, no futuro, logo/cores quando existirem em dados).
- **Props:** `name`, `logoUrl?`, `size?: 'sm' | 'md'`.
- **Uso:** Topbar Admin (esquerda), topo da Sidebar Admin. Dados vêm de `gm_restaurants.name` via `useRestaurantIdentity()`.
- **Implementação:** [merchant-portal/src/ui/design-system/sovereign/RestaurantHeader.tsx](../../merchant-portal/src/ui/design-system/sovereign/RestaurantHeader.tsx).

---

## 4. Onde aplicar

| Área        | Título / header principal     | ChefIAppSignature                         |
|------------|-------------------------------|-------------------------------------------|
| Admin Topbar | RestaurantHeader (nome)       | Direita: "Powered by" + ChefIAppSignature |
| Admin Sidebar | Topo: RestaurantHeader        | Rodapé: ChefIAppSignature (full)          |
| Dashboard  | H1: "{restaurantName} — Comando Central" | — (assinatura no layout)          |
| Staff TopBar | "{restaurantName} — {role/modo}" | Sheet "Mais": "Tecnologia" + ChefIAppSignature |
| TPV / KDS / etc. | document.title: "{restaurantName} — TPV" (ou equivalente) | — |

---

## 5. Dados do restaurante

- **Agora:** Nome em `gm_restaurants.name`; carregado via `useRestaurantIdentity()` (hook partilhado). Retorna `{ identity: { name, logoUrl?, ... }, refreshIdentity }`.
- **Logo do restaurante:** Campo `logo_url` em `gm_restaurants` está implementado. Contrato e anti-regressão: [RESTAURANT_LOGO_IDENTITY_CONTRACT](../architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md). Componente partilhado: `RestaurantLogo` (ui/RestaurantLogo.tsx); exibido na web pública, KDS, TPV, AppStaff.
- **Futuro (fora deste contrato):** Campo `primary_color` em dados do restaurante.

---

## 6. Copy e document.title

- **OSCopy.dashboard:** `comandoCentral: "Comando Central"`; título da página = `{restaurantName} — Comando Central` (fallback quando não há nome: `OSCopy.dashboard.pageTitle`).
- **roleCopy:** `sidebarTitle: "ChefIApp OS"` usado apenas na assinatura do rodapé da sidebar; o topo da sidebar mostra RestaurantHeader, não sidebarTitle.
- **document.title:** Em rotas Admin (DashboardLayout), Staff (StaffModule), TPV, KDS, etc., definir `document.title = \`${restaurantName} — {contexto}\`` quando há nome; fallback "ChefIApp OS" ou "ChefIApp POS" conforme contexto.

---

## Regras a não quebrar

- **Landing:** Sem alterações de identidade; ChefIApp continua em destaque.
- **Rotas e boot:** [CORE_LANDING_ROUTES_CONTRACT](../architecture/CORE_LANDING_ROUTES_CONTRACT.md) e [APPLICATION_BOOT_CONTRACT](../architecture/APPLICATION_BOOT_CONTRACT.md) inalterados.
- **APPSTAFF_VISUAL_CANON / Shell:** Apenas alterações de copy e posição de marca no Staff; não alterar estrutura do Shell (scroll, top bar, bottom nav).
