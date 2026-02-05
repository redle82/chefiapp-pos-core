# Bootstrap Linear — UX e Mapa do Sistema

Documento de referência para o fluxo linear de bootstrap (FASE 5). Alinha com [CONTRATO_VIDA_RESTAURANTE](../../contracts/CONTRATO_VIDA_RESTAURANTE.md) §5 (Mapa do sistema) e §2 (regra de ouro: bootstrap único, sem fuga).

---

## 1. Objetivo

- **Ordem fixa:** os passos do bootstrap têm uma sequência única; o utilizador não pode saltar nem ir para o dashboard/TPV até concluir.
- **Indicador constante:** em **BOOTSTRAP_IN_PROGRESS** (e, se aplicável, em **BOOTSTRAP_REQUIRED**) o utilizador vê sempre **"Passo X de Y — A configurar o seu restaurante"** (ou equivalente), para nunca perguntar "onde estou?".
- **Copy em linguagem humana:** sem jargão técnico; mensagens curtas e orientadas à ação.

---

## 2. Passos canónicos (ordem fixa)

| Passo      | Rota / contexto             | Título breve (para o utilizador) | Conteúdo                                                                                                             |
| ---------- | --------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **1 de 2** | `/bootstrap`                | Dados do restaurante             | Nome, tipo, país, contacto. Botão "Criar" / "Continuar".                                                             |
| **2 de 2** | `/onboarding/first-product` | Primeiro produto                 | Mínimo viável (ex.: um produto ou "Já tenho menu"). Conclusão → transição para READY_TO_OPERATE (ex.: `/dashboard`). |

**Total:** Y = 2. Qualquer ecrã dentro deste fluxo deve mostrar "Passo 1 de 2" ou "Passo 2 de 2" conforme a rota.

_(Futuro: se se acrescentar um passo intermédio — ex.: "Confirmar dados" ou "Configurar pagamentos" — aumentar Y e renumerar; o contrato mantém-se.)_

---

## 3. Indicador "Passo X de Y"

- **Texto canónico:** `Passo X de Y — A configurar o seu restaurante`
- **Onde:** visível em todas as vistas em que `lifecycleState === "BOOTSTRAP_IN_PROGRESS"` (e, se desenhado, numa única tela de BOOTSTRAP_REQUIRED antes de entrar em `/bootstrap`).
- **Posição:** fixa no topo do conteúdo (ou barra superior), de forma a não desaparecer com scroll.
- **Quando X/Y:**
  - Em `/bootstrap` → **Passo 1 de 2**.
  - Em `/onboarding/first-product` → **Passo 2 de 2**.

---

## 4. Copy sugerida (linguagem humana)

| Situação                                          | Copy                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **BOOTSTRAP_REQUIRED** (antes de entrar no fluxo) | "Antes de começar, precisamos de uns minutos para configurar o seu restaurante."      |
| **BOOTSTRAP_IN_PROGRESS** (indicador)             | "Passo X de Y — A configurar o seu restaurante."                                      |
| Passo 1 — título                                  | "Dados do restaurante" ou "Criar o teu restaurante"                                   |
| Passo 1 — subtítulo                               | "Nome e contacto para começar."                                                       |
| Passo 2 — título                                  | "Primeiro produto" ou "O teu primeiro item no menu"                                   |
| Passo 2 — subtítulo                               | "Adiciona um produto ou continua e configura depois."                                 |
| Conclusão do bootstrap                            | "Tudo pronto. A partir daqui podes usar o dashboard, TPV e cozinha." (ou equivalente) |

---

## 5. Regras de UX (sem fuga)

- Enquanto **BOOTSTRAP_IN_PROGRESS:** não mostrar links nem navegação para `/dashboard`, `/op/tpv`, `/op/kds` ou outras rotas operacionais. O FlowGate já redireciona para `/bootstrap` se o utilizador tentar aceder a rotas não permitidas.
- **Logout:** permitir sair (ex.: link "Terminar sessão" que leva a `/auth`) para não bloquear o utilizador.
- **Conclusão:** só quando o bootstrap estiver concluído (tenant criado e, conforme produto, primeiro produto/checklist) é que a aplicação transita para **READY_TO_OPERATE** e liberta acesso ao resto do sistema.

---

## 6. Checklist de implementação

- [x] **Indicador em `/bootstrap`:** barra ou linha com "Passo 1 de 2 — A configurar o seu restaurante" sempre visível quando `lifecycleState === "BOOTSTRAP_IN_PROGRESS"` e pathname é `/bootstrap`. (Componente `BootstrapStepIndicator` no topo da página.)
- [x] **Indicador em `/onboarding/first-product`:** "Passo 2 de 2 — A configurar o seu restaurante" sempre visível quando em bootstrap. (Mesmo componente no topo da página.)
- [x] **Cálculo de X/Y:** X = 1 em `/bootstrap`, X = 2 em `/onboarding/first-product`; Y = 2.
- [x] **Copy:** títulos/subtítulos alinhados com §4 (BootstrapPage: "Criar o teu restaurante", "Nome e contacto para começar."; FirstProductPage: "Primeiro produto", "Adiciona um produto ou continua e configura depois.").
- [x] **Sem rotas operacionais:** em BOOTSTRAP_IN_PROGRESS não há link com rótulo "dashboard" ou "TPV/KDS"; ação secundária na FirstProductPage é "Continuar sem adicionar agora" (completa o bootstrap sem produto; FlowGate já impede acesso direto por URL a rotas operacionais).

---

## 7. Referências

- [CONTRATO_VIDA_RESTAURANTE](../../contracts/CONTRATO_VIDA_RESTAURANTE.md) — Estados canónicos, matriz fase → rota, mapa do sistema (§5).
- [FASE_5_DEMO_GUIADO_3_MIN.md](FASE_5_DEMO_GUIADO_3_MIN.md) — Demo guiado (Passo X de 4); padrão análogo para o bootstrap.
- [LifecycleState](../../../merchant-portal/src/core/lifecycle/LifecycleState.ts) — `RestaurantLifecycleState`, `deriveLifecycleState`; uso em FlowGate e GlobalUIState.

Última atualização: 2026-02-01.
