# Varredura profunda e sistemática — ChefIApp

**Data:** 2026-01-29
**Objetivo:** Mapear o que está concluído, pendente, incompleto ou adiado por decisão; cruzar roadmap vs código vs documentação; identificar documentos ausentes e inconsistências narrativas.
**Regra:** Apenas auditoria; nenhuma implementação, correção ou criação de documento.

---

## 1. Resumo executivo

O projeto ChefIApp está num estado de **fase fechada** documentada em `FASE_FECHADA_NEXT.md`: build verde, fluxo Landing → Trial Guide → Dashboard → Backoffice coerente, `product_mode` persistido no Core, billing webhook → live implementado. O perímetro **fechado** cobre: arquitetura PURE DOCKER na app layer, modos trial/pilot/live na UI e no Core, proteção TPV/KDS por ModeGate, e ativação de live via webhook de billing.

**Concluído de fato:** Persistência `product_mode` (migration aplicada, RuntimeReader/Writer, Context); billing webhook (server/core-client + billing-webhook-server ACTIVE → setProductMode); Backoffice Linear (rota, sidebar, redirects /app/setup/\*); Landing, Trial Guide, Dashboard com CTAs e card "Estado do sistema"; ModeIndicator oculto em `/` e `/trial-guide`; ModeGate em TPV e KDS.

**Pendências reais (não ideias novas):** (1) Narrativa "Sistema operacional" não aplicada na copy da Landing (hero e footer ainda usam "TPV que pensa"); (2) Sandbox TPV em modo piloto só tem contrato, sem implementação; (3) Lint incremental citado como trilho opcional; (4) Documentos ONDE_ESTAMOS_AGORA e ANALISE_ROADMAP desatualizados (Billing ainda descrito como bloqueador/pendente).

**Documentos referenciados mas desatualizados ou em conflito:** ONDE_ESTAMOS_AGORA (Billing como pendente); ANALISE_ROADMAP (FASE 1 Billing bloqueador); audit/EXECUTABLE_ROADMAP (posicionamento "TPV QUE PENSA" e FASE 0 "Remover Sistema Operacional" em conflito com FASE_FECHADA_NEXT que adota "Sistema operacional", TPV enterrado).

**Documentos ausentes:** Nenhum documento listado no DOC_INDEX está ausente; DEMO_GUIDE_5MIN.md (Demo Guide 5 min) e LANDING_REFINAMENTOS.md existem. Não existe um "guia de operação ao vivo" ou "guia de piloto" operacional dedicado (apenas contrato SANDBOX_TPV_PILOT).

**Decisões conscientes de adiamento:** Sandbox TPV (contrato sem código); fluxo redirect + "confirmar assinatura" pós-checkout (opcional no contrato Billing); FASE 7 Mapa visual e FASE 8 Analytics (EXECUTABLE_ROADMAP); Lint como trilho opcional.

---

## 2. Documentos de roadmap, fases e planejamento localizados

| Documento                                  | Localização                           | Tipo                         |
| ------------------------------------------ | ------------------------------------- | ---------------------------- |
| FASE_FECHADA_NEXT                          | docs/FASE_FECHADA_NEXT.md             | Fase atual + próximos passos |
| DOC_INDEX                                  | docs/DOC_INDEX.md                     | Índice documentação          |
| BILLING_PRODUCT_MODE_CONTRACT              | docs/BILLING_PRODUCT_MODE_CONTRACT.md | Contrato                     |
| SANDBOX_TPV_PILOT_CONTRACT                 | docs/SANDBOX_TPV_PILOT_CONTRACT.md    | Contrato                     |
| BACKOFFICE_LINEAR_SPEC                     | docs/BACKOFFICE_LINEAR_SPEC.md        | Spec                         |
| ONDE_ESTAMOS_AGORA                         | docs/ONDE_ESTAMOS_AGORA.md            | Estado atual (desatualizado) |
| ANALISE_ROADMAP                            | docs/ANALISE_ROADMAP.md               | Análise roadmaps             |
| EXECUTABLE_ROADMAP                         | docs/audit/EXECUTABLE_ROADMAP.md      | Roadmap por fases            |
| roadmap/COMPLETION                         | docs/roadmap/COMPLETION.md            | Conclusão Multi-Tenant       |
| roadmap/MASTER_DOCUMENT, INDEX, NEXT_STEPS | docs/roadmap/                         | Roadmap Multi-Tenant         |
| ESTADO_ATUAL_2026_01_28                    | docs/ESTADO_ATUAL_2026_01_28.md       | Checkpoint                   |
| LANDING_PAGE_MINIMA                        | docs/LANDING_PAGE_MINIMA.md           | Spec landing                 |
| GUIA_VALIDACAO_RUNTIME                     | docs/GUIA_VALIDACAO_RUNTIME.md        | Checklist validação          |
| STATE_PURE_DOCKER_APP_LAYER                | docs/STATE_PURE_DOCKER_APP_LAYER.md   | Contrato ativo               |
| DASHBOARD_MODO_VENDA                       | docs/DASHBOARD_MODO_VENDA.md          | Spec dashboard               |

---

## 3. Itens prometidos por documento e status

### 3.1 FASE_FECHADA_NEXT.md

| Item                                     | Status          | Evidência                                                                                                                                                                    | Observação                                                          |
| ---------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Persistência product_mode no Core        | Concluído       | docker-core/schema/migrations/20260128_product_mode.sql; RuntimeReader.select inclui product_mode; RuntimeWriter.setProductMode; RestaurantRuntimeContext carrega e persiste | Migration aplicável via make migrate-product-mode                   |
| Billing (webhook → live)                 | Concluído       | server/core-client.ts setProductMode; server/billing-webhook-server.ts chama setCoreProductMode quando status ACTIVE e merchant_id                                           | Fluxo redirect + confirmar assinatura marcado como futuro opcional  |
| Sandbox TPV em modo piloto               | Contrato apenas | docs/SANDBOX_TPV_PILOT_CONTRACT.md                                                                                                                                           | Não implementado; opções (mesa piloto, teto, flag origin) a definir |
| Lint incremental                         | Não iniciado    | Citado como trilho opcional                                                                                                                                                  | Decisão consciente de fazer por área                                |
| Build verde, fluxo coerente              | Concluído       | App.tsx rotas /, /trial-guide, /dashboard, /app/backoffice; redirects /app/setup/\*                                                                                          | —                                                                   |
| ModeGate TPV/KDS                         | Concluído       | TPVMinimal.tsx e KDSMinimal.tsx usam ModeGate allow={["pilot","live"]}                                                                                                       | —                                                                   |
| ModeIndicator oculto em / e /trial-guide | Concluído       | ModeIndicator.tsx HIDE_INDICATOR_PATHS = ["/", "/trial-guide"]                                                                                                               | —                                                                   |

### 3.2 BILLING_PRODUCT_MODE_CONTRACT.md

| Item                                                                | Status             | Evidência                                                                                                                                                                                                                                                            | Observação                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend atualiza product_mode para live quando pagamento confirmado | Concluído          | billing-webhook-server.ts + core-client.ts                                                                                                                                                                                                                           | —                                                                                                                                                                          |
| Não ativar live por botão na UI sem backend                         | Concluído          | UI tem "Ativar ao vivo" mas persiste via RuntimeWriter; contrato proíbe ativar live sem confirmação — na prática o botão existe e chama setProductMode (permite live pela UI em Docker); o contrato diz "não ativar live por botão na UI sem confirmação no backend" | Parcial: botão "Ativar ao vivo" no Dashboard/Backoffice altera Core diretamente; regra de ouro é "confirmação de pagamento é fonte de verdade", não que o botão não exista |
| Redirect + confirmar assinatura                                     | Adiado por decisão | Contrato diz "Futuro"                                                                                                                                                                                                                                                | Opcional                                                                                                                                                                   |

### 3.3 SANDBOX_TPV_PILOT_CONTRACT.md

| Item                                     | Status          | Evidência                                         | Observação       |
| ---------------------------------------- | --------------- | ------------------------------------------------- | ---------------- |
| Definir mesa piloto / teto / flag origin | Contrato apenas | Doc descreve opções; nenhum código em TPV ou Core | Não implementado |
| UI aviso "Modo piloto" no TPV            | Não iniciado    | —                                                 | —                |
| Core/RPC validar mesa piloto ou teto     | Não iniciado    | —                                                 | —                |

### 3.4 BACKOFFICE_LINEAR_SPEC.md

| Item                                                                         | Status    | Evidência                                                          | Observação |
| ---------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------ | ---------- |
| Sidebar com 9 itens (Cardápio a Preferências)                                | Concluído | BackofficePage.tsx items[] com mesmos itens e rotas                | —          |
| Rotas /app/setup/\* redirecionando para telas existentes                     | Concluído | App.tsx Navigate to /menu-builder, /operacao, /config/people, etc. | —          |
| Estado por item (incompleto/parcial/pronto) derivado de setup_status/módulos | Concluído | BackofficePage has(), hasModule(), status por item                 | —          |
| Card de modo e setProductMode no Backoffice                                  | Concluído | BackofficePage.tsx setProductMode("pilot") e ("live")              | —          |

### 3.5 ONDE_ESTAMOS_AGORA.md

| Item                                   | Status        | Evidência                                                       | Observação                                           |
| -------------------------------------- | ------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| "Próximo bloqueador: FASE 1 — Billing" | Desatualizado | FASE_FECHADA_NEXT e código mostram Billing webhook implementado | Doc não foi atualizado após implementação do webhook |
| Checklist "Completar FASE 1 — Billing" | Desatualizado | Idem                                                            | —                                                    |

### 3.6 ANALISE_ROADMAP.md

| Item                                               | Status        | Evidência                                                          | Observação                                     |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| "Próximo bloqueador: FASE 1 — Billing (2-3 horas)" | Desatualizado | Billing webhook já implementado                                    | —                                              |
| "FASE 1 — Billing: 90%"                            | Parcial       | Código webhook existe; deploy/testes manuais podem estar pendentes | Numeração de fases difere de FASE_FECHADA_NEXT |

### 3.7 docs/audit/EXECUTABLE_ROADMAP.md

| Item                                               | Status                  | Evidência                                                                                               | Observação                                                                                                  |
| -------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Posicionamento "TPV QUE PENSA"                     | Conflito com fase atual | FASE_FECHADA_NEXT e validação final adotam "Sistema operacional", "TPV enterrado"                       | Documento de auditoria anterior; não atualizado                                                             |
| FASE 0 "Remover referências a Sistema Operacional" | Conflito                | Fase atual adotou "Sistema operacional" como narrativa                                                  | —                                                                                                           |
| FASE 1 Billing (checklist detalhado)               | Parcial                 | Billing webhook → live implementado; Edge Functions / RequireActivation não verificados nesta varredura | Roadmap fala de BillingStep, TrialStart, CheckoutStep, RequireActivation — escopo mais largo que só webhook |

---

## 4. Cruzamento roadmap vs código

| Afirmação em doc                               | No código? | Observação                                                                                        |
| ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| product_mode em gm_restaurants                 | Sim        | Coluna na migration 20260128; RuntimeReader/Writer; Context                                       |
| Billing ACTIVE → product_mode live             | Sim        | billing-webhook-server.ts + core-client.ts                                                        |
| Landing → Trial Guide → Dashboard → Backoffice | Sim        | App.tsx rotas e redirects                                                                         |
| TPV/KDS bloqueados em trial                    | Sim        | ModeGate allow={["pilot","live"]} em TPVMinimal e KDSMinimal                                      |
| ModeIndicator oculto em / e /trial-guide       | Sim        | HIDE_INDICATOR_PATHS                                                                              |
| Card "Estado do sistema" no Dashboard          | Sim        | EstadoDoSistemaCard em DashboardPortal.tsx                                                        |
| Backoffice com setProductMode                  | Sim        | BackofficePage botões Ativar piloto / Ativar ao vivo                                              |
| Sandbox TPV (mesa piloto, teto, flag)          | Não        | Apenas contrato                                                                                   |
| Narrativa "Sistema operacional" em toda a UI   | Não        | LandingPage.tsx hero: "O único TPV que pensa antes do humano"; footer: "ChefIApp — TPV que pensa" |
| DEMO_GUIDE_5MIN.md existe                      | Sim        | docs/DEMO_GUIDE_5MIN.md (Demo Guide 5 min)                                                        |
| LANDING_REFINAMENTOS.md existe                 | Sim        | docs/LANDING_REFINAMENTOS.md                                                                      |

---

## 5. Auditoria de documentação

### 5.1 Documentos referenciados no DOC_INDEX e existência

| Referência no DOC_INDEX          | Existe? |
| -------------------------------- | ------- |
| STATE_PURE_DOCKER_APP_LAYER.md   | Sim     |
| SUPABASE_EM_MODO_DOCKER.md       | Sim     |
| SETUP_LINEAR_VS_SYSTEM_TREE.md   | Sim     |
| BACKOFFICE_LINEAR_SPEC.md        | Sim     |
| contracts/\* (5 arquivos)        | Sim     |
| SYSTEM_TREE.md                   | Sim     |
| GUIA_VALIDACAO_RUNTIME.md        | Sim     |
| BILLING_PRODUCT_MODE_CONTRACT.md | Sim     |
| SANDBOX_TPV_PILOT_CONTRACT.md    | Sim     |
| LANDING_PAGE_MINIMA.md           | Sim     |
| LANDING_REFINAMENTOS.md          | Sim     |
| DASHBOARD_MODO_VENDA.md          | Sim     |
| DEMO_GUIDE_5MIN.md               | Sim     |
| DEMO_GUIDE_V1.md                 | Sim     |
| FASE_FECHADA_NEXT.md             | Sim     |
| ESTADO_ATUAL_2026_01_28.md       | Sim     |

Nenhum documento listado no DOC_INDEX está ausente.

### 5.2 Documentos esperados (implícitos) e status

| Documento esperado                                        | Existe?            | Motivo                                                                              |
| --------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| Guia operacional "Como operar em modo piloto"             | Não                | SANDBOX_TPV_PILOT é contrato; não há guia de uso para piloto                        |
| Guia operacional "Como ativar ao vivo" (checklist deploy) | Não como doc único | BILLING_PRODUCT_MODE_CONTRACT descreve fluxo; não há checklist operacional dedicado |
| Guia de rollback / reversão de product_mode               | Não                | Contrato fala em transições raras; não há doc de rollback                           |
| Documento único "O que está completo até hoje"            | Parcial            | FASE_FECHADA_NEXT e ESTADO_ATUAL_2026_01_28; ONDE_ESTAMOS_AGORA desatualizado       |

### 5.3 Inconsistências entre documentos

- **ONDE_ESTAMOS_AGORA** e **ANALISE_ROADMAP**: tratam Billing como bloqueador/pendente; o código e FASE_FECHADA_NEXT tratam Billing (webhook → live) como implementado.
- **EXECUTABLE_ROADMAP** (audit): posicionamento "TPV QUE PENSA" e FASE 0 "Remover Sistema Operacional"; **FASE_FECHADA_NEXT** e validação final: narrativa "Sistema operacional", "TPV enterrado".
- **LANDING_PAGE_MINIMA.md**: copy do hero documenta "O TPV que diz o que você precisa fazer agora"; **FASE_FECHADA_NEXT**: "Narrativa: Sistema operacional (não 'TPV' como produto)". O código da Landing mantém "O único TPV que pensa antes do humano" e footer "TPV que pensa".

---

## 6. Auditoria de estados críticos do sistema

| Estado crítico                                    | Fechado (implementado) | Só conceitual (contrato/doc) | Observação                                                                                               |
| ------------------------------------------------- | ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| product_mode (trial/pilot/live)                   | Sim                    | —                            | Core, Context, UI (Dashboard, Backoffice)                                                                |
| Billing → live                                    | Sim                    | —                            | Webhook server-side; redirect+confirmar opcional                                                         |
| Piloto (sandbox: mesa/teto/flag)                  | —                      | Sim                          | SANDBOX_TPV_PILOT_CONTRACT apenas                                                                        |
| Persistência no Core                              | Sim                    | —                            | product_mode, setup_status, módulos                                                                      |
| Segurança / permissões (quem pode setProductMode) | Parcial                | —                            | UI chama setProductMode sem camada de permissão explícita no Core; webhook usa merchant_id dos metadados |
| Rollback / reversão de modo                       | Não                    | —                            | Nenhum fluxo documentado ou implementado para voltar de live para pilot/trial                            |

---

## 7. Consistência narrativa

| Área                                           | Narrativa desejada (FASE_FECHADA_NEXT)             | Estado real no código/docs                                                                            |
| ---------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Landing hero                                   | Sistema operacional (não TPV como produto)         | LandingPage.tsx: "O único TPV que pensa antes do humano"                                              |
| Landing footer                                 | —                                                  | "ChefIApp — TPV que pensa"                                                                            |
| Trial Guide                                    | Sistema operacional, 3 passos Observe/Pense/Sugira | Rota /trial-guide: "Como o sistema operacional organiza decisões"; sem menção a TPV no copy principal |
| Dashboard                                      | Estado do sistema, modos, CTAs                     | Copy "Estado do sistema", TRIAL/PILOTO/AO VIVO; coerente                                              |
| Backoffice                                     | Transições raras e contratuais                     | Copy presente; coerente                                                                               |
| Docs (FASE_FECHADA_NEXT, validação)            | Sistema operacional, TPV enterrado                 | Consistente entre si                                                                                  |
| Docs (EXECUTABLE_ROADMAP, LANDING_PAGE_MINIMA) | TPV que pensa / TPV que diz                        | Conflito com narrativa atual                                                                          |

Resquícios de narrativa antiga: "TPV que pensa", "O único TPV que pensa antes do humano" na Landing (código); "TPV QUE PENSA" e "Remover Sistema Operacional" no EXECUTABLE_ROADMAP; LANDING_PAGE_MINIMA descreve headline com "TPV".

---

## 8. Tabela consolidada: Item | Status | Evidência | Observação

| Item                                                 | Status       | Evidência                                                             | Observação                     |
| ---------------------------------------------------- | ------------ | --------------------------------------------------------------------- | ------------------------------ |
| Persistência product_mode (Core)                     | Concluído    | 20260128_product_mode.sql; RuntimeReader/Writer; Context              | —                              |
| Billing webhook → live                               | Concluído    | server/core-client.ts; billing-webhook-server ACTIVE → setProductMode | —                              |
| Fluxo Landing → Trial Guide → Dashboard → Backoffice | Concluído    | App.tsx; rota /trial-guide; DashboardPortal; BackofficePage           | —                              |
| Backoffice Linear (sidebar + redirects)              | Concluído    | BackofficePage; App.tsx /app/setup/\*                                 | —                              |
| ModeGate TPV/KDS (trial bloqueado)                   | Concluído    | TPVMinimal.tsx; KDSMinimal.tsx ModeGate allow pilot/live              | —                              |
| ModeIndicator oculto em / e /trial-guide             | Concluído    | ModeIndicator.tsx HIDE_INDICATOR_PATHS                                | —                              |
| Card Estado do sistema no Dashboard                  | Concluído    | EstadoDoSistemaCard; setProductMode pilot/live                        | —                              |
| Sandbox TPV em piloto                                | Não iniciado | SANDBOX_TPV_PILOT_CONTRACT apenas                                     | Contrato; opções a implementar |
| Narrativa "Sistema operacional" na Landing           | Incompleto   | LandingPage.tsx ainda usa "TPV que pensa" no hero e footer            | Pendência real                 |
| ONDE_ESTAMOS_AGORA atualizado                        | Incompleto   | Doc ainda cita Billing como bloqueador                                | Desatualizado                  |
| ANALISE_ROADMAP atualizado                           | Incompleto   | Doc ainda cita FASE 1 Billing como bloqueador                         | Desatualizado                  |
| Redirect + confirmar assinatura (Billing)            | Adiado       | BILLING_PRODUCT_MODE_CONTRACT "Futuro"                                | Decisão consciente             |
| Lint incremental                                     | Não iniciado | Trilho opcional em FASE_FECHADA_NEXT                                  | Decisão consciente             |
| Rollback / reversão de modo                          | Não existe   | Nenhum doc nem código                                                 | Não planejado no contrato      |

---

## 9. Pendências reais (não ideias novas)

1. **Copy da Landing:** Ajustar hero e footer para a narrativa "Sistema operacional" (ou manter TPV por decisão explícita e alinhar documentos).
2. **Sandbox TPV em piloto:** Implementar uma das opções do SANDBOX_TPV_PILOT_CONTRACT (mesa piloto, teto ou flag no Core) se o trilho for escolhido.
3. **Documentos desatualizados:** Atualizar ONDE_ESTAMOS_AGORA e ANALISE_ROADMAP para refletir que o webhook de Billing (ACTIVE → live) está implementado; opcionalmente alinhar EXECUTABLE_ROADMAP e LANDING_PAGE_MINIMA à narrativa "Sistema operacional" ou marcar como histórico.

---

## 10. Documentos ausentes ou incompletos

- **Ausentes:** Guia operacional de piloto; guia operacional de ativação ao vivo (checklist); guia de rollback de product_mode. Razão plausível: contrato primeiro, guias operacionais em etapa futura ou por demanda.
- **Incompletos:** ONDE_ESTAMOS_AGORA (Billing ainda como pendente); ANALISE_ROADMAP (mesmo ponto); LANDING_PAGE_MINIMA (copy do hero descreve TPV, em conflito com FASE_FECHADA_NEXT).

---

## 11. Decisões conscientes de adiamento

- Sandbox TPV em modo piloto: contrato definido; implementação adiada.
- Fluxo redirect + "confirmar assinatura" após checkout: opcional no BILLING_PRODUCT_MODE_CONTRACT.
- Lint incremental: trilho opcional, sem prazo.
- FASE 7 (Mapa visual) e FASE 8 (Analytics): adiados no EXECUTABLE_ROADMAP.
- Rollback de product_mode: não descrito nos contratos como requisito.

---

## 12. O projeto pode ser considerado completo até onde?

**Perímetro fechado:**

- App layer PURE DOCKER (merchant-portal fala com Core via PostgREST; sem Supabase/GoTrue no fluxo de runtime descrito).
- Fluxo comercial: Landing (`/`) → Trial Guide (`/trial-guide`) → Dashboard (`/dashboard`) → Backoffice (`/app/backoffice`) com rotas e redirects /app/setup/\*.
- Modos de produto: trial, pilot, live persistidos em `gm_restaurants.product_mode`; lidos e escritos pelo Runtime; exibidos e alteráveis na UI (Dashboard e Backoffice); ativação de live via webhook de billing implementada.
- Proteção: TPV e KDS bloqueados em modo trial (ModeGate); ModeIndicator oculto em Landing e Trial Guide.
- Backoffice Linear: sidebar com itens da spec, estados derivados de setup_status e módulos, transições de modo (piloto/live) por botão.
- Documentação de fase: FASE_FECHADA_NEXT e contratos BILLING e SANDBOX alinhados ao estado acima; DOC_INDEX e ESTADO_ATUAL_2026_01_28 referenciam o checkpoint.

**Fora do perímetro fechado (próximo ponto lógico de retomada):**

- Alinhar narrativa na Landing (copy hero/footer) com "Sistema operacional" ou formalizar decisão de manter "TPV que pensa".
- Atualizar ONDE_ESTAMOS_AGORA e ANALISE_ROADMAP para refletir Billing webhook implementado.
- Se o trilho piloto for escolhido: implementar sandbox TPV conforme SANDBOX_TPV_PILOT_CONTRACT (uma das opções).
- Se o trilho lint for escolhido: correções incrementais por área, sem refatorar comportamento.

**Conclusão:** O projeto está completo no perímetro "fase fechada" definido acima. As pendências listadas são ajustes de documentação/copy e trilhos opcionais (sandbox TPV, lint), não correções de escopo já prometido.
