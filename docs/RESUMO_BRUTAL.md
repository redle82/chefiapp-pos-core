# Resumo brutal — o que foi feito

**Um único documento.** Factos. Sem discurso.

---

## 1. Leis invisíveis (7 metacontratos)

| # | Documento | Estado |
|---|-----------|--------|
| 1 | CORE_FAILURE_MODEL.md | ✅ Enforcement em código (ver secção 3) |
| 2 | CORE_TRUTH_HIERARCHY.md | Documentado; enforcement quando dor |
| 3 | CORE_TIME_GOVERNANCE_CONTRACT.md | Documentado; enforcement quando dor |
| 4 | CORE_SYSTEM_AWARENESS_MODEL.md | Documentado; enforcement quando dor |
| 5 | CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md | Documentado; enforcement quando dor |
| 6 | CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md | Documentado; enforcement quando dor |
| 7 | CORE_SILENCE_AND_NOISE_POLICY.md | Documentado; enforcement quando dor |

Índice central: **CORE_INVISIBLE_LAWS_INDEX.md**.

---

## 2. Documentos de estado e mapa

| Documento | Função |
|-----------|--------|
| **CORE_STATE.md** | Resposta única "onde estamos?" — núcleo operacional, 7 leis, parciais, callers executeSafe, próximo passo. |
| **CORE_OS_LAYERS.md** | Mapa das 9 camadas (Kernel, Contratos, Runtime, Terminais, Governança, Observabilidade, Autonomia, Evolução, Ecossistema); estado por camada; tabela ChefIApp vs Toast / Lightspeed / ServiceNow / Palantir. |
| **CORE_CONTRACT_INDEX.md** | Índice de contratos; link para CORE_OS_LAYERS no topo. |
| **CORE_CONTRACT_COVERAGE.md** | Cobertura por área (🟢 TEM / 🟡 PARCIAL / 🔴 NÃO TEM). |
| **CONTRACT_ENFORCEMENT.md** | Onde cada contrato está aplicado no código (secções 1–17). |
| **CORE_DECISION_LOG.md** | Decisões com data; inclui criação do mapa (CORE_OS_LAYERS). |

Caminhos de leitura: CORE_STATE → CORE_OS_LAYERS; CORE_CONTRACT_INDEX → CORE_OS_LAYERS; CORE_DECISION_LOG regista o mapa.

---

## 3. CORE_FAILURE_MODEL em código

| Componente | O que faz |
|------------|-----------|
| **FailureClassifier.ts** | `classifyFailure(err)` → `acceptable` \| `degradation` \| `critical`. |
| **KernelContext.tsx** | `executeSafe()` em catch chama `classifyFailure`; retorna `failureClass` e `classifiedReason`; kernel não READY → `degradation`. |
| **ProductContext.tsx** | `addProduct` usa `executeSafe`; em critical define `lastError`; expõe `lastError` e `clearLastError`. |
| **Scene4Beverages.tsx, Scene5Cuisine.tsx** | Mostram `lastError` com `role="alert"` e botão fechar. |
| **SyncEngine.ts** | Em `processItem` catch: `classifyFailure`; critical → dead_letter; aceitável/degradation → retry com backoff. |
| **OrderProcessingService.ts** | Aceita `executeSafe?`; propaga `failureClass` no Error. |
| **CashRegister.ts** | open/close aceitam `executeSafe?`; propagam `failureClass`. |
| **MenuBootstrapService.ts** | `injectPreset` aceita `executeSafe?`; propaga `failureClass`. |
| **OrderContextReal.tsx** | openCashRegister/closeCashRegister (RPC) no catch chamam `classifyFailure`; anexam `err.failureClass` e `err.classifiedReason`. |
| **TPV.tsx** | Catch de abrir/fechar caixa: se `failureClass === 'degradation'` → "Problema de rede. Tente novamente em instantes."; se `acceptable` → msg + "Pode tentar novamente."; senão → mensagem do erro. |

---

## 4. Escopo e estratégia

| Documento | Conteúdo |
|-----------|----------|
| **SCOPE_FREEZE.md** | Congelamento de escopo; slide Arquitetura vs. Escopo; FASE 1–6 (Billing, Onboarding, Now Engine, Gamificação, Polimento, Impressão); referências FASE 2/3/4/5/6; links para checklists. |
| **VALIDATION_CHECKLIST_FASE_1_3.md** | Checklist acionável: FASE 1 Billing, FASE 2 Onboarding até primeira venda, FASE 3 TPV + caixa. |
| **VALIDATION_CHECKLIST_FASE_5_POLISH.md** | Checklist VPC/OUC: pontos de contacto (Shell, PanelRoot, Dashboard, Billing, AppStaff, KDS, TPV, Config, MenuBuilder). |
| **IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md** | O que implementar quando houver cliente/impressora: fila Core, API, templates, retry, driver, UI pede e mostra estado. |
| **NEXT_ACTIONS.md** | Ordem: 1) Validar FASE 1–3, 2) Polimento FASE 5, 3) FASE 6 quando houver cliente; já feito (Failure Model, FASE 4, checklists, build). |

---

## 5. UI / produto

| Item | Estado |
|------|--------|
| **FASE 4 — Gamificação** | GamificationPanel acessível em `/garcom`, tab «Pontos». |
| **AppStaffMinimal** | Tab "Pontos" com GamificationPanel. |
| **BillingPage** | Rota `/app/billing`; PaymentGuard Safe Harbor; VPC local. |

---

## 6. Índices e referências cruzadas

- CORE_STATE → CORE_OS_LAYERS, CORE_CONTRACT_INDEX, CONTRACT_ENFORCEMENT, CORE_DECISION_LOG, SCOPE_FREEZE, NEXT_ACTIONS.
- CORE_CONTRACT_INDEX → CORE_OS_LAYERS, cobertura, design policy.
- CONTRACT_ENFORCEMENT → CORE_STATE; secção 11 (Failure Model) com OrderContextReal + TPV.
- SCOPE_FREEZE → CORE_STATE; checklists FASE 1–3, FASE 5, FASE 6.
- README.md → docs/strategy/NEXT_ACTIONS.md em "Next Steps → References".

---

## 7. Build

- `merchant-portal`: `npm run build` executado com sucesso; constitution validator OK; pronto para executar checklist FASE 1–3 em ambiente real/staging.

---

## 8. O que NÃO foi feito (de propósito)

- Enforcement das outras 6 leis invisíveis (Verdade, Tempo, Consciência, Autoridade, Evolução, Silêncio): só quando dor concreta.
- Fechar camadas 🟡 do CORE_OS_LAYERS agora: mapa é bússola, não backlog.
- Transformar o mapa em plano de execução.

---

## 9. Estado real (uma frase)

**Arquitetura madura; núcleo operacional fechado; terminais correctos; scope protegido; próximos passos = validar FASE 1–3, polimento FASE 5, FASE 6 quando houver cliente.**
