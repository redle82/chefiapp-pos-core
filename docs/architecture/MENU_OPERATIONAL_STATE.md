# Menu Operational State — Estado operacional do menu

> **Propósito:** Tornar o Menu um **estado operacional explícito** do restaurante. Um único sinal vital consumido por Dashboard, TPV, QR/Web, Config e Sidebar. Clareza operacional visível — sem alterar schema, sem novas features.

**Subordinado a:** [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md). Este documento **não altera** o contrato arterial; apenas explicita e nomeia o estado que já existe implicitamente.

---

## 1. Verdade central

O Menu não é só conteúdo. É um **estado operacional** do restaurante.

Portanto:

- O estado é **derivado**, não opinativo (dados existentes: `menuDefined`, `published`, requisitos de publicação).
- Um único **MenuState** é consumido em todo o sistema (Dashboard, TPV, QR, Config, Sidebar).
- A ação **"Publicar Menu"** é única, clara e irreversível no fluxo de uso (ritual, não só botão).

---

## 2. Estados

| Estado                | Significado                                            | Critério de derivação                                                                                                                                                               |
| --------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EMPTY**             | Não há menu válido; não pode vender.                   | `entity.menuDefined === false` (ou equivalente: secção menu não completa / zero itens com preço).                                                                                   |
| **INCOMPLETE**        | Há menu em edição; pode editar, **não** pode publicar. | `entity.menuDefined === true` e **não** se cumprem todos os requisitos para publicar (ex.: faltam identidade, localização, horários ou pessoas). Ou seja: `canPublish() === false`. |
| **VALID_UNPUBLISHED** | Menu pronto para publicar; ainda **não** publicado.    | `entity.menuDefined === true`, todos os requisitos de publicação cumpridos (`canPublish() === true`) e `entity.published === false`.                                                |
| **LIVE**              | Menu publicado e vendável.                             | `entity.published === true` e `entity.menuDefined === true`.                                                                                                                        |

**Nota:** Não se altera schema. A derivação usa apenas:

- `entity.menuDefined` (ex.: `setup_status.menu` ou existência de itens válidos),
- `entity.published` (ex.: `gm_restaurants.status === 'active'` / runtime `mode === 'active'`),
- e a função existente `canPublish()` (identidade, localização, horários, menu, pessoas completos).

---

## 3. Transições

| De                | Para              | Condição / Ação                                                                                                                                 |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| EMPTY             | INCOMPLETE        | Menu definido (pelo menos um item válido com preço; secção menu marcada completa).                                                              |
| INCOMPLETE        | VALID_UNPUBLISHED | Todas as secções obrigatórias do bootstrap completas (`canPublish() === true`).                                                                 |
| VALID_UNPUBLISHED | LIVE              | Utilizador confirma **"Publicar Menu"**; execução de `publishRestaurant()` com sucesso.                                                         |
| LIVE              | —                 | Não há transição "despublicar" neste contrato. Edições ao menu após publicação não mudam o estado para VALID_UNPUBLISHED; o menu continua LIVE. |

Não há transições LIVE → VALID_UNPUBLISHED nem LIVE → INCOMPLETE no escopo actual (publicação consciente, irreversível no fluxo de uso).

---

## 4. Quem bloqueia o quê

| Superfície           | Comportamento por estado                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**        | Mostra o **MenuState** como sinal vital: mensagem humana por estado (ver secção 5). Ex.: "🟡 Menu pronto, mas ainda não publicado" quando VALID_UNPUBLISHED.                                                         |
| **TPV**              | Se MenuState **não** for LIVE: TPV **bloqueado** com mensagem humana (não técnica). Ex.: "O menu ainda não foi publicado. Publique o menu no Dashboard para começar a vender." Não mostrar stack traces nem códigos. |
| **QR / Web pública** | Se MenuState **não** for LIVE: não abrir / não mostrar cardápio público (ou mostrar página "Em breve" / "Menu não disponível"). Só expor quando LIVE.                                                                |
| **Config / Sidebar** | Mostrar indicador do **MenuState** (ícone + label curto) para o dono saber de relance: vazio, em edição, pronto para publicar, ou publicado.                                                                         |

**Regra:** Todas as superfícies consomem **o mesmo** MenuState. Nenhuma calcula o estado por si; uma única fonte (ex.: contexto ou serviço derivado de `entity.menuDefined`, `entity.published`, `canPublish()`).

---

## 5. Mensagens humanas por estado

Copy exacto para uso na UI. Linguagem humana, não técnica.

| Estado                | Mensagem curta (Dashboard / Sidebar)                                                        | Mensagem de bloqueio (TPV)                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **EMPTY**             | "Adicione itens ao menu para poder publicar e vender."                                      | "O menu ainda está vazio. Crie itens no Menu Builder e publique o menu para começar a vender." |
| **INCOMPLETE**        | "Menu em edição. Complete identidade, localização, horários e pessoas para poder publicar." | "O menu ainda não está pronto para venda. Complete o setup no Dashboard e publique o menu."    |
| **VALID_UNPUBLISHED** | "Menu pronto, mas ainda não publicado."                                                     | "O menu ainda não foi publicado. Publique o menu no Dashboard para começar a vender."          |
| **LIVE**              | "Menu publicado e disponível para venda."                                                   | — (TPV aberto; sem bloqueio.)                                                                  |

**QR/Web (quando não LIVE):**
"O cardápio ainda não está disponível. Volte em breve."

---

## 6. Ação única: "Publicar Menu"

- **Um botão soberano** (ex.: na secção de Publicação do onboarding, ou no Dashboard quando estado VALID_UNPUBLISHED).
- **Uma confirmação clara** antes de executar (modal ou passo explícito).
- **Copy de confirmação (humana, não técnica):**

  > "Ao publicar o menu, ele ficará visível no QR, na Web e disponível para venda no TPV. Pode editar depois, mas este é o menu ativo."

- **Consequência visível:** após sucesso, MenuState passa a LIVE; Dashboard, TPV, QR e Sidebar reflectem imediatamente (um único sinal vital).

A implementação chama a função existente `publishRestaurant()` (RestaurantRuntimeContext); este contrato não altera a assinatura nem o backend, apenas a clareza da acção e da mensagem.

---

## 7. Referências

| Documento                                                                                  | Uso                                                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md)                                           | Contrato arterial do menu; invariantes; relação com Financial Core e Bootstrap.       |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)                                         | Índice dos contratos Core.                                                            |
| [FlowEngine.ts](../../merchant-portal/src/core/FlowEngine.ts)                              | Steps causais (menu → publish → tpv-ready); `detectCurrentStep`, `getCompletedSteps`. |
| [WebCoreState.ts](../../merchant-portal/src/core/WebCoreState.ts)                          | `entity.menuDefined`, `entity.published`, `capabilities.canUseTPV`.                   |
| [OnboardingContext](../../merchant-portal/src/context/OnboardingContext.tsx)               | `canPublish()` (requisitos: identity, location, schedule, menu, people).              |
| [RestaurantRuntimeContext](../../merchant-portal/src/context/RestaurantRuntimeContext.tsx) | `publishRestaurant()`, runtime `mode`, `setup_status`.                                |

---

## 8. O que este contrato NÃO faz

- Não altera schema de base de dados.
- Não adiciona IA, presets nem novos modos de criação de menu.
- Não embeleza UI além do necessário para mostrar estado e mensagens.
- Não introduz "despublicar" nem transições LIVE → não-LIVE.

Apenas **clareza operacional**: estado nomeado, único, e mensagens humanas consistentes em todo o sistema.
