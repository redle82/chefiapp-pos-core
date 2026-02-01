# TEMPLATE_SELECTION_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato de seleção de templates por camada (implementação do DNA do produto)  
**Local:** docs/architecture/TEMPLATE_SELECTION_CONTRACT.md  
**Hierarquia:** Subordinado a [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](./PAGE_TYPES_AND_TEMPLATES_CONTRACT.md)

---

## 1. Propósito

Este contrato fixa as **escolhas canónicas de templates** por camada ChefIApp. As opções foram selecionadas a partir do [HTMLrev](https://htmlrev.com/) e do [docs/design/HTMLREV_TEMPLATES_BY_LAYER.md](../design/HTMLREV_TEMPLATES_BY_LAYER.md). Qualquer nova página ou redesign deve usar estas referências, salvo decisão explícita de produto em contrário.

**Regra:** O papel da página define o template. Ver [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](./PAGE_TYPES_AND_TEMPLATES_CONTRACT.md).

---

## 2. Referências

- [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](./PAGE_TYPES_AND_TEMPLATES_CONTRACT.md) — arquétipos e regra de ouro.
- [docs/design/HTMLREV_TEMPLATES_BY_LAYER.md](../design/HTMLREV_TEMPLATES_BY_LAYER.md) — lista completa, alternativas e motivos.

---

## 3. Seleção canónica por camada

### 3.1 Landing (Marketing / Conversão)

**Boot:** PUBLIC. **Rotas:** /, /pricing, /features, /demo, /signup.

| Prioridade | Template | Stack |
|------------|----------|--------|
| **1ª** | Shadcn Landing Page | React + Shadcn |
| **2ª** | Easy Template 5 | Next.js + Shadcn |
| **3ª** | Astroship | Astro + Tailwind |

**Obrigatório:** Zero Runtime/Core; estático + CTA.

---

### 3.2 Auth (Login / Signup / Forgot password)

**Boot:** AUTH. **Rotas:** /login, /signup, /forgot-password.

| Prioridade | Template / bloco | Stack |
|------------|-------------------|--------|
| **1ª** | Blocos de login/signup Shadcn (ou páginas de auth de Admin Shadcn) | React + Shadcn |
| **2ª** | Páginas de auth do Materio | Next.js + Material |
| **3ª** | Páginas de auth do Gradient Able / MaterialPro React Admin Lite | React + Bootstrap |

**Obrigatório:** UI mínima; apenas lógica de auth; transição para /app/dashboard.

---

### 3.3 Portal de Gestão (Admin Dashboard)

**Boot:** MANAGEMENT. **Rotas:** /app/dashboard, /app/restaurant, /app/menu, /app/people, /app/settings, etc.

| Prioridade | Template | Stack |
|------------|----------|--------|
| **1ª** | Modernize React MUI Dashboard | React + MUI |
| **2ª** | MatDash (Next.js) + Shadcn blocks | Next.js + Tailwind + Shadcn |
| **3ª** | Materio (Next.js) | Next.js + Material |

**Recomendado:** Shadcn Blocks / Shadcn Studio para sidebar, topbar, tabelas e formulários — Portal 100% Shadcn + React quando possível.

**Obrigatório:** Sidebar + topbar; nunca bloquear acesso; banners/checklists.

---

### 3.4 Operacional (TPV / KDS)

**Boot:** OPERATIONAL. **Rotas:** /op/tpv, /op/kds, /op/cash.

| Prioridade | Abordagem |
|------------|-----------|
| **1ª** | Custom Operational UI (sem template HTMLrev completo) |
| **2ª** | Inspiração em dashboards com cards grandes (ex. Volt Django Dashboard) |
| **3ª** | Componentes Shadcn: Button, Card, Table em layout fullscreen próprio |

**Obrigatório:** Fullscreen; sem sidebar; touch-first; gates published/operational conforme [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md).

---

### 3.5 App Mobile (Staff)

**Boot:** STAFF_MOBILE. Rotas internas do app (Expo).

**Seleção:** Stack nativa (Expo/React Native); independente de templates web. Ver [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md) e [CORE_APPSTAFF_IOS_UIUX_CONTRACT.md](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md).

---

## 4. Resumo executivo

| Camada | 1ª opção | Fonte |
|--------|----------|--------|
| Landing | Shadcn Landing Page | HTMLrev — Shadcn |
| Auth | Blocos Shadcn login/signup | Shadcn blocks / Admin |
| Portal | Modernize React MUI Dashboard ou MatDash + Shadcn blocks | HTMLrev — React / Next.js Admin |
| TPV/KDS | Custom UI + componentes Shadcn/Tailwind | N/A (componentes apenas) |
| Staff Mobile | Stack nativa Expo | Contratos AppStaff |

---

## 5. Enforcement

- Nova página ou redesign deve declarar a **camada** e usar a **seleção canónica** desta secção ou a lista detalhada em [docs/design/HTMLREV_TEMPLATES_BY_LAYER.md](../design/HTMLREV_TEMPLATES_BY_LAYER.md).
- Desvio em relação a esta seleção exige decisão de produto documentada e atualização deste contrato.

**Violação = inconsistência de DNA do produto.**
