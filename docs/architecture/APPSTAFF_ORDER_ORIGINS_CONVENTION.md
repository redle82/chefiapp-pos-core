# Convenção: Origens de Pedido do AppStaff / Comandeiro

**Objetivo:** Alinhar o modelo conceitual e a exibição de origem dos pedidos criados no AppStaff (Comandeiro), reconhecendo que **dono, gerente e garçom** podem fazer pedidos — a origem não é sinónimo de "garçom".

**Referências:** `docs/ops/SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md`, `core-engine/contracts/OrderOrigin.ts`, `merchant-portal/src/core/contracts/OrderOrigin.ts`.

---

## 1. Decisão conceitual

- **Superfície:** pedidos criados no fluxo Comandeiro (`/app/waiter`, TablePanel, MiniPOS).
- **Papel do operador:** quem está a operar pode ser **waiter** (garçom), **manager** (gerente) ou **owner** (dono). Em operação pequena, o dono pode ser quem atende e lança pedidos.
- **Regra:** não forçar toda a origem AppStaff a ser exibida como "GARÇOM". A origem deve refletir **quem fez o pedido** (papel), não apenas "veio do app de salão".

---

## 2. Valores de origem (sync_metadata.origin)

| Valor             | Significado                    | Quem pode gerar      |
|-------------------|--------------------------------|----------------------|
| `APPSTAFF`        | Pedido feito por staff com papel **waiter** (garçom) | Garçom no Comandeiro |
| `APPSTAFF_MANAGER`| Pedido feito por staff com papel **manager**        | Gerente no Comandeiro|
| `APPSTAFF_OWNER` | Pedido feito por staff com papel **owner**           | Dono no Comandeiro    |

Definidos em: `merchant-portal/src/pages/Waiter/TablePanel.tsx` (role do StaffContext → `orderOrigin`).

---

## 3. Convenção de exibição (badge / label)

Em KDS, TPV/KDS e mini KDS do AppStaff, usar labels legíveis e distintas:

| Origem (valor)     | Label no badge | Cor (ex.) | Ícone |
|--------------------|----------------|-----------|--------|
| `APPSTAFF`         | **SALÃO**      | Azul      | 📱     |
| `APPSTAFF_MANAGER` | **GERENTE**    | Violeta   | 👔     |
| `APPSTAFF_OWNER`   | **DONO**       | Roxo      | 👤     |

- **SALÃO** = equipa de salão / comandeiro (quando o papel é waiter).
- **GERENTE** / **DONO** = distinção explícita quando quem opera é manager ou owner.

Componentes que aplicam esta convenção:

- `merchant-portal/src/pages/KDSMinimal/OriginBadge.tsx`
- `merchant-portal/src/pages/TPV/KDS/components/OriginBadge.tsx`
- `merchant-portal/src/pages/AppStaff/components/OriginBadge.tsx`

---

## 4. Filtros e domínio KDS

- **Filtro "APP" (origem AppStaff)** no TPV Kitchen / KDS: deve incluir `APPSTAFF`, `APPSTAFF_MANAGER` e `APPSTAFF_OWNER` (ver `TPVKitchenPage.tsx` → `matchesOriginFilter`).
- **resolveOrderOrigin** (`kdsDomain.ts`): origens que contenham `appstaff` mapeiam para o canónico `APP` (para presets e agrupamentos).

---

## 5. O que não fazer

- Não normalizar `APPSTAFF_MANAGER` / `APPSTAFF_OWNER` para `GARCOM` ou para um único "APPSTAFF" genérico na UI.
- Não remover a distinção por papel na exibição do KDS.
- Não alterar o valor gravado em `sync_metadata.origin` no Core; apenas a **exibição** (label/badge) segue esta convenção.

---

## 6. Estado final

- Origens AppStaff mantêm três valores no Core: `APPSTAFF`, `APPSTAFF_MANAGER`, `APPSTAFF_OWNER`.
- Badges no KDS (e onde o OriginBadge for usado) mostram **SALÃO**, **GERENTE** ou **DONO** conforme o valor.
- A decisão fica documentada neste ficheiro e referenciada nos componentes de badge.
