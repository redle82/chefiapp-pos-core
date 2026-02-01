# Visual Patch Comercial (VPC)

## Casca visual para vender — não é Design System

**Objetivo:** O sistema está pronto para vender. A aparência está impedindo a venda. Este doc define um **kit de sobrevivência visual** aplicado só onde o cliente vê. Sem Design System formal. Sem refatorar tudo.

**Regra:** Cliente não compra arquitetura. Cliente compra sensação de controle.

---

## 1. Kit visual mínimo (7 decisões)

### 1. Fonte única

- **Usar:** Inter (já está em `index.css`).
- **Onde:** Tudo que o cliente vê — landing, KDS, página QR/menu, TPV.
- **Não:** Misturar com outras fontes decorativas.

### 2. Modo escuro como padrão

- **Onde:** KDS, TPV, Staff, e (opcional) página do cliente se for “app-like”.
- **Motivo:** Parece moderno e profissional; restaurante associa a “sistema sério”.
- **Já existe:** `index.css` tem `color-scheme: dark` e tokens de superfície escura.

### 3. Paleta de 3 cores (acabou)

| Uso   | Token VPC (sugestão) | Hex / valor                              |
| ----- | -------------------- | ---------------------------------------- |
| Fundo | `--vpc-bg`           | `#0a0a0a` (grafite)                      |
| Texto | `--vpc-text`         | `#fafafa`                                |
| Ação  | `--vpc-accent`       | `#22c55e` (verde) ou `#f97316` (laranja) |

- **Nada mais.** Sem gradientes complexos nas superfícies que o cliente toca primeiro.

### 4. Botões grandes e óbvios

- Mínimo: `min-height: 48px`, `padding: 12px 24px`, `font-size: 16px`.
- Cor de ação sólida; bordas arredondadas (8px).
- Restaurante não lê — aperta. Botão tem que parecer botão.

### 5. Espaçamento generoso

- Entre blocos: `24px`–`32px` mínimo.
- Entre linha e linha: `1.5`–`1.6` line-height.
- Evitar telas “densas” e “técnicas”. Espaço = sensação de controle.

### 6. Movimento mínimo (mas vivo)

- Loading suave (opacity/scale, não piscar).
- Mudança de estado clara (ex.: pedido “Em preparo” com transição curta).
- Nada piscando. Isso tira o “ar de 1980”.

### 7. Esconder “configuração” na vista do cliente

- Na visão do cliente final (QR/menu, KDS em modo fullscreen): sem dropdowns avançados, sem opções de admin.
- Mostrar só o essencial: menu, pedido, status.

---

## 2. Valores concretos (colar onde fizer sentido)

```css
/* VPC — Visual Patch Comercial (sobrevivência visual) */
:root {
  --vpc-font: "Inter", system-ui, sans-serif;
  --vpc-bg: #0a0a0a;
  --vpc-surface: #141414;
  --vpc-border: #262626;
  --vpc-text: #fafafa;
  --vpc-text-muted: #a3a3a3;
  --vpc-accent: #22c55e; /* verde ação */
  --vpc-accent-hover: #16a34a;
  --vpc-radius: 8px;
  --vpc-space: 24px;
  --vpc-btn-min-height: 48px;
  --vpc-btn-padding: 12px 24px;
  --vpc-font-size-base: 16px;
  --vpc-font-size-large: 20px;
}
```

- **KDS:** fundo `--vpc-bg`, cards `--vpc-surface`, texto grande (`--vpc-font-size-large` em títulos de pedido), botões com `--vpc-accent`.
- **Página QR/menu:** mesmo padrão se for “app”; ou fundo claro (`#fff`) + texto escuro + um único accent para CTA “Enviar pedido”.

---

## 3. Onde começar no código (ordem de impacto)

### 3.1 Global (uma vez)

| Ficheiro                                          | O que fazer                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `merchant-portal/src/index.css`                   | Garantir `font-family: Inter` e `color-scheme: dark` (já está). Opcional: importar um bloco `.vpc { ... }` com as variáveis acima se não quiser mexer em `:root` global. |
| `merchant-portal/src/ui/design-system/tokens.css` | Opcional: adicionar secção `/* VPC overrides */` com `--vpc-*` para uso em componentes “cliente”. Não apagar tokens existentes.                                          |

### 3.2 O que o cliente vê primeiro (prioridade máxima)

| Ficheiro                                               | O que fazer                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/pages/Landing/LandingPage.tsx`    | Já está simplificada (modo Last.app). Só garantir: fonte Inter, botão grande, espaçamento generoso.                                                                                                                          |
| `merchant-portal/src/pages/PublicWeb/TablePage.tsx`    | **Página QR/menu.** Aplicar VPC: fundo escuro ou claro consistente, tipografia grande, um CTA verde/laranja “Enviar pedido”, espaçamento generoso. Remover ou esconder qualquer UI de “config”.                              |
| `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx` | **KDS.** Garantir: fundo escuro (`--vpc-bg` ou token existente escuro), cards com `--vpc-surface`, texto grande para número da mesa e itens, botões de ação (Iniciar preparo / Pronto) com `--vpc-accent` e min-height 48px. |
| `merchant-portal/src/pages/TPV/KDS/KDSLayout.tsx`      | Se existir layout em volta do KDS: mesmo paleta e espaçamento.                                                                                                                                                               |

### 3.3 Segunda onda (TPV / Staff)

| Ficheiro                                              | O que fazer                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/pages/TPV/TPV.tsx`               | Botões de pagamento e ações principais com tamanho mínimo e cor de ação clara; espaçamento entre secções. |
| `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` | Se for usado em produção, mesmo tratamento que KitchenDisplay: escuro, tipografia grande, botões óbvios.  |
| `merchant-portal/src/pages/Public/PublicKDS.tsx`      | Se for KDS público: alinhar com o mesmo visual do KDS interno.                                            |

### 3.4 O que NÃO tocar agora

- Design System completo, tokens antigos (gold, fire, etc.) — não refatorar.
- Fluxos internos (Config, Backoffice) — só o que o dono/cliente final vê na primeira impressão.

---

## 4. Checklist 48h (impacto imediato)

- [ ] Definir fonte única (Inter) em todas as páginas “cliente”.
- [ ] Definir modo escuro para KDS + TPV (ou confirmar que já está).
- [ ] Aplicar `--vpc-*` (ou equivalentes) em **TablePage** (QR/menu) e **KitchenDisplay** (KDS).
- [ ] Ajustar botões: min-height 48px, padding generoso, cor de ação única.
- [ ] Aumentar espaçamento entre blocos (24–32px) na landing, TablePage e KDS.

**Resultado esperado:** Parece outro produto nas 3 telas que o cliente vê primeiro (landing, QR, KDS).

---

## 5. Checklist 72h (venda desbloqueada)

- [ ] Landing alinhada com VPC (já está simples; só polir tipo e espaços).
- [ ] Página QR/menu (TablePage) com visual “moderno” (escuro ou claro consistente, CTA claro).
- [ ] KDS com visual “painel moderno” (escuro, grande, contraste).
- [ ] Screenshots/prints novos para WhatsApp ou pitch.
- [ ] (Opcional) Vídeo curto de 30s: landing → QR → pedido → KDS.

**Frase que tem de ser verdade:** “Funciona hoje. É simples. É moderno. Eu instalo agora.”

---

## 6. Resumo

| Onde está feio                  | Ficheiro principal                               | Ação VPC                                                                  |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Página web do cliente (QR/menu) | `pages/PublicWeb/TablePage.tsx`                  | Paleta 3 cores, fonte Inter, botões grandes, espaçamento, esconder config |
| KDS                             | `pages/TPV/KDS/KitchenDisplay.tsx` (+ KDSLayout) | Escuro, tipografia grande, contraste, botões óbvios                       |
| Landing                         | `pages/Landing/LandingPage.tsx`                  | Já simplificada; garantir Inter + espaços                                 |
| TPV / Staff                     | `pages/TPV/TPV.tsx`, KDSMinimal, etc.            | Segunda onda: mesmos princípios                                           |

**Não é Design System. É casca visual comercial.** O motor já é F1; isto é capô, bancos e painel para o cliente não julgar em 5 segundos como “1980”.
