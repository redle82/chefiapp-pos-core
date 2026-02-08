# Design System Enforcement Loop

**Propósito:** O contrato e os tokens já existem. O que falta é **forçar a realidade a obedecer**. Isto faz-se com três mecanismos simples.

**Referência:** [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md).

---

## A) Design System Coverage Map (obrigatório)

**Ficheiro:** [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md)

- **Tabela:** Área/Tela | Terminal | Usa DS? | O que falta | Tipo (OK | Débito | Bug | Violação).
- **Regra:** Se não usa DS → tem que estar na tabela explicado.
- **Objetivo:** Nada fica invisível. Tudo que for "não" ou "parcial" vira ticket de arquitetura.

---

## B) Regra de build (soft enforcement)

**Não quebra o build** (por agora), mas **avisa**:

- Cor hardcoded (ex.: `#fff`, `rgb(...)` fora de variáveis/tokens).
- `font-size` fora de tokens (ex.: `14px` em vez de `var(--ds-font-size-sm)` ou token do core-design-system).
- Padding/margin "mágico" (números soltos fora da escala do DS).
- `background` ou `minHeight: 100vh` em root de componente (layout é do Shell).

**Implementação possível:**

- **ESLint** (regra custom ou plugin para detectar estilos inline/classes com cores).
- **Stylelint** (regra para proibir valores literais de cor/font-size em CSS).
- **Grep no CI** (script que falha ou avisa se encontrar padrões como `#[0-9a-fA-F]{3,8}` em ficheiros de UI).

Quando o Coverage Map estiver estável, pode passar a **hard enforcement** (build falha se violar).

---

## C) Autoridade clara

Sempre que alguém pergunta: **"Posso mudar isto visualmente?"**

A resposta é sempre em três passos:

1. **O Core permite?** (regras de negócio, estado, fluxo.)
2. **O contrato autoriza?** (CORE_DESIGN_SYSTEM_CONTRACT, OUC, contratos por terminal.)
3. **O DS implementa?** (tokens, componentes, estados visuais.)

Se a resposta a **1** ou **2** for **não** → acabou. Não se inventa exceção visual sem passar por contrato e decisão (CORE_DECISION_LOG).

---

## Resumo

| Mecanismo | O quê | Onde |
|-----------|--------|------|
| **A. Coverage Map** | Tabela tela/componente → usa DS?; "não" = ticket | DESIGN_SYSTEM_COVERAGE.md |
| **B. Build / CI** | Aviso (ou falha) para cor/font/spacing hardcoded | ESLint / Stylelint / grep CI |
| **C. Autoridade** | Pergunta "posso mudar?" → Core? Contrato? DS? | Processo / documentação |

Um sistema vira **enterprise** quando até o visual obedece a leis. O ChefIApp tem agora esses contratos; o Enforcement Loop garante que a realidade os segue.
