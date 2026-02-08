# Contrato de Vida do Restaurante (v2)

**Propósito:** Fonte única de verdade para "em que ponto da vida do restaurante estamos". Define os estados canónicos da jornada (Visitor → Bootstrap → Operação), a matriz fase ↔ rota e as regras de transição. Todo o sistema (FlowGate, CoreFlow, rotas) deve obedecer a este contrato.

**Não confundir com:** [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md), que trata de **configured / published / operational** (acesso a TPV/KDS). Este contrato trata da **jornada do utilizador** até o restaurante estar pronto.

**v2:** Eliminados estados DEMO_GUIDED e DEMO_FINISHED. Demo guiado (3 min) é experiência inicial do trial, com dados reais do restaurante; opcionalmente acessível após bootstrap como "Primeiros 3 minutos do teu restaurante". Um único fluxo: Landing → Auth → Bootstrap → (Demo guiado com restaurante) → Operação → Billing.

---

## 1. Estados canónicos (RestaurantLifecycleState)

| Estado                    | Descrição breve                                                  | Quem está aqui                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **VISITOR**               | Ainda não comprometido; pode ver landing e opcionalmente demo.   | Anónimo. Pode aceder a `/`, `/auth`, `/demo-guiado` (atalho "ver antes de criar"). Destino canónico com "Começar agora" → `/auth` → `/bootstrap`. |
| **BOOTSTRAP_REQUIRED**    | Deve passar pelo bootstrap (ainda não entrou).                   | Autenticado, sem restaurante criado.                                                                                                   |
| **BOOTSTRAP_IN_PROGRESS** | A fazer o bootstrap; não pode fugir para dashboard/TPV.          | Em `/bootstrap` ou `/onboarding/first-product` até concluir.                                                                           |
| **READY_TO_OPERATE**      | Restaurante pronto; aplicam-se configured/published/operational. | Bootstrap concluído; trial 14 dias; resto do sistema.                                                                                   |

---

## 2. Regra de ouro

- **Se estado != READY_TO_OPERATE:** todas as rotas que não forem permitidas na fase atual redirecionam para o **destino canónico da fase** (ex.: em BOOTSTRAP_REQUIRED / BOOTSTRAP_IN_PROGRESS → `/bootstrap` até concluir).
- **Demo guiado:** experiência "Primeiros 3 minutos do teu restaurante"; acessível como rota pública (`/demo-guiado`) ou após bootstrap; ao sair, redireciona para `/auth` (sem estado especial). Não existe "modo demo" paralelo.
- **Bootstrap:** fluxo único, linear, sem "fuga" para dashboard ou operação até estar completo.

---

## 3. Matriz: Fase → Rotas permitidas

| Fase                      | Rotas permitidas                                                                                | Redirecionamento se não permitido                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **VISITOR**               | `/`, `/landing`, `/pricing`, `/features`, `/demo-guiado`, `/demo`, `/auth`, `/help/start-local` | Redirecionar para `/`. Com "Começar agora" → `/auth` → `/bootstrap`.                                              |
| **BOOTSTRAP_REQUIRED**    | `/bootstrap`, `/auth`, `/onboarding/first-product`. Destino canónico: `/bootstrap`.             | Redirecionar para `/bootstrap`. Permitir `/auth` para logout.                                                      |
| **BOOTSTRAP_IN_PROGRESS** | `/bootstrap`, `/auth`, `/onboarding/first-product`.                                            | Nada de `/dashboard`, `/op/tpv` até bootstrap concluído. Redirecionar para `/bootstrap`.                          |
| **READY_TO_OPERATE**      | Todas as rotas operacionais e de gestão.                                                        | Conforme [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) (configured / published / operational). |

---

## 4. Transições

| De                    | Para                  | Gatilho                                                                               |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| VISITOR               | BOOTSTRAP_REQUIRED    | Auth (registo/login) sem restaurante → destino canónico `/bootstrap`.                 |
| BOOTSTRAP_REQUIRED    | BOOTSTRAP_IN_PROGRESS | Entra em `/bootstrap`.                                                                |
| BOOTSTRAP_IN_PROGRESS | READY_TO_OPERATE      | Bootstrap concluído (tenant criado e selado) → ex.: `/app/dashboard` ou `/dashboard`.  |
| READY_TO_OPERATE      | —                     | Aplica-se o contrato atual de Lifecycle (TPV/KDS conforme published/operational).     |

---

## 5. Mapa do sistema (orientação constante)

- Em **BOOTSTRAP_IN_PROGRESS** deve existir indicador sempre visível do tipo: **"Passo X de Y — Configurando o seu restaurante"** (ou equivalente).
- **Demo guiado:** "Passo X de 4" no fluxo de 3 min; pode ser mostrado antes ou depois do bootstrap como "Primeiros 3 minutos do teu restaurante" (dados reais ou seed).

### Copy sugerida (bootstrap)

- **BOOTSTRAP_REQUIRED:** "Antes de começar, precisamos de 3 minutos para configurar o seu restaurante."
- **BOOTSTRAP_IN_PROGRESS:** "Passo X de Y — a configurar o seu restaurante."

---

## 6. O que fica de fora (não é este contrato)

- Supabase, Stripe, Docker, erros 404, logs, React, Tailwind.
- Detalhe de configured/published/operational (já coberto por RESTAURANT_LIFECYCLE_CONTRACT).
- productMode/dataMode (dados simulados vs reais) — ver FASE_5_DATA_MODE; não é estado de vida.

---

## 7. Fluxo único (resumo)

```mermaid
flowchart LR
  VISITOR[VISITOR]
  BOOTSTRAP_REQ[BOOTSTRAP_REQUIRED]
  BOOTSTRAP_PROG[BOOTSTRAP_IN_PROGRESS]
  READY[READY_TO_OPERATE]

  VISITOR -->|"Auth sem org"| BOOTSTRAP_REQ
  BOOTSTRAP_REQ -->|"/bootstrap"| BOOTSTRAP_PROG
  BOOTSTRAP_PROG -->|"Bootstrap concluído"| READY
```

Landing → Auth → Bootstrap (linear) → [Demo guiado com teu restaurante, opcional] → Operação → Billing. Um único sistema; um único estado; uma única verdade.
