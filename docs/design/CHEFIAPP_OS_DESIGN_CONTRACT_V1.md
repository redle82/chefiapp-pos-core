# ChefIApp OS — Design Contract v1

**Data:** 2026-02-11  
**Status:** Contrato activo  
**Objetivo:** Definir identidade em camadas (Nuclear, Entrada, Operacional) para que o utilizador sinta: "Estou sempre dentro do mesmo sistema, só em modos diferentes."

---

## Lei do contrato

Uma única identidade com três intensidades, não três estilos. O que a landing promete, o sistema cumpre visualmente (mesmo que em silêncio). A landing não pode parecer outro produto.

**Implementação:** [merchant-portal/src/ui/design-system/tokens.css](../../merchant-portal/src/ui/design-system/tokens.css), [tokens/colors.ts](../../merchant-portal/src/ui/design-system/tokens/colors.ts), [OSCopy.ts](../../merchant-portal/src/ui/design-system/sovereign/OSCopy.ts).

---

## Camada 1 — Identidade nuclear (imutável)

Não muda nunca, em nenhuma superfície.

| Elemento | Regra |
|----------|--------|
| Logo | Manter. |
| Símbolo do chef | Manter (geométrico). |
| Linguagem | Sistema, Disciplina, Operação, Ritual, Sem intermediários. |
| Tom | Directo, adulto, seguro. |

Esta camada já está forte. O contrato declara que não muda.

---

## Camada 2 — Camada de entrada (Landing / Marketing)

Função: activar desejo e decisão.

- Gradientes quentes, dourado, manifesto permitidos.
- Regra: **tudo o que a landing promete, o sistema deve cumprir visualmente** (mesmo que em silêncio). A landing não pode parecer outro produto.

Tokens: `--color-primary` (dourado), `--fire-vinho`, `--fire-carvao`, `--fire-brasa`, gradientes em [tokens.css](../../merchant-portal/src/ui/design-system/tokens.css).

---

## Camada 3 — Camada operacional (OS + Staff)

### Paleta

| Uso | Token / cor | Onde usar |
|-----|-------------|-----------|
| Base funcional | Zinc / neutros (surface, layer1, layer2) | Backgrounds, cards, tabelas. |
| **Cor de decisão** | **Dourado (primary / amber)** | CTAs principais, títulos estratégicos, estados importantes, elementos de acção. |
| Cinza | Preferir cinza quente; reduzir cinza frio onde fizer sentido. |
| Evitar | Roxo/lilás como identitário no admin. |

Resultado: o sistema fica sério, mas com presença. Dourado para decisão e hierarquia; não pintar tudo de dourado.

### Tipografia

- Títulos principais do OS: mais peso, menos "SaaS padrão".
- Subtítulos: linguagem mais declarativa, menos descritiva.

Exemplos (copy em OSCopy):

| Evitar | Preferir |
|--------|----------|
| Total de mesas | Estado da sala |
| Estatísticas | Pulso da operação |
| Dashboard | Comando Central |

### Layout

- Menos cartão solto, mais organismo único.
- Reduzir excesso de bordas e sombra "material"; mais planos contínuos.
- Menos sensação de dashboard genérico.

### Staff

- Mesma linguagem verbal (OSCopy ou extensão para staff).
- Micro-elementos da marca (ícones, estados, frases).
- Nunca "app genérico de tarefas". Staff não precisa de beleza; precisa de clareza + pertencimento.

---

## Mapeamento de tokens

| Token CSS | Uso no OS |
|-----------|-----------|
| `--color-primary` | CTAs principais, títulos estratégicos, itens activos (sidebar), valores KPI importantes. |
| `--color-os-red` | Crítico, alerta, destrutivo. |
| `--surface-base`, `--surface-elevated`, `--surface-border` | Superfícies e bordas; preferir tons quentes (zinc escuro) no dashboard. |
| `--text-primary`, `--text-secondary` | Hierarquia de texto. |

Em [tokens/colors.ts](../../merchant-portal/src/ui/design-system/tokens/colors.ts), o modo `dashboard` deve usar dourado (amber) para `action` (CTAs, itens activos), não indigo/lilás, para manter DNA da landing.

---

## Regras que não se quebram

- **Contratos de produto:** [APPSTAFF_VISUAL_CANON](../architecture/APPSTAFF_VISUAL_CANON.md), [APPSTAFF_APPROOT_SURFACE_CONTRACT](../architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md), [CORE_LANDING_ROUTES_CONTRACT](../architecture/CORE_LANDING_ROUTES_CONTRACT.md) inalterados na lógica; apenas identidade visual e copy.
- **Uma fonte de verdade:** Cores e usos neste contrato; implementação em tokens (CSS e JS); copy em OSCopy.
- **Sem carnaval:** Dourado para decisão e hierarquia (CTAs, títulos estratégicos, estados importantes); não pintar tudo de dourado.

---

## Referências

- [tokens.css](../../merchant-portal/src/ui/design-system/tokens.css) — variáveis CSS (brand gold, fire system, surfaces).
- [tokens/colors.ts](../../merchant-portal/src/ui/design-system/tokens/colors.ts) — modos tpv, dashboard (temas por contexto).
- [OSCopy.ts](../../merchant-portal/src/ui/design-system/sovereign/OSCopy.ts) — copy system-wide (dashboard, emptyStates, operations).
