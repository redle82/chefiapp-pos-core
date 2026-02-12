# Contrato de Roteamento por Estado na Landing — Botões como Portais de Estado

## Lei do sistema

**Os botões da landing não navegam por páginas; activam estados do sistema. Cada botão declara intenção e o próximo estado operacional esperado.**

Este documento é contrato formal no Core. Referência: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md). Complementa o mapa técnico de rotas em [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md) com a semântica **estado/intenção** e os modos do OS.

---

## Sovereignty

Este contrato é subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) e a [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md). Nenhuma regra aqui altera rotas nem destinos sem actualizar o contrato de rotas da landing.

---

## 1. Princípio: Sistema Operacional, não páginas

Um sistema operacional não navega por páginas. Navega por **estados de operação**.

A pergunta correcta não é _"Para onde este botão vai?"_ mas _"Que estado do sistema este botão activa?"_

Os botões devem:

- **Declarar intenção** (quem é o utilizador, em que modo entra, qual o próximo estado esperado)
- **Ser portais de estado**, não apenas links

---

## 2. Modos do sistema (obrigatórios)

O sistema declara **modos** globais. Devem aparecer visualmente (badge, cor, texto), ser globais (GlobalUIState / contexto equivalente) e ser activados por botões claros.

| Modo            | O que é                                                                                                                                                | Onde se activa                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **Demo**        | Observar, aprender; sem identidade forte; dados fake; nunca escreve no Core                                                                            | Entrada por "Explorar demonstração" → `/demo`    |
| **Piloto**      | Testar operação real sem cobrança; pode persistir local; invisível ao Core conforme [PILOT_MODE_RUNTIME_CONTRACT.md](./PILOT_MODE_RUNTIME_CONTRACT.md) | Após auth, no portal (controlo explícito)        |
| **Operacional** | Restaurante em produção; Core é autoridade                                                                                                             | Após auth + billing gate + restaurante publicado |

**Regra:** Estes modos são a única linguagem permitida para "em que estado estou". Nenhum botão pode activar um estado que não seja um destes (ou transição explícita para um deles).

---

## 3. Três caminhos na landing (organização canónica)

A landing expõe **três portais** principais. Todo o resto (WhatsApp, configuração guiada, etc.) orbita estes três.

| Caminho                    | Intenção                             | Estado activado                                          |
| -------------------------- | ------------------------------------ | -------------------------------------------------------- |
| **Operar meu restaurante** | Produção / Trial / Billing           | Operacional (ou Piloto conforme gate)                    |
| **Explorar demonstração**  | Demo isolada, sem efeitos colaterais | Demo                                                     |
| **Já tenho acesso**        | Retomar último contexto              | Resolução de sessão → último modo (Pilot \| Operational) |

**Comportamento da página de vendas:** A landing (`/`) **nunca** redireciona automaticamente; a entrada no sistema faz-se **apenas por CTA explícito** (ex.: "Entrar no sistema" → `/admin`). Landing = página de vendas, não auth gateway.

---

## 4. Botões como portais de estado (canónico)

### 4.1 Entrar em operação (CTA principal)

| Aspecto                  | Especificação                                                                                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intenção**             | "Quero operar um restaurante de verdade"                                                                                                                                                                               |
| **Estado**               | Início de operação real (ou trial). **Nunca** leva para demo.                                                                                                                                                          |
| **Acção correcta**       | `/auth` (ou `/enter` se adoptado) → Auth (Google / Email) → Billing Gate (trial / pagamento) → Restaurant Bootstrap → `/app/dashboard` (modo operacional). O Core (FlowGate / TenantContext) decide o fluxo após auth. |
| **Contratos envolvidos** | [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md), [BILLING_OPERATIONAL_CONTRACT.md](./BILLING_OPERATIONAL_CONTRACT.md), [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md) |
| **Regra**                | Este botão **nunca** leva para `/demo`.                                                                                                                                                                                |

---

### 4.2 Ver demonstração / Explorar o sistema (Demo)

| Aspecto                  | Especificação                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Intenção**             | Entrada em modo observação, sem identidade forte                                                                                                                                                                                     |
| **Estado**               | Demo. GlobalUIState (ou equivalente) `isDemo === true`; RestaurantContext = DEMO_RESTAURANT; dados explicativos + fake                                                                                                               |
| **Acção correcta**       | `/demo` → modo Demo activo; sem criação de restaurante, sem activação de piloto, **nunca** escrita no Core                                                                                                                           |
| **Na tela Demo**         | O botão "Abrir meu Dashboard" deve ser tratado como **"Explorar o Sistema (Demo)"** quando o utilizador veio da demo sem auth — ou levar para `/auth` se quiser "operar de verdade" (evitar ambiguidade "meu Dashboard" sem sessão). |
| **Contratos envolvidos** | [TRIAL_MODE_CONTRACT.md](./TRIAL_MODE_CONTRACT.md); [GLOBAL_UI_STATE_MAP.md](../product/GLOBAL_UI_STATE_MAP.md) (isTrial)                                                                                                            |
| **Regra**                | Demo **nunca** cria restaurante, **nunca** activa piloto, **nunca** escreve no Core.                                                                                                                                                 |

---

### 4.3 Acesso existente / Já tenho acesso

| Aspecto                  | Especificação                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intenção**             | Retorno directo ao último estado operacional conhecido                                                                                                                                                |
| **Estado**               | Resolução de sessão + último restaurante + último modo (Pilot \| Operational)                                                                                                                         |
| **Acção correcta**       | `/auth` (login) → resolveUser → resolveLastRestaurant → resolveLastMode → redireccionamento automático para `/op/tpv`, `/op/kds` ou `/app/dashboard` conforme contexto guardado (ou política do Core) |
| **Contratos envolvidos** | [SESSION_RESUME_CONTRACT.md](./SESSION_RESUME_CONTRACT.md); [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md), [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md)      |
| **Regra**                | O sistema "lembra" o utilizador — como um OS. Não é um link genérico de login; é retomar contexto.                                                                                                    |

---

### 4.4 Fale no WhatsApp

| Aspecto                  | Especificação                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intenção**             | Canal de activação assistida (lead contextual)                                                                                                                                                           |
| **Estado**               | Externo; contexto enviado na mensagem conforme origem                                                                                                                                                    |
| **Acção correcta**       | Link WhatsApp com contexto: vindo da landing → "Quero conhecer"; vindo da demo → "Quero activar"; vindo da operação → "Preciso de ajuda" (query param ou mensagem pré-preenchida conforme implementação) |
| **Contratos envolvidos** | Activação assistida (ASSISTED_ACTIVATION — a formalizar se necessário; hoje pode ser apenas boa prática de copy/link)                                                                                    |
| **Regra**                | Não é CTA isolado de marketing; é canal contextual.                                                                                                                                                      |

---

### 4.5 Configuração guiada · 15 minutos

| Aspecto                  | Especificação                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intenção**             | Entry point explícito de onboarding                                                                                                                                                                                 |
| **Estado**               | Wizard de bootstrap com checklist visual                                                                                                                                                                            |
| **Acção correcta**       | `/auth` → Auth → entrada no fluxo de onboarding guiado (Bootstrap Wizard / Setup guiado) → checklist visual → Publicar. Rota pode ser `/setup-guided` ou reutilizar `/onboarding` com modo "guided".                |
| **Contratos envolvidos** | Setup guiado (GUIDED_SETUP — pode ser secção em [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) ou [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md)) |
| **Regra**                | Não é badge passivo; é portal para onboarding guiado.                                                                                                                                                               |

---

### 4.6 Modo visita (badge)

| Aspecto      | Especificação                                                      |
| ------------ | ------------------------------------------------------------------ |
| **Intenção** | Indicar que o utilizador está em modo "só a ver" (landing pública) |
| **Estado**   | Sem sessão; modo público                                           |
| **Regra**    | Badge discreto; não activa nenhum modo operacional.                |

---

## 5. Resumo: mapa estado → botão → contratos

| Botão / portal                      | Estado activado                                     | Contratos principais                                   |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Entrar em operação                  | Operacional (Trial/Billing → Bootstrap → Dashboard) | RESTAURANT_LIFECYCLE, BILLING_OPERATIONAL, GATES_FLUXO |
| Ver demonstração / Explorar sistema | Demo                                                | Demo mode, GLOBAL_UI_STATE (isDemo)                    |
| Acesso existente                    | Resumo de sessão → último modo                      | SESSION_RESUME_CONTRACT, AUTH_AND_ENTRY                |
| Fale no WhatsApp                    | Assistido (externo)                                 | ASSISTED_ACTIVATION (prática)                          |
| Configuração guiada · 15 min        | Onboarding guiado                                   | GUIDED_SETUP / Bootstrap, APPLICATION_BOOT             |
| Modo visita                         | Público                                             | PUBLIC_SITE                                            |

---

## 6. O que estava em falta (e este contrato resolve)

- **Declarar modos** (Demo / Piloto / Operacional) como conceito central e visível.
- **Botões como portais de estado**, não só como links (intenção + estado + contratos).
- **Três caminhos claros** na landing: Operar / Explorar demo / Já tenho acesso.
- **Referência explícita** aos contratos envolvidos por cada portal, para enforcement e evolução.

---

## 7. Enforcement

- **Landing (Hero, Footer, Demonstration, HowItWorks):** CTAs e labels devem reflectir a intenção deste contrato (ex.: "Explorar o Sistema (Demo)" na tela demo quando aplicável; "Já tenho acesso" como retomar contexto).
- **GlobalUIState (ou equivalente):** Deve expor `isDemo` e modo (Pilot | Operational) quando aplicável; ver [GLOBAL_UI_STATE_MAP.md](../product/GLOBAL_UI_STATE_MAP.md).
- **Core (FlowGate / TenantContext / Auth):** Fluxo pós-auth e resolução de último contexto devem ser consistentes com §4.1 e §4.3.
- **Nenhum novo botão** na landing pode activar um estado não descrito aqui sem actualizar este contrato.

---

## 8. Alterações

Para alterar a intenção de um botão, o estado que activa ou os contratos envolvidos:

1. Actualizar este documento (§4 e §5).
2. Alinhar [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md) se a rota ou destino técnico mudar.
3. Registar em [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md) se for decisão de produto ou arquitectura.

**Violação:** Botões que navegam sem declarar estado ou que misturam Demo com operação real são regressão arquitectural.

---

## Referências

- [NAVIGATION_OPERATIONAL_CONTRACT.md](./NAVIGATION_OPERATIONAL_CONTRACT.md) — mapa de estados do utilizador (5 estados) e regras de navegação operacional
- [CANONICAL_ROUTES_BY_MODE.md](./CANONICAL_ROUTES_BY_MODE.md) — mapa canónico de rotas por modo (Demo / Piloto / Operacional)
- [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md) — mapa técnico rotas e botões
- [TRIAL_MODE_CONTRACT.md](./TRIAL_MODE_CONTRACT.md) — modo Trial: nunca Core, nunca restaurante, nunca piloto
- [SESSION_RESUME_CONTRACT.md](./SESSION_RESUME_CONTRACT.md) — retoma de sessão (último contexto) para "Já tenho acesso"
- [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) — índice de contratos
- [GLOBAL_UI_STATE_MAP.md](../product/GLOBAL_UI_STATE_MAP.md) — estados globais de UI (isDemo, isPilot, etc.)
- [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md) — FlowGate, RequireOperational
- [PILOT_MODE_RUNTIME_CONTRACT.md](./PILOT_MODE_RUNTIME_CONTRACT.md) — modo piloto
- [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) — ciclo de vida do restaurante
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) — auth e destino pós-login
