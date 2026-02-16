# Design System — ChefIApp OS

**Documento de referência** para o sistema de design do **ChefIApp OS** — o sistema operacional do restaurante. Define tokens, componentes e regras de uso para **Comando Central** (Admin), **TPV**, **KDS**, **AppStaff** e Config, garantindo uma única identidade visual em todas as superfícies de operação e gestão: o restaurante em primeiro plano, o ChefIApp como motor invisível.

**Em uma frase:** Tema escuro, accent **dourado** (`--color-primary`), cards com `--card-bg-on-dark` (nunca branco puro), texto com `--text-primary` / `--text-secondary`; restaurante em destaque, ChefIApp discreto.

| Atributo | Valor |
|----------|--------|
| **Âmbito** | ChefIApp OS: Comando Central (Admin), TPV, KDS, AppStaff, Config |
| **Público** | Desenvolvimento frontend, revisão de UI/UX |
| **Estado** | Documento vivo; alterações em `tokens.css` devem refletir-se aqui |
| **Referências** | [IDENTITY_LAYER_CONTRACT.md](./IDENTITY_LAYER_CONTRACT.md), [CHEFIAPP_OS_DESIGN_CONTRACT_V1.md](./CHEFIAPP_OS_DESIGN_CONTRACT_V1.md), [RESTAURANT_LOGO_IDENTITY_CONTRACT](../architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md) |

---

## Identidade ChefIApp — o que este design system é (e não é)

- **É:** O sistema visual do **sistema operacional do restaurante**. TPV, KDS, Comando Central e AppStaff devem parecer **um único organismo**: o restaurante a usar o ChefIApp OS como motor invisível. Cor de decisão e accent é **dourado** (`--color-primary`), não roxo nem lilás. Superfícies escuras, texto legível, restaurante sempre visível (nome, logo ou iniciais).
- **Não é:** Um dashboard genérico, um clone de outro produto (ex.: apps de gestão ou POS genéricos) nem uma UI que coloque a marca do software em destaque. O ChefIApp aparece de forma discreta (“Powered by ChefIApp”); o que domina é o nome e a identidade do **restaurante**.

Ver [IDENTITY_LAYER_CONTRACT.md](./IDENTITY_LAYER_CONTRACT.md) e [CHEFIAPP_OS_DESIGN_CONTRACT_V1.md](./CHEFIAPP_OS_DESIGN_CONTRACT_V1.md) para a lei de identidade e as camadas (nuclear, entrada, operacional).

---

## Índice

1. [Princípios](#1-princípios)
2. [Paleta (tema escuro)](#2-paleta-tema-escuro-canónica)
3. [Substituição de valores fixos](#3-substituição-de-valores-fixos)
4. [Tipografia](#4-tipografia)
5. [Componentes de referência](#5-componentes-de-referência)
6. [Logo do restaurante](#6-logo-do-restaurante)
7. [Referência de ficheiros e tokens](#7-referência-de-ficheiros-e-tokens)
8. [Tema escuro no Admin](#8-tema-escuro-no-admin)
9. [Migração e boas práticas](#9-migração-e-boas-práticas)
10. [Exemplos de implementação](#10-exemplos-de-implementação)
11. [Anti-padrões](#11-anti-padrões)
12. [Checklist de conformidade](#12-checklist-de-conformidade)
13. [Glossário](#glossário)

---

## Início rápido

Para quem desenvolve ou migra ecrãs do ChefIApp OS (Comando Central, TPV, KDS):

- **Contexto de tokens:** O layout do Comando Central (`DashboardLayout`) aplica o tema escuro em `.dashboard-layout` e `.admin-content`. Componentes dentro deste layout herdam os tokens; não é necessário importar `tokens.css` de novo.
- **Título de página:** Utilizar `<AdminPageHeader title="…" subtitle="…" />` em vez de `h1`/`p` com cores fixas.
- **Cards:** `backgroundColor: var(--card-bg-on-dark)`, `border: 1px solid var(--surface-border)`. Não usar branco puro em cards sobre fundo escuro.
- **Accent:** Usar **dourado** `var(--color-primary)` para CTAs e tab ativa; não usar roxo/lilás.
- **Texto:** Títulos/labels `var(--text-primary)`; descrições `var(--text-secondary)`; hints `var(--text-tertiary)`.

**Contextos de aplicação dos tokens:**

| Contexto | Classe ou scope | Onde se aplica |
|----------|------------------|-----------------|
| Comando Central (Admin) | `.dashboard-layout`, `.admin-content` | Sidebar, conteúdo, todas as páginas Admin |
| TPV (POS) | `.tpv-layout` (wrapper do TPVLayout) | Sidebar, header, grelha de produtos, painel do pedido |
| Global | `:root` (em `tokens.css`) | Fallback quando o componente não está dentro de um layout específico |

Os tokens são definidos em `:root` e reaplicados nos scopes acima; ao usar `var(--card-bg-on-dark)` ou `var(--color-primary)`, o valor correto é herdado do contexto.

**Quando usar (resumo):**

| Preciso de… | Utilizar |
|-------------|----------|
| Fundo de página ou sidebar | `var(--surface-base)` |
| Fundo de card ou painel elevado | `var(--card-bg-on-dark)` ou `var(--surface-elevated)` |
| Título ou label | `var(--text-primary)` |
| Descrição ou texto secundário | `var(--text-secondary)` |
| Placeholder ou hint | `var(--text-tertiary)` |
| Borda | `var(--surface-border)` |
| Botão principal (CTA) | `var(--color-primary)` + `var(--text-inverse)` |
| Tab ou item ativo | `var(--color-primary)`; fundo opcional `var(--status-primary-bg)` |
| Estado sucesso / erro / aviso | `var(--color-success)` / `var(--color-error)` / `var(--status-warning-text)`; fundo `var(--status-*-bg)` |

Ver secção [2. Paleta](#2-paleta-tema-escuro-canónica) para a lista completa de tokens e valores.

---

## 1. Princípios

Os princípios do design system orientam todas as decisões de UI no ChefIApp OS:

1. **Restaurante em primeiro plano (identidade)**  
   O sistema deve parecer **o restaurante a usar o ChefIApp OS**, não o contrário. Nome e logo (ou iniciais) do restaurante na sidebar, topbar e títulos de contexto. ChefIApp apenas discreto (“Powered by ChefIApp”). Ref: [IDENTITY_LAYER_CONTRACT.md](./IDENTITY_LAYER_CONTRACT.md).

2. **Dourado como cor de decisão (não roxo/lilás)**  
   No OS, o accent para CTAs, tab ativa e estados importantes é **dourado** (`--color-primary`). Não usar roxo, lilás ou indigo como accent no Comando Central, TPV ou KDS — mantém o DNA visual da landing e evita parecer “dashboard SaaS genérico”. Ref: [CHEFIAPP_OS_DESIGN_CONTRACT_V1.md](./CHEFIAPP_OS_DESIGN_CONTRACT_V1.md).

3. **Contraste acessível**  
   No tema escuro, títulos e texto principal ≥ 4.5:1 sobre o fundo; texto secundário ≥ 3:1.

4. **Uma única identidade em todas as superfícies**  
   Os mesmos tokens para superfícies, texto, bordas e botões em Comando Central, TPV e KDS. **Não usar branco puro em cards sobre fundo escuro** — usar sempre `--card-bg-on-dark`. Menos “cartões soltos”, mais organismo único.

5. **TPV e operação como referência**  
   O TPV já cumpre os tokens e a identidade; o Comando Central (Admin), o KDS e o AppStaff devem alinhar-se aos mesmos tokens para que toda a operação (caixa, cozinha, staff, config) pareça o mesmo sistema.

---

## 2. Paleta (tema escuro — canónica)

Paleta do ChefIApp OS para Comando Central e superfícies com fundo escuro (TPV, KDS, Admin). Valores em `tokens.css`, reaplicados em `.dashboard-layout`, `.admin-content` e `.tpv-layout`. O **dourado** (`--color-primary`) é a cor de decisão do OS (CTAs, tab ativa, estados importantes); não substituir por roxo/lilás.

**Contraste:** Os ratios indicados na tabela abaixo garantem acessibilidade (WCAG 2.1 nível AA para texto normal; nível AAA onde indicado). Ref: [CHEFIAPP_OS_DESIGN_CONTRACT_V1.md](./CHEFIAPP_OS_DESIGN_CONTRACT_V1.md).

### Cores de superfície e texto

| Uso | Variável CSS | Valor de referência | Contraste (sobre `#111827`) |
|-----|--------------|---------------------|-----------------------------|
| Fundo base | `--surface-base` | `#111827` | — |
| Superfície elevada (cards) | `--surface-elevated` | `#1f2937` | — |
| **Card sobre fundo escuro** | `--card-bg-on-dark` | = `--surface-elevated` | — |
| Texto principal (títulos, corpo) | `--text-primary` | `rgba(255,255,255,0.95)` | ≥ 12:1 |
| Texto secundário (subtítulos, descrições) | `--text-secondary` | `rgba(255,255,255,0.72)` | ≥ 5:1 |
| Texto terciário (placeholders, hints) | `--text-tertiary` | `rgba(255,255,255,0.5)` | ≥ 3:1 |
| Texto em botão primário | `--text-inverse` | `#1a1a1a` | — |
| Borda subtil | `--surface-border` | `rgba(255,255,255,0.08)` | — |
| **Cor de decisão (accent)** — links, CTA, tab ativa | `--color-primary` | `#c9a227` (dourado ChefIApp) | ≥ 4.5:1 |
| Sucesso | `--color-success` | `#22c55e` | ≥ 4.5:1 |
| Erro | `--color-error` | `#ef4444` | ≥ 4.5:1 |
| Aviso | `--color-warning` | `#fbbf24` | ≥ 4.5:1 |

### Estados semânticos (badges e alertas)

Para mensagens de estado (sucesso, aviso, erro, info, destaque) utilizar os conjuntos de variáveis abaixo. Permitem fundo, borda e texto consistentes.

| Semântica | Variáveis (fundo / borda / texto) | Uso típico no OS |
|-----------|------------------------------------|-------------------|
| Sucesso | `--status-success-bg`, `--status-success-border`, `--color-success` | Badge “Pago”, pedido pago, confirmação |
| Aviso | `--status-warning-bg`, `--status-warning-border`, `--status-warning-text` | Alerta atenção (ex.: turno por fechar) |
| Erro | `--status-error-bg`, `--status-error-border`, `--color-error` | Falha sync, erro de pagamento |
| Info | `--status-info-bg`, `--status-info-border`, `--status-info-text` | Tag informativa |
| Primary (destaque) | `--status-primary-bg`, `--status-primary-border`, `--status-primary-text` | Item ativo, tag dourado (ex.: turno aberto) |

**Regra obrigatória:** Em áreas Admin, os títulos de página e de secção (`h1`, `h2`) **nunca** devem usar cinza escuro ou azul/roxo de baixo contraste sobre fundo escuro. Utilizar sempre `--text-primary`.

---

## 3. Substituição de valores fixos

Ao migrar código existente ou ao rever implementações, substituir os valores abaixo pelos tokens indicados. Isto garante que o tema escuro e futuras alterações de tema sejam aplicados corretamente. Para a lista completa de variáveis, ver [secção 2 (Paleta)](#2-paleta-tema-escuro-canónica).

| Não utilizar | Utilizar |
|--------------|----------|
| `#ffffff`, `#fff`, `backgroundColor: "#fff"` em cards | `var(--card-bg-on-dark)` |
| `#111827`, `#374151`, `#333` em títulos ou corpo de texto | `var(--text-primary)` |
| `#6b7280`, `#64748b`, `#666` em descrições | `var(--text-secondary)` |
| `#9ca3af`, `#888` em placeholders ou hints | `var(--text-tertiary)` |
| `#e5e7eb`, `#e0e0e0`, `#d1d5db` em bordas | `var(--surface-border)` |
| `#7c3aed`, `#667eea`, roxo/lilás/indigo em CTA ou tab ativa | `var(--color-primary)` (dourado ChefIApp) |
| Botão primário com cor de fundo fixa + texto branco | `backgroundColor: var(--color-primary)`, `color: var(--text-inverse)` |
| Erro (texto ou fundo) com hex | `var(--color-error)`, `var(--status-error-bg)`, `var(--status-error-border)` |
| Sucesso (texto ou fundo) com hex | `var(--color-success)`, `var(--status-success-bg)` |
| Aviso (texto ou fundo) com hex | `var(--status-warning-text)`, `var(--status-warning-bg)` |

---

## 4. Tipografia

- **Fonte:** Definida pela variável `--font-family` em `tokens.css` (Inter e fallbacks de sistema).
- **Tamanhos disponíveis:**  
  `--font-size-h1` (28px), `--font-size-h2` (22px), `--font-size-h3` (16px),  
  `--font-size-ui-lg` (16px), `--font-size-ui-md` (14px), `--font-size-ui-sm` (12px).

**Convenções por elemento:**

| Elemento | Tamanho sugerido | Cor |
|----------|------------------|-----|
| Título de página (Admin) | `var(--font-size-h2)` ou 1.5rem–1.625rem, `font-weight: 700` | `var(--text-primary)` |
| Subtítulo ou descrição de página | `var(--font-size-ui-md)` (0.875rem) | `var(--text-secondary)` |
| Labels em cards ou tabelas | `var(--font-size-ui-sm)` (0.75–0.8125rem) | `var(--text-secondary)` ou `var(--text-tertiary)` |

**Espaçamento e cantos:**

- Espaço entre secções: `var(--spacing-xl)` (24px) ou `var(--spacing-2xl)` (32px).
- Padding interno de cards: `var(--spacing-lg)` (16px).
- Raio de borda de cards e botões: `var(--radius-sm)` (8px) ou `var(--radius-md)` (12px).

---

## 5. Componentes de referência

### 5.1 AdminPageHeader

- **Função:** Fornecer o título e o subtítulo de página no Comando Central de forma consistente, com tokens aplicados.
- **Uso:** `<AdminPageHeader title="…" subtitle="…" actions={…} />`.
- **Localização:** `merchant-portal/src/features/admin/dashboard/components/AdminPageHeader.tsx`.
- **Regra:** Em novas páginas do Comando Central (Admin), utilizar este componente em vez de criar manualmente `h1` e `p` com cores fixas.

### 5.2 Sidebar do Comando Central (Admin)

- Fundo: `var(--surface-base)` (aplicado no scope `.dashboard-layout`).
- Borda direita: `var(--surface-border)`.
- Item de navegação ativo: fundo e texto com accent **dourado** (`--color-primary`), não roxo/lilás.
- Item inativo: `color: var(--text-secondary)` ou `var(--text-primary)` conforme a hierarquia.
- Link “Voltar”: `color: var(--text-secondary)`.
- Topo: RestaurantHeader (nome/logo do restaurante); rodapé: ChefIAppSignature (“Powered by ChefIApp”).

### 5.3 Cards sobre fundo escuro

- **Fundo:** `var(--card-bg-on-dark)` ou `var(--surface-elevated)`. Não utilizar branco puro.
- **Borda:** `var(--surface-border)`.
- **Título do card:** `var(--text-primary)`.
- **Corpo ou descrição:** `var(--text-secondary)`.

### 5.4 Botões

- **Primário (CTA):** `backgroundColor: var(--color-primary)`, `color: var(--text-inverse)`.
- **Secundário / outline:** `border: 1px solid var(--surface-border)`, `color: var(--text-primary)`, fundo transparente ou `var(--card-bg-on-dark)`.
- **Destrutivo:** `color: var(--color-error)` (apenas texto) ou `backgroundColor: var(--color-error)` com `color: var(--text-inverse)`.

### 5.5 Badges e alertas

- **Sucesso:** fundo `--status-success-bg`, texto `--color-success`.
- **Erro:** fundo `--status-error-bg`, texto `--color-error`.
- **Aviso:** fundo `--status-warning-bg`, texto `--status-warning-text`.
- **Info:** fundo `--status-info-bg`, texto `--status-info-text`.

### 5.6 TPV (POS)

O TPV usa o mesmo tema escuro e **dourado** (`--color-primary`) que o Comando Central (ver [secção 2. Paleta](#2-paleta-tema-escuro-canónica)). Layout em três zonas: sidebar esquerda (perfil do operador + navegação), header com pesquisa e Filtro, área central (modo de pedido + categorias + grelha de produtos), painel direito (itens do pedido + totais + ações).

**Resumo por elemento (tokens a usar):**

| Elemento | Tokens principais |
|----------|--------------------|
| Wrapper (layout) | `--surface-base`, `--text-primary` (classe `tpv-layout`) |
| Sidebar | `--surface-base`, `--surface-border`; perfil: `--text-primary`, `--text-tertiary`; item ativo: `--color-primary`, `--status-primary-bg`; inativo: `--text-secondary` |
| Header | `--surface-elevated`, `--surface-border`; pesquisa: `--surface-base`, `--text-primary`; botão Filtro: `--color-primary`, `--text-inverse` |
| Modo de pedido (Take away / Dine in / Delivery) | Selecionado: `--color-primary`, `--text-inverse`; não selecionado: `--surface-elevated`, `--text-secondary` |
| Tabs de categorias | Igual ao modo de pedido |
| Card de produto | `--card-bg-on-dark`, `--surface-border`; título: `--text-primary`; descrição: `--text-secondary`; CTA adicionar: `--color-primary`, `--text-inverse` |
| Painel do pedido | Fundo `--surface-base`; linha de item: `--card-bg-on-dark`, `--surface-border`; botão +: `--color-primary`, `--text-inverse`; botão −: borda `--surface-border`; totais: `--text-secondary`; Total: `--text-primary`; CTA Finalizar: `--color-primary`, `--text-inverse` |

**Ficheiros de referência:** `merchant-portal/src/pages/TPVMinimal/TPVLayout.tsx`, `TPVHeader.tsx`, `TPVSidebar.tsx`, `TPVProductCard.tsx`, `OrderSummaryPanel.tsx`, `OrderModeSelector.tsx`, `ProductCategoryFilter.tsx`.

### 5.7 KDS e AppStaff

O **KDS** (Kitchen Display) e o **AppStaff** devem usar os mesmos tokens de superfície e texto (`--surface-base`, `--surface-elevated`, `--card-bg-on-dark`, `--text-primary`, `--text-secondary`) e o accent **dourado** (`--color-primary`) para estados ativos e CTAs. Assim, caixa, cozinha e staff mantêm uma única identidade visual. Referir aos contratos de cada área (KDS, AppStaff) para layout e hierarquia; as cores vêm deste design system.

---

## 6. Logo do restaurante

- **Onde aplicar:** Topo da Sidebar Admin, Topbar Admin (esquerda), TPV, KDS, AppStaff e web pública.
- **Componente:** `RestaurantHeader` (sidebar/topbar). Se existir `logo_url`, exibir a imagem; caso contrário, exibir as **iniciais do nome** do restaurante em círculo (fallback).
- **Dimensões sugeridas:** Sidebar (pequeno): 28–32px; Topbar (médio): 36–40px.
- **Referência:** [RESTAURANT_LOGO_IDENTITY_CONTRACT](../architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md).

---

## 7. Referência de ficheiros e tokens

| Recurso | Caminho no repositório |
|---------|------------------------|
| Variáveis CSS (portal) | `merchant-portal/src/ui/design-system/tokens.css` |
| Variáveis CSS (core) | `@chefiapp/core-design-system/tokens.css` |
| Tokens em TypeScript (portal) | `merchant-portal/src/ui/design-system/tokens.ts` |
| Layout Admin (wrapper) | `merchant-portal/src/features/admin/dashboard/components/DashboardLayout.tsx` |
| Cabeçalho de página Admin | `merchant-portal/src/features/admin/dashboard/components/AdminPageHeader.tsx` |
| Sidebar Admin | `merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx` |
| Layout TPV (POS) | `merchant-portal/src/pages/TPVMinimal/TPVLayout.tsx` |
| Header TPV | `merchant-portal/src/pages/TPVMinimal/components/TPVHeader.tsx` |
| Sidebar TPV | `merchant-portal/src/pages/TPVMinimal/components/TPVSidebar.tsx` |
| Card de produto TPV | `merchant-portal/src/pages/TPVMinimal/components/TPVProductCard.tsx` |
| Painel do pedido TPV | `merchant-portal/src/pages/TPVMinimal/components/OrderSummaryPanel.tsx` |

**Variáveis essenciais no contexto Admin:**

- `--heading-page`: deve ser igual a `--text-primary` (títulos de página legíveis).
- `--card-bg-on-dark`: deve ser igual a `--surface-elevated` (evitar cards brancos no Admin).

---

## 8. Tema escuro no Admin

O tema escuro no Admin é aplicado em dois níveis:

1. **`.dashboard-layout`** (wrapper do `DashboardLayout`): Define `--surface-base`, `--surface-elevated`, `--surface-border`, `--text-primary`, `--text-secondary` e `--text-tertiary` para todo o layout (sidebar e área de conteúdo). Sidebar e conteúdo principal herdam os mesmos tokens.
2. **`.admin-content`** (elemento `<main>` do layout): Redefine `--card-bg-on-dark` e `--surface-elevated` e inclui overrides para classes utilitárias (por exemplo `.bg-white`, `.text-gray-*`), de modo a que código legado com Tailwind respeite o tema escuro.

Qualquer componente (incluindo módulos CSS) que seja renderizado dentro do Admin e que use `var(--card-bg-on-dark)` ou `var(--text-primary)` obtém os valores do tema escuro, sem depender do `:root` global.

---

## 9. Migração e boas práticas

1. **Títulos:** Utilizar `AdminPageHeader` ou, em alternativa, `color: var(--text-primary)` em `h1`/`h2`. Não usar `#111827` nem `#374151` para texto sobre fundo escuro.
2. **Cards:** Quando o fundo da página for escuro, usar `backgroundColor: var(--card-bg-on-dark)` e `border: 1px solid var(--surface-border)`.
3. **Tabs:** Tab ativa: `borderBottom: 2px solid var(--color-primary)`, `color: var(--color-primary)`. Tab inativa: `color: var(--text-secondary)`. Barra inferior do grupo de tabs: `borderBottom: 1px solid var(--surface-border)`.
4. **Formulários:** Campos com `border: 1px solid var(--surface-border)`; labels com `var(--text-primary)`; botão principal (Guardar, Adicionar) com `var(--color-primary)` e `color: var(--text-inverse)`.
5. **Mensagens de erro/sucesso:** Fundo com `var(--status-error-bg)` ou `var(--status-success-bg)`; texto com `var(--color-error)` ou `var(--color-success)`.

### 9.1 Overrides em `.admin-content`

O `<main>` do layout Admin tem a classe `admin-content`. Em `tokens.css`, as regras destinadas a `.admin-content` aplicam-se a todo o conteúdo dessa região:

- **Cards:** `.bg-white` é mapeado para `var(--card-bg-on-dark)`.
- **Bordas:** `.border-gray-200`, `.border-gray-300` são mapeadas para `var(--surface-border)`.
- **Texto:** `.text-gray-900` → `--text-primary`; `.text-gray-600`, `.text-gray-500` → `--text-secondary`; `.text-gray-400` → `--text-tertiary`.
- **Inputs e selects:** fundo e borda com tokens; estado de focus com `--color-primary`.
- **Paginação ativa:** `--status-primary-bg` e `--color-primary`.

Páginas que usam classes Tailwind como `bg-white` ou `border-gray-200` passam a respeitar o tema escuro dentro do Admin. Em **novos** componentes, deve preferir-se o uso direto dos tokens em vez de depender apenas destes overrides.

---

## 10. Exemplos de implementação

Os exemplos abaixo ilustram o uso correto dos tokens em JSX e em CSS modules. Podem ser usados como ponto de partida para cards, tabs, botões e alertas.

**Card simples (estilos inline em JSX):**

```jsx
<div
  style={{
    padding: "var(--spacing-lg)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--card-bg-on-dark)",
    border: "1px solid var(--surface-border)",
  }}
>
  <h2 style={{ fontSize: "var(--font-size-h3)", color: "var(--text-primary)", margin: "0 0 8px 0" }}>
    Título
  </h2>
  <p style={{ fontSize: "var(--font-size-ui-md)", color: "var(--text-secondary)", margin: 0 }}>
    Descrição.
  </p>
</div>
```

**Card em CSS Module:**

```css
.card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-sm);
  background-color: var(--card-bg-on-dark);
  border: 1px solid var(--surface-border);
}
.cardTitle {
  color: var(--text-primary);
  font-size: var(--font-size-h3);
}
.cardDesc {
  color: var(--text-secondary);
  font-size: var(--font-size-ui-md);
}
```

**Tab ativa / inativa:**

```jsx
<button
  style={{
    border: "none",
    borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
    color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
    background: "transparent",
  }}
>
  Tab
</button>
```

**Botão primário:**

```jsx
<button
  style={{
    padding: "8px 16px",
    backgroundColor: "var(--color-primary)",
    color: "var(--text-inverse)",
    border: "none",
    borderRadius: "var(--radius-xs)",
  }}
>
  Guardar
</button>
```

**Alerta de erro:**

```jsx
<div
  style={{
    padding: "var(--spacing-md)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--status-error-bg)",
    border: "1px solid var(--status-error-border)",
    color: "var(--color-error)",
  }}
>
  Mensagem de erro
</div>
```

**Campo de input (formulário):**

```jsx
<input
  type="text"
  placeholder="Ex.: nome do produto"
  style={{
    width: "100%",
    padding: "var(--spacing-md)",
    border: "1px solid var(--surface-border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--card-bg-on-dark)",
    color: "var(--text-primary)",
    fontSize: "var(--font-size-ui-md)",
  }}
/>
```

Em CSS, o focus pode usar `outline: 2px solid var(--color-primary)` ou `box-shadow: 0 0 0 2px var(--color-primary)` (ver overrides em `.admin-content` em `tokens.css`).

---

## 11. Anti-padrões

Evitar os seguintes usos no ChefIApp OS (Comando Central, TPV, KDS, tema escuro):

- Utilizar `#ffffff` ou `#fff` como fundo de cards.
- Utilizar `#111827`, `#374151` ou `#666` para texto sobre fundo escuro sem recorrer aos tokens (`--text-primary` / `--text-secondary`).
- **Utilizar roxo, lilás ou indigo (`#667eea`, `#7c3aed`, etc.) como accent ou botão primário** — no ChefIApp OS o accent é dourado (`var(--color-primary)`). Roxo/lilás faz o OS parecer outro produto.
- Criar manualmente `h1` e `p` para o título de página quando o componente `AdminPageHeader` estiver disponível.
- Misturar tema claro (branco/cinza) em cards dentro de `.admin-content`.
- Colocar a marca ChefIApp em destaque nas superfícies operacionais; o que deve dominar é o restaurante (RestaurantHeader, nome, logo).
- Usar `font-size` ou `padding`/`gap` em px ou rem hardcoded quando existir token (preferir `var(--font-size-ui-md)`, `var(--spacing-lg)`, etc.) — facilita consistência e mudança global.

**Resumo recomendado / a evitar:**

| Recomendado | A evitar |
|-------------|----------|
| Utilizar `AdminPageHeader` em novas páginas do Comando Central | Duplicar `h1` e `p` com cores fixas |
| Utilizar `var(--card-bg-on-dark)` em cards | Utilizar `#fff` ou `backgroundColor: "white"` em cards |
| Utilizar `var(--text-primary)` e `var(--text-secondary)` para texto | Utilizar `#333`, `#666`, `#374151` sobre fundo escuro |
| **Dourado** `var(--color-primary)` + `var(--text-inverse)` no botão primário | Roxo/azul/indigo hardcoded (parece dashboard genérico) |
| Utilizar `var(--surface-border)` em bordas | Utilizar `#e0e0e0` ou `#e5e7eb` |

---

## 12. Checklist de conformidade

Utilizar esta lista na revisão de ecrãs do ChefIApp OS (Comando Central, TPV, KDS) ou na validação de uma migração para o design system:

**Identidade ChefIApp**

- [ ] O que domina é o **restaurante** (RestaurantHeader, nome, logo ou iniciais); ChefIApp aparece discreto (“Powered by ChefIApp”).
- [ ] O accent é **dourado** (`--color-primary`); não há roxo/lilás/indigo em CTAs, tabs ativas ou destaques.

**Títulos e texto**

- [ ] As páginas do Comando Central utilizam `AdminPageHeader` ou `--text-primary` para títulos de página e de secção.
- [ ] Subtítulos e descrições utilizam `--text-secondary`.

**Navegação**

- [ ] A Sidebar e a Topbar exibem o logo do restaurante ou as iniciais (via `RestaurantHeader`); o rodapé da Sidebar usa ChefIAppSignature.

**Superfícies e componentes**

- [ ] Os cards utilizam `--card-bg-on-dark` e não branco puro.
- [ ] Os botões primários utilizam `--color-primary` (dourado) e `--text-inverse`.
- [ ] Os badges de estado (Pago, Erro, Aviso, turno aberto) utilizam `--status-*-bg` e `--color-success` / `--color-error` / `--status-warning-text` / `--status-primary-*`.
- [ ] As tabs e as bordas utilizam `--surface-border`; a tab ativa utiliza `--color-primary`.
- [ ] Os formulários (inputs, labels, botões) utilizam tokens; os alertas de erro utilizam `--status-error-bg` e `--color-error`.

**TPV (POS)**

- [ ] O layout usa a classe `tpv-layout`; fundo `--surface-base`, texto `--text-primary`.
- [ ] A sidebar mostra perfil do operador (avatar, nome, ID) no topo; item ativo em dourado (`--color-primary`, `--status-primary-bg`).
- [ ] O header tem pesquisa e botão Filtro com `--color-primary` + `--text-inverse`.
- [ ] Modo de pedido e categorias: selecionado em dourado; não selecionado em `--surface-elevated` + `--text-secondary`.
- [ ] Cards de produto: `--card-bg-on-dark`, imagem no topo, CTA adicionar em dourado.
- [ ] Painel do pedido: botão **+** (quantidade) em dourado; CTA Finalizar em dourado; totais com `--text-secondary` e Total com `--text-primary`.

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **CTA** | Call to Action — botão principal de uma ação (ex.: Guardar, Finalizar, Adicionar). No OS usa `--color-primary` e `--text-inverse`. |
| **Token** | Variável CSS (custom property) definida em `tokens.css` (ex.: `--color-primary`, `--text-primary`). Garante consistência e facilita mudança de tema. |
| **Superfície** | Área de conteúdo do produto (Comando Central, TPV, KDS, AppStaff, Config). Cada superfície pode ter um scope de tokens (ex.: `.dashboard-layout`, `.tpv-layout`). |
| **Comando Central** | Área Admin do ChefIApp OS (dashboard, config, reportes, etc.). Layout com sidebar e conteúdo; tema escuro. |
| **Cor de decisão** | Accent usado para CTAs, tab ativa e estados importantes. No ChefIApp OS é o **dourado** (`--color-primary`), não roxo nem lilás. |
| **KDS** | Kitchen Display — ecrã de cozinha. Usa os mesmos tokens deste design system (superfícies, texto, dourado). |
| **AppStaff** | Aplicação de staff (waiter, kitchen, etc.). Usa os mesmos tokens; contratos específicos definem layout e hierarquia. |
